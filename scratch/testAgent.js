require('dotenv').config();
const { handleAbandonedCart } = require('../src/services/agentDecision');

const cartData = {
  id: `DEMO_TEST`,
  shopify_checkout_id: `DEMO_TEST`,
  cart_value: 50,
  value_tier: 'low',
  user_type: 'New Customer',
  product_category: 'default',
  products: [{ title: 'Small item' }],
  customer_email: 'demo@test.com',
  customer_name: 'Demo'
};

console.log("Starting test...");
handleAbandonedCart(cartData).then(() => {
  console.log("Done");
});
