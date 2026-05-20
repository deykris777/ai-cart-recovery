const Groq = require('groq-sdk');
const { generateRecoveryEmail } = require('./messageGenerator');
const { sendRecoveryEmail } = require('./emailService');
const { saveRecoveryAttempt, updateCartStatus, getHistoricalStats, getCart, getCartAttempts } = require('../db/queries');
const { getStrategyForAttempt } = require('../utils/strategyEngine');
const logger = require('../utils/logger');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function handleAbandonedCart(cartData) {
  try {
    // Get historical performance data for context
    const stats = await getHistoricalStats(cartData.user_type);

    // 1. Resolve Attempt 1 Strategy deterministically
    const strategy = getStrategyForAttempt(cartData.user_type, cartData.cart_value, 1);
    if (!strategy) {
      logger.info(`⏭️ Skipping cart ${cartData.shopify_checkout_id} — no strategy defined for Attempt 1`);
      await updateCartStatus(cartData.shopify_checkout_id, 'lost');
      return;
    }

    const { message_type, discount_percent } = strategy;

    // 2. Resolve delay deterministically
    // High cart value (₹3000+) new user → delay 1 hour, no immediate discount (protect margin)
    let delayHours = 0;
    if (cartData.user_type === 'new' && cartData.cart_value >= 3000) {
      delayHours = 1;
    }

    logger.info(`🧠 Agent analyzing cart ${cartData.shopify_checkout_id} for Attempt 1 (${message_type})...`);

    // 3. Query Gemini for reasoning, tone, confidence, risk
    const metadata = await getGeminiDecisionMetadata(cartData, stats, 1, message_type, discount_percent);

    const decision = {
      action: delayHours > 0 ? 'delay' : 'send_now',
      delay_hours: delayHours,
      message_type,
      discount_percent,
      tone: metadata.tone || (cartData.cart_value >= 3000 ? 'premium' : 'friendly'),
      confidence: metadata.confidence ?? 0.85,
      risk: metadata.risk || 'low',
      reasoning: metadata.reasoning || `Deterministic strategy selection for ${message_type}`
    };

    logger.info(`🤖 Agent Decision: Action=${decision.action}, Type=${decision.message_type}, Delay=${decision.delay_hours}h, Confidence=${decision.confidence}, Risk=${decision.risk}`);
    logger.info(`   Reasoning: "${decision.reasoning}"`);

    // If agent decides to skip (fallback)
    if (decision.action === 'skip') {
      logger.info(`⏭️ Agent chose to skip this cart.`);
      await updateCartStatus(cartData.shopify_checkout_id, 'lost');
      return;
    }

    // Wait for the decided delay
    if (decision.delay_hours > 0) {
      const delayMs = process.env.DEMO_MODE === 'true'
        ? decision.delay_hours * 1000
        : decision.delay_hours * 3600 * 1000;
      logger.info(`⏳ Waiting ${process.env.DEMO_MODE === 'true' ? decision.delay_hours + 's (DEMO)' : decision.delay_hours + 'h (PROD)'}...`);
      await sleep(delayMs);
    }

    // Check if converted during delay
    const checkCart = await getCart(cartData.shopify_checkout_id);
    if (checkCart && checkCart.status === 'converted') {
      logger.info(`⏭️ Attempt 1 skipped. Cart ${cartData.shopify_checkout_id} converted during delay.`);
      return;
    }

    // Generate personalized email using Gemini
    const emailContent = await generateRecoveryEmail(cartData, decision);

    // Save the record
    await saveRecoveryAttempt({
      cart_id: cartData.id,
      attempt_number: 1,
      message_type: decision.message_type,
      discount_percent: decision.discount_percent,
      agent_reasoning: decision.reasoning,
      email_subject: emailContent.subject,
      email_body: emailContent.body,
      delay_hours_used: decision.delay_hours,
      confidence: decision.confidence,
      risk: decision.risk,
      cart_value: cartData.cart_value,
      user_type: cartData.user_type,
      customer_email: cartData.customer_email,
      converted: false
    });

    await updateCartStatus(cartData.shopify_checkout_id, 'in_recovery');

    // Send the email
    await sendRecoveryEmail(
      cartData.customer_email,
      cartData.customer_name,
      emailContent
    );

    logger.info(`✅ Recovery attempt 1 sent for cart ${cartData.shopify_checkout_id}`);

    // Schedule next escalation attempt
    scheduleTimeoutEscalation(cartData, 2);

  } catch (error) {
    logger.error(`Agent error: ${error.message}`);
  }
}

