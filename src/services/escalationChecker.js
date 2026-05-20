const cron = require('node-cron');
const { getCartsForEscalation, getCartAttempts, updateCartStatus, getHistoricalStats, saveRecoveryAttempt } = require('../db/queries');
const { generateRecoveryEmail } = require('./messageGenerator');
const { sendRecoveryEmail } = require('./emailService');
const { getStrategyForAttempt } = require('../utils/strategyEngine');
const logger = require('../utils/logger');

function startEscalationChecker() {
  // Run every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    logger.info('🔍 Escalation checker running...');
    await checkAndEscalate();
  });

  logger.info('⏰ Escalation checker started (runs every 30 min)');
}

async function checkAndEscalate() {
  try {
    const carts = await getCartsForEscalation();
    logger.info(`   Found ${carts.length} carts in recovery`);

    for (const cart of carts) {
      const attempts = await getCartAttempts(cart.id);

      // Skip carts with no recorded attempts (e.g. saved to mock DB only)
      if (!attempts || attempts.length === 0) {
        logger.info(`   Skipping cart ${cart.id} — no attempts recorded yet`);
        continue;
      }

      const lastAttempt = attempts[attempts.length - 1];
      const hoursSinceLast = getHoursSince(lastAttempt.sent_at);

      // Check if already converted (agent stops immediately)
      if (cart.status === 'converted') continue;

      // Attempt 2: after 24 hours
      if (attempts.length === 1 && hoursSinceLast >= 24) {
        await escalate(cart, 2);
      }

      // Attempt 3: after 48 hours total
      if (attempts.length === 2 && hoursSinceLast >= 24) {
        await escalate(cart, 3);
      }

      // Give up after 3 attempts
      if (attempts.length >= 3) {
        logger.info(`🛑 Cart ${cart.id} - agent giving up after 3 attempts`);
        await updateCartStatus(cart.shopify_checkout_id, 'lost');
      }
    }
  } catch (error) {
    logger.error(`Escalation error: ${error.message}`);
  }
}

async function escalate(cart, attemptNumber) {
  try {
    // Dynamic import to prevent any potential circular dependency issues
    const { getGeminiDecisionMetadata } = require('./agentDecision');

    const strategy = getStrategyForAttempt(cart.user_type, cart.cart_value, attemptNumber);
    if (!strategy) {
      logger.info(`🛑 No strategy defined for Attempt ${attemptNumber}. Marking cart ${cart.id} as lost.`);
      await updateCartStatus(cart.shopify_checkout_id, 'lost');
      return;
    }

    const { message_type, discount_percent } = strategy;
    logger.info(`📈 Escalating cart ${cart.id} → Attempt ${attemptNumber} (${message_type})`);

    const stats = await getHistoricalStats(cart.user_type);
    const metadata = await getGeminiDecisionMetadata(cart, stats, attemptNumber, message_type, discount_percent);

    const decision = {
      message_type,
      discount_percent,
      tone: metadata.tone || (cart.cart_value >= 3000 ? 'premium' : 'friendly'),
      confidence: metadata.confidence ?? 0.85,
      risk: metadata.risk || 'low',
      reasoning: metadata.reasoning || `Escalation attempt ${attemptNumber}: ${message_type}`
    };

    const emailContent = await generateRecoveryEmail(cart, decision);
    await sendRecoveryEmail(cart.customer_email, cart.customer_name, emailContent);

    await saveRecoveryAttempt({
      cart_id: cart.id,
      attempt_number: attemptNumber,
      message_type: decision.message_type,
      discount_percent: decision.discount_percent,
      agent_reasoning: decision.reasoning,
      email_subject: emailContent.subject,
      email_body: emailContent.body,
      delay_hours_used: 24,
      confidence: decision.confidence,
      risk: decision.risk,
      cart_value: cart.cart_value,
      user_type: cart.user_type,
      customer_email: cart.customer_email
    });

    logger.info(`✅ Escalation attempt ${attemptNumber} sent`);
  } catch (error) {
    logger.error(`Escalation attempt failed: ${error.message}`);
  }
}

function getHoursSince(timestamp) {
  return (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60);
}

module.exports = { startEscalationChecker };
