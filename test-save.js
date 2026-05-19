require('dotenv').config();
const { analyzeCart } = require('./src/utils/cartAnalyzer');
const { saveAbandonedCart } = require('./src/db/queries');

async function run() {
  const fakeCheckout = {
    id: `DEMO_${Date.now()}`,
    total_price: '2500.00',
    currency: 'INR',
    email: 'demo@test.com',
    customer: { first_name: 'Demo' },
    billing_address: { first_name: 'Demo' },
    line_items: [{ title: 'Demo', quantity: 1, price: '2500' }]
  };
  const cartData = analyzeCart(fakeCheckout);
  const savedCart = await saveAbandonedCart(cartData);
  console.log('Saved Cart:', savedCart);
}
run();