function scheduleTimeoutEscalation(cartData, attemptNumber) {
  const escalationDelayHours = 24;
  const escalationDelayMs = process.env.DEMO_MODE === 'true'
    ? escalationDelayHours * 30 * 1000 // 1 hour = 30 seconds (24h = 12 min)
    : escalationDelayHours * 3600 * 1000;

  logger.info(`⏳ Scheduling attempt ${attemptNumber} in ${process.env.DEMO_MODE === 'true' ? (escalationDelayHours * 30) + 's (DEMO)' : escalationDelayHours + 'h (PROD)'}...`);

  setTimeout(async () => {
    try {
      // 1. Check if already converted
      const currentCart = await getCart(cartData.shopify_checkout_id);
      if (!currentCart || currentCart.status === 'converted') {
        logger.info(`⏭️ Attempt ${attemptNumber} skipped. Cart already converted or doesn't exist.`);
        return;
      }

      // 2. Check if this attempt number was already sent (prevent duplicate)
      const attempts = await getCartAttempts(cartData.id);
      if (attempts && attempts.some(a => a.attempt_number === attemptNumber)) {
        logger.info(`⏭️ Attempt ${attemptNumber} skipped. Already sent.`);
        return;
      }

      // 3. Resolve strategy deterministically
      const strategy = getStrategyForAttempt(cartData.user_type, cartData.cart_value, attemptNumber);
      if (!strategy) {
        logger.info(`🛑 No strategy defined for Attempt ${attemptNumber}. Marking cart as lost.`);
        await updateCartStatus(cartData.shopify_checkout_id, 'lost');
        return;
      }

      const { message_type, discount_percent } = strategy;
      logger.info(`🤖 Attempt ${attemptNumber}: using deterministic strategy ${message_type}`);

      // 4. Query Gemini for metadata
      const stats = await getHistoricalStats(cartData.user_type);
      const metadata = await getGeminiDecisionMetadata(cartData, stats, attemptNumber, message_type, discount_percent);

      const decision = {
        message_type,
        discount_percent,
        tone: metadata.tone || (cartData.cart_value >= 3000 ? 'premium' : 'friendly'),
        confidence: metadata.confidence ?? 0.85,
        risk: metadata.risk || 'low',
        reasoning: metadata.reasoning || `Escalation attempt ${attemptNumber}: ${message_type}`
      };

      // 5. Generate email
      const emailContent = await generateRecoveryEmail(cartData, decision);

      // 6. Save attempt
      await saveRecoveryAttempt({
        cart_id: cartData.id,
        attempt_number: attemptNumber,
        message_type: decision.message_type,
        discount_percent: decision.discount_percent,
        agent_reasoning: decision.reasoning,
        email_subject: emailContent.subject,
        email_body: emailContent.body,
        delay_hours_used: escalationDelayHours,
        confidence: decision.confidence,
        risk: decision.risk,
        cart_value: cartData.cart_value,
        user_type: cartData.user_type,
        customer_email: cartData.customer_email,
        converted: false
      });

      // 7. Send email
      await sendRecoveryEmail(
        cartData.customer_email,
        cartData.customer_name,
        emailContent
      );

      logger.info(`✅ Escalation attempt ${attemptNumber} sent`);

      // 8. Schedule next escalation or loss check
      if (attemptNumber < 3) {
        scheduleTimeoutEscalation(cartData, attemptNumber + 1);
      } else {
        const lostDelayMs = process.env.DEMO_MODE === 'true'
          ? 24 * 30 * 1000
          : 24 * 3600 * 1000;
        setTimeout(async () => {
          const finalCart = await getCart(cartData.shopify_checkout_id);
          if (finalCart && finalCart.status !== 'converted') {
            await updateCartStatus(cartData.shopify_checkout_id, 'lost');
            logger.info(`❌ Cart ${cartData.shopify_checkout_id} marked as lost after attempt 3.`);
          }
        }, lostDelayMs);
      }

    } catch (err) {
      logger.error(`Attempt ${attemptNumber} error: ${err.message}`);
    }
  }, escalationDelayMs);
}

async function getGeminiDecisionMetadata(cartData, stats, attemptNumber, messageType, discountPercent) {
  const prompt = buildDecisionPrompt(cartData, stats, attemptNumber, messageType, discountPercent);
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-8b-8192",
      response_format: { type: "json_object" }
    });
    const rawText = chatCompletion.choices[0].message.content;
    logger.info(`🔍 Raw Groq metadata response: ${rawText.substring(0, 300)}`);
    return parseGeminiDecision(rawText);
  } catch (err) {
    logger.warn(`Failed calling Groq for decision metadata: ${err.message}`);
    return {};
  }
}

function parseGeminiDecision(rawText) {
  try {
    let cleanText = rawText
      .replace(/```json\s*/gi, '')
      .replace(/```/g, '')
      .replace(/[\u0000-\u001F\u007F]+/g, ' ')
      .trim();
    const firstBrace = cleanText.indexOf('{');
    const lastBrace  = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanText = cleanText.substring(firstBrace, lastBrace + 1);
    }
    return JSON.parse(cleanText);
  } catch (err) {
    logger.warn(`JSON Parse error: ${err.message}. Raw text: ${rawText}`);
    return {};
  }
}

function buildDecisionPrompt(cartData, stats, attemptNumber, messageType, discountPercent) {
  return `
You are RecoverAI, an autonomous checkout recovery agent for an e-commerce store on Shopify.

Your job is to generate reasoning metadata for a recovery attempt.
We have deterministically selected the strategy and discount to use for this attempt to ensure business compliance.

ABANDONED CART DATA:
- Cart Value: ₹${cartData.cart_value} (${cartData.value_tier} tier)
- Customer Type: ${cartData.user_type} customer
- Product Category: ${cartData.product_category}
- Products: ${cartData.products.map(p => p.title).join(', ')}

RECOVERY ATTEMPT PLAN:
- Attempt Number: ${attemptNumber}
- Selected Strategy (Message Type): ${messageType}
- Discount Code/Percent: ${discountPercent > 0 ? discountPercent + '%' : 'None'}

HISTORICAL PERFORMANCE DATA:
${stats ? `
HISTORICAL CONVERSION RATES (use these to inform your tone and reasoning):
- Reminder emails: ${stats.reminder_rate}% conversion rate
- Discount emails: ${stats.discount_rate}% conversion rate
- Social proof emails: ${stats.social_proof_rate}% conversion rate
- Best performing strategy for ${cartData.user_type} users: ${stats.best_strategy}
` : '- No historical data yet.'}

Based on the above information, analyze the likely friction point for this customer, then reply ONLY with this JSON (no extra text):
{
  "tone": "friendly" | "premium" | "urgent",
  "confidence": 0.0,
  "risk": "low" | "medium" | "high",
  "reasoning": "one concise sentence explaining why this strategy fits the customer/products and attempt history"
}
`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { handleAbandonedCart };
