const { GoogleGenerativeAI } = require('@google/generative-ai');
const { generateRecoveryEmail } = require('./messageGenerator');
const { sendRecoveryEmail } = require('./emailService');
const { saveRecoveryAttempt, updateCartStatus, getHistoricalStats, getCart } = require('../db/queries');
const logger = require('../utils/logger');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function handleAbandonedCart(cartData) {
  try {
    // Get historical performance data for context
    const stats = await getHistoricalStats(cartData.user_type);

    // Build the decision prompt
    const decisionPrompt = buildDecisionPrompt(cartData, stats);

    logger.info(`🧠 Agent thinking about cart ${cartData.shopify_checkout_id}...`);

    // Call Gemini for the decision
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    const result = await model.generateContent(decisionPrompt);
    const rawText = result.response.text();

    // Debug: log first 300 chars so we can see what Gemini actually returned
    logger.info(`🔍 Raw Gemini response: ${rawText.substring(0, 300)}`);
    
    let decision;
    try {
      // Strip markdown fences, control chars, then extract the first {...} block
      let cleanText = rawText
        .replace(/```json\s*/gi, '')
        .replace(/```/g, '')
        .replace(/[\u0000-\u001F\u007F]+/g, ' ')
        .trim();
      // If the model wrapped its JSON in text, extract just the JSON object
      const firstBrace = cleanText.indexOf('{');
      const lastBrace  = cleanText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanText = cleanText.substring(firstBrace, lastBrace + 1);
      }
      decision = JSON.parse(cleanText);
    } catch (parseError) {
      logger.warn(`JSON Parse error: ${parseError.message}. Raw (first 500): ${rawText.substring(0, 500)}`);
      decision = {
        action: 'send_now',
        delay_hours: 0,
        message_type: 'reminder',
        discount_percent: 0,
        tone: 'friendly',
        reasoning: 'Fallback decision due to parse error'
      };
    }

    // IMPROVEMENT 6: Log confidence and risk alongside core decision fields
    logger.info(`🤖 Agent Decision: Action=${decision.action}, Type=${decision.message_type}, Delay=${decision.delay_hours}h, Confidence=${decision.confidence}, Risk=${decision.risk}`);
    logger.info(`   Reasoning: "${decision.reasoning}"`);

    // If agent decides to skip, log and exit
    if (decision.action === 'skip') {
      logger.info(`⏭️  Agent chose to skip this cart.`);
      await updateCartStatus(cartData.shopify_checkout_id, 'lost');
      return;
    }

    // Wait for the decided delay
    if (decision.delay_hours > 0) {
      // FIX 3: Explicit DEMO_MODE guard — 1 "hour" = 1 second in demo, real hours in production
      const delayMs = process.env.DEMO_MODE === 'true'
        ? decision.delay_hours * 1000
        : decision.delay_hours * 3600 * 1000;
      logger.info(`⏳ Waiting ${process.env.DEMO_MODE === 'true' ? decision.delay_hours + 's (DEMO)' : decision.delay_hours + 'h (PROD)'}...`);
      await sleep(delayMs);
    }

    // Generate personalized email using Gemini (has its own fallback — never throws)
    const emailContent = await generateRecoveryEmail(cartData, decision);

    // ── Save the record FIRST so it always appears in the dashboard ──
    await saveRecoveryAttempt({
      cart_id: cartData.id,
      attempt_number: 1,
      message_type: decision.message_type,
      discount_percent: decision.discount_percent || 0,
      agent_reasoning: decision.reasoning,
      email_subject: emailContent.subject,
      email_body: emailContent.body,
      delay_hours_used: decision.delay_hours,
      confidence: decision.confidence ?? null,
      risk: decision.risk ?? null,
      cart_value: cartData.cart_value,
      user_type: cartData.user_type,        // ← fix for ₹undefined | undefined in dashboard
      customer_email: cartData.customer_email,
      converted: false
    });

    await updateCartStatus(cartData.shopify_checkout_id, 'in_recovery');

    // Send the email (after saving — delivery failure won't hide the record)
    await sendRecoveryEmail(
      cartData.customer_email,
      cartData.customer_name,
      emailContent
    );

    logger.info(`✅ Recovery attempt 1 sent for cart ${cartData.shopify_checkout_id}`);

    // --- ESCALATION: SCHEDULE ATTEMPT 2 ---
    // The setTimeout below handles demo-mode rapid testing (24 hours = 12 minutes).
    // The escalationChecker.js cron handles production multi-day follow-ups.
    // In production both use 24h windows; the cron acts as a safety net after 
    // server restarts; double-sending is prevented by the attempt count check 
    // in escalationChecker.js (attempts.length === 1 condition).
    const escalationDelayHours = 24;
    const escalationDelayMs = process.env.DEMO_MODE === 'true'
      ? escalationDelayHours * 30 * 1000 // 1 hour = 30 seconds
      : escalationDelayHours * 3600 * 1000;
      
    logger.info(`⏳ Scheduling attempt 2 in ${process.env.DEMO_MODE === 'true' ? (escalationDelayHours * 30) + 's (DEMO)' : escalationDelayHours + 'h (PROD)'}...`);

    setTimeout(async () => {
      try {
        // 1. Check if already converted
        logger.info(`🔍 Checking cart status before attempt 2...`);
        const currentCart = await getCart(cartData.shopify_checkout_id);
        if (currentCart && currentCart.status === 'converted') {
          logger.info(`⏭️ Attempt 2 skipped. Cart ${cartData.shopify_checkout_id} already converted.`);
          return;
        }

        // 2. Different message type
        const newMessageType = decision.message_type === 'reminder' ? 'discount' : 'reminder';
        logger.info(`🤖 Attempt 2: switching strategy from ${decision.message_type} → ${newMessageType}`);
        const newDecision = {
          ...decision,
          message_type: newMessageType,
          discount_percent: newMessageType === 'discount' ? 10 : 0,
          reasoning: 'Escalation attempt 2 with different strategy'
        };

        // 3. Generate email
        const emailContent2 = await generateRecoveryEmail(cartData, newDecision);

        // 4. Save attempt 2
        await saveRecoveryAttempt({
          cart_id: cartData.id,
          attempt_number: 2,
          message_type: newDecision.message_type,
          discount_percent: newDecision.discount_percent,
          agent_reasoning: newDecision.reasoning,
          email_subject: emailContent2.subject,
          email_body: emailContent2.body,
          delay_hours_used: escalationDelayHours,
          confidence: newDecision.confidence ?? null,
          risk: newDecision.risk ?? null,
          cart_value: cartData.cart_value,
          user_type: cartData.user_type,
          customer_email: cartData.customer_email,
          converted: false
        });

        // 5. Send email
        await sendRecoveryEmail(
          cartData.customer_email,
          cartData.customer_name,
          emailContent2
        );
        logger.info(`📧 Email generated: "${emailContent2.subject}"`);
        logger.info(`✅ Recovery attempt 2 sent`);

        // 6. After attempt 2, wait and mark cart as 'lost' if still not converted
        const lostDelayMs = process.env.DEMO_MODE === 'true' ? 24 * 30 * 1000 : 24 * 3600 * 1000;
        setTimeout(async () => {
          const finalCart = await getCart(cartData.shopify_checkout_id);
          if (finalCart && finalCart.status !== 'converted') {
            await updateCartStatus(cartData.shopify_checkout_id, 'lost');
            logger.info(`❌ Cart ${cartData.shopify_checkout_id} marked as lost after attempt 2.`);
          }
        }, lostDelayMs);

      } catch (err) {
        logger.error(`Attempt 2 error: ${err.message}`);
      }
    }, escalationDelayMs);

  } catch (error) {
    logger.error(`Agent error: ${error.message}`);
  }
}

