const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { handleAbandonedCart } = require('../services/agentDecision');
const { saveAbandonedCart, updateCartStatus } = require('../db/queries');
const { analyzeCart } = require('../utils/cartAnalyzer');
const logger = require('../utils/logger');

// Verify Shopify webhook signature
function verifyWebhook(req) {
  const hmac = req.headers['x-shopify-hmac-sha256'];
  const body = JSON.stringify(req.body);
  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
    .update(body, 'utf8')
    .digest('base64');
  return hmac === hash;
}

// Main webhook endpoint
router.post('/checkout/abandoned', async (req, res) => {
  // Always respond 200 to Shopify first (prevent retries)
  res.status(200).send('OK');

  try {
    // FIX 4: Verify signature in production only
    if (process.env.NODE_ENV === 'production') {
      if (!verifyWebhook(req)) {
        logger.warn('⚠️ Invalid webhook signature — request rejected');
        return;
      }
    }

    const checkout = req.body;
    logger.info(`🛒 Abandoned cart detected: ${checkout.id}`);
    logger.info(`   Value: ₹${checkout.total_price} | Email: ${checkout.email}`);

    // Parse and classify the cart
    const cartData = analyzeCart(checkout);

    // Save to database
    const savedCart = await saveAbandonedCart(cartData);
    cartData.id = savedCart.id; // Ensure the agent has the DB ID

    // Trigger AI agent (async, non-blocking)
    handleAbandonedCart(cartData);

  } catch (error) {
    logger.error(`Webhook processing error: ${error.message}`);
  }
});

// FIX 2: Order paid webhook — marks the cart as converted, stopping further follow-ups
router.post('/order/paid', async (req, res) => {
  res.status(200).send('OK');
  try {
    const order = req.body;
    const checkoutId = String(order.checkout_id);
    if (checkoutId && checkoutId !== 'undefined') {
      await updateCartStatus(checkoutId, 'converted');
      logger.info(`✅ Order paid — cart ${checkoutId} marked as converted. Agent stopping follow-ups.`);
    }
  } catch (error) {
    logger.error(`Order paid webhook error: ${error.message}`);
  }
});

module.exports = router;
