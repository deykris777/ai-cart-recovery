const express = require('express');
const router = express.Router();
const { getDashboardStats, getRecentAttempts } = require('../db/queries');

// Main stats endpoint
router.get('/stats', async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Recent recovery attempts with agent reasoning
router.get('/attempts', async (req, res) => {
  try {
    const attempts = await getRecentAttempts(10);
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint — simulate an abandoned cart (for demo)
router.post('/simulate', async (req, res) => {
  // FIX 5: Demo secret guard — require x-demo-key header if DEMO_SECRET is set
  if (process.env.DEMO_SECRET && req.headers['x-demo-key'] !== process.env.DEMO_SECRET) {
    return res.status(401).json({ error: 'Unauthorized. Provide x-demo-key header.' });
  }

  try {
    const { cartValue, email, userType, productName } = req.body;

    const fakeCheckout = {
      id: `DEMO_${Date.now()}`,
      total_price: cartValue || '2500.00',
      currency: 'INR',
      email: email || 'demo@test.com',
      customer: userType === 'returning' ? { first_name: 'Demo', email: email || 'demo@test.com' } : null,
      billing_address: { first_name: 'Demo' },
      line_items: [{
        title: productName || 'Demo Product',
        quantity: 1,
        price: cartValue || '2500.00'
      }]
    };

    // Import and trigger (non-blocking)
    const { analyzeCart } = require('../utils/cartAnalyzer');
    const { saveAbandonedCart } = require('../db/queries');
    const { handleAbandonedCart } = require('../services/agentDecision');

    const cartData = analyzeCart(fakeCheckout);
    const savedCart = await saveAbandonedCart(cartData);
    cartData.id = savedCart.id; // Ensure the agent has the DB ID
    handleAbandonedCart(cartData); // async

    res.json({ success: true, message: 'Simulation started', cart: cartData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Agent reasoning log — last 20 attempts with full decision metadata
router.get('/agent-log', async (req, res) => {
  try {
    const attempts = await getRecentAttempts(20);
    const log = attempts.map(a => ({
      id: a.id,
      cart_id: a.cart_id,
      sent_at: a.sent_at,
      cart_value: a.cart_value,
      user_type: a.user_type,
      customer_email: a.customer_email,
      attempt_number: a.attempt_number,
      message_type: a.message_type,
      discount_percent: a.discount_percent,
      agent_reasoning: a.agent_reasoning,
      email_subject: a.email_subject,
      converted: a.converted,
      confidence: a.confidence,
      risk: a.risk
    }));
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
