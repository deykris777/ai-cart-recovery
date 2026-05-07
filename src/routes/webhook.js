const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { handleAbandonedCart } = require('../services/agentDecision');
const { saveAbandonedCart } = require('../db/queries');
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
    // Optional: verify signature in production
    // if (!verifyWebhook(req)) return logger.warn('Invalid webhook signature');

    const checkout = req.body;
    logger.info(`🛒 Abandoned cart detected: ${checkout.id}`);
    logger.info(`   Value: ₹${checkout.total_price} | Email: ${checkout.email}`);

    // Parse and classify the cart
    const cartData = analyzeCart(checkout);

    // Save to database
    await saveAbandonedCart(cartData);

    // Trigger AI agent (async, non-blocking)
    handleAbandonedCart(cartData);

  } catch (error) {
    logger.error(`Webhook processing error: ${error.message}`);
  }
});

module.exports = router;