function buildDecisionPrompt(cartData, stats) {
  return `
You are RecoverAI, an autonomous checkout recovery agent for an e-commerce store on Shopify.

Your job is to decide the best strategy to recover an abandoned cart.

ABANDONED CART DATA:
- Cart Value: ₹${cartData.cart_value} (${cartData.value_tier} tier)
- Customer Type: ${cartData.user_type} customer
- Product Category: ${cartData.product_category}
- Products: ${cartData.products.map(p => p.title).join(', ')}
- Time Since Abandonment: just now

HISTORICAL PERFORMANCE DATA:
${stats ? `
HISTORICAL CONVERSION RATES (use these to make your decision, not just observe them):
- Reminder emails: ${stats.reminder_rate}% conversion rate
- Discount emails: ${stats.discount_rate}% conversion rate
- Social proof emails: ${stats.social_proof_rate}% conversion rate
- Best performing strategy for ${cartData.user_type} users: ${stats.best_strategy}

INSTRUCTION: If one strategy is clearly outperforming (>10% gap), strongly prefer it.
Mention the stat in your reasoning field (e.g. "discount converts at 31% vs 12% for reminders here, so using discount").
` : '- No historical data yet. Use product and customer signals to decide.'}

DECISION RULES TO CONSIDER:
- High cart value (₹3000+) new user → delay 1 hour, no immediate discount (protect margin)
- Returning customer → avoid discounts (they know the value already)
- Low cart value → instant reminder is fine
- Electronics/high-value → premium, warm tone
- Never offer more than 10% discount

Make a smart decision. Think like a revenue-conscious product manager.

Reply ONLY with this JSON (no extra text):
{
  "action": "send_now" | "delay" | "skip",
  "delay_hours": 0,
  "message_type": "reminder" | "social_proof" | "scarcity" | "discount",
  "discount_percent": 0,
  "tone": "friendly" | "premium" | "urgent",
  "confidence": 0.0,
  "risk": "low" | "medium" | "high",
  "reasoning": "one concise sentence citing the actual cart data and any stats that drove this decision"
}
`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { handleAbandonedCart };
