const { getStrategyForAttempt } = require('./src/utils/strategyEngine');

function runTests() {
  console.log('=== TESTING STRATEGY ENGINE ===\n');

  // Test Case 1: Returning customer, any cart value
  console.log('Test Case 1: Returning customer, ₹3500 cart');
  const ret1 = getStrategyForAttempt('returning', 3500, 1);
  const ret2 = getStrategyForAttempt('returning', 3500, 2);
  const ret3 = getStrategyForAttempt('returning', 3500, 3);
  const ret4 = getStrategyForAttempt('returning', 3500, 4);
  console.log(`  Attempt 1: ${JSON.stringify(ret1)} (Expected: {"message_type":"reminder","discount_percent":0})`);
  console.log(`  Attempt 2: ${JSON.stringify(ret2)} (Expected: {"message_type":"scarcity","discount_percent":0})`);
  console.log(`  Attempt 3: ${JSON.stringify(ret3)} (Expected: {"message_type":"discount","discount_percent":10})`);
  console.log(`  Attempt 4: ${JSON.stringify(ret4)} (Expected: null)`);
  console.log();

  // Test Case 2: New customer, cart value < ₹5000
  console.log('Test Case 2: New customer, ₹4500 cart');
  const newL1 = getStrategyForAttempt('new', 4500, 1);
  const newL2 = getStrategyForAttempt('new', 4500, 2);
  const newL3 = getStrategyForAttempt('new', 4500, 3);
  const newL4 = getStrategyForAttempt('new', 4500, 4);
  console.log(`  Attempt 1: ${JSON.stringify(newL1)} (Expected: {"message_type":"social_proof","discount_percent":0})`);
  console.log(`  Attempt 2: ${JSON.stringify(newL2)} (Expected: {"message_type":"reminder","discount_percent":0})`);
  console.log(`  Attempt 3: ${JSON.stringify(newL3)} (Expected: {"message_type":"scarcity","discount_percent":0})`);
  console.log(`  Attempt 4: ${JSON.stringify(newL4)} (Expected: null)`);
  console.log();

  // Test Case 3: New customer, cart value >= ₹5000
  console.log('Test Case 3: New customer, ₹7500 cart');
  const newH1 = getStrategyForAttempt('new', 7500, 1);
  const newH2 = getStrategyForAttempt('new', 7500, 2);
  const newH3 = getStrategyForAttempt('new', 7500, 3);
  const newH4 = getStrategyForAttempt('new', 7500, 4);
  console.log(`  Attempt 1: ${JSON.stringify(newH1)} (Expected: {"message_type":"social_proof","discount_percent":0})`);
  console.log(`  Attempt 2: ${JSON.stringify(newH2)} (Expected: {"message_type":"scarcity","discount_percent":0})`);
  console.log(`  Attempt 3: ${JSON.stringify(newH3)} (Expected: {"message_type":"discount","discount_percent":10})`);
  console.log(`  Attempt 4: ${JSON.stringify(newH4)} (Expected: null)`);
  console.log();

  console.log('=== TEST SUITE COMPLETE ===');
}

runTests();
