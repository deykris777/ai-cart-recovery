const { GoogleGenerativeAI } = require('@google/generative-ai');
const { generateRecoveryEmail } = require('./messageGenerator');
const { sendRecoveryEmail } = require('./emailService');
const { saveRecoveryAttempt, updateCartStatus, getHistoricalStats } = require('../db/queries');
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
    
    let decision;
    try {
      const cleanText = rawText.replace(/```json\n?|```/g, '').replace(/[\u0000-\u001F]+/g, " ");
      decision = JSON.parse(cleanText);
    } catch (parseError) {
      logger.warn(`JSON Parse error: ${parseError.message}. Using fallback decision.`);
      decision = {
        action: 'send_now',
        delay_hours: 0,
        message_type: 'reminder',
        discount_percent: 0,
        tone: 'friendly',
        reasoning: 'Fallback decision due to parse error'
      };
    }

    logger.info(`🤖 Agent Decision:`);
    logger.info(`   Action: ${decision.action}`);
    logger.info(`   Message Type: ${decision.message_type}`);
    logger.info(`   Delay: ${decision.delay_hours} hours`);
    logger.info(`   Reasoning: "${decision.reasoning}"`);

    // If agent decides to skip, log and exit
    if (decision.action === 'skip') {
      logger.info(`⏭️  Agent chose to skip this cart.`);
      await updateCartStatus(cartData.shopify_checkout_id, 'lost');
      return;
    }

    // Wait for the decided delay
    if (decision.delay_hours > 0) {
      logger.info(`⏳ Agent waiting ${decision.delay_hours} hour(s) before sending...`);
      // DEMO MODE: Scale hours to seconds so the demo works smoothly
      await sleep(decision.delay_hours * 1000);
    }

    // Generate personalized email using Gemini
    const emailContent = await generateRecoveryEmail(cartData, decision);

    // Send the email
    await sendRecoveryEmail(
      cartData.customer_email,
      cartData.customer_name,
      emailContent
    );

    // Save the attempt to DB
    await saveRecoveryAttempt({
      cart_id: cartData.id,
      attempt_number: 1,
      message_type: decision.message_type,
      discount_percent: decision.discount_percent || 0,
      agent_reasoning: decision.reasoning,
      email_subject: emailContent.subject,
      email_body: emailContent.body,
      delay_hours_used: decision.delay_hours
    });

    await updateCartStatus(cartData.shopify_checkout_id, 'in_recovery');

    logger.info(`✅ Recovery attempt 1 sent for cart ${cartData.shopify_checkout_id}`);

  } catch (error) {
    logger.error(`Agent error: ${error.message}`);
  }
}

function buildDecisionPrompt(cartData, stats) {
  return `
You are RecoverAI, an autonomous checkout recovery agent for an e-commerce store on Shopify.

Your job is to decide the best strategy to recover an abandoned cart.

ABANDONED CART DATA:
- Cart Value: ₹\${cartData.cart_value} (\${cartData.value_tier} tier)
- Customer Type: \${cartData.user_type} customer
- Product Category: \${cartData.product_category}
- Products: \${cartData.products.map(p => p.title).join(', ')}
- Time Since Abandonment: just now

HISTORICAL PERFORMANCE DATA (from past recoveries):
\${stats ? \`
- Reminder emails: \${stats.reminder_rate}% conversion rate
- Discount emails: \${stats.discount_rate}% conversion rate  
- Social proof emails: \${stats.social_proof_rate}% conversion rate
- Best strategy for \${cartData.user_type} users: \${stats.best_strategy}
\` : '- Not enough data yet, use best judgment'}

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
  "reasoning": "One sentence explaining your decision like a smart PM would"
}
`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { handleAbandonedCart };
