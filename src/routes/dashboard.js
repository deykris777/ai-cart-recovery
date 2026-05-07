const express = require('express');
const router = express.Router();
const { getDashboardStats, getRecentAttempts, getAgentDecisions } = require('../db/queries');

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
  try {
    const { cartValue, userType, productName } = req.body;

    const fakeCheckout = {
      id: `DEMO_${Date.now()}`,
      total_price: cartValue || '2500.00',
      currency: 'INR',
      email: req.body.email || 'demo@test.com',
      customer: userType === 'returning' ? { first_name: 'Demo' } : null,
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
    await saveAbandonedCart(cartData);
    handleAbandonedCart(cartData); // async

    res.json({ success: true, message: 'Simulation started', cart: cartData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
