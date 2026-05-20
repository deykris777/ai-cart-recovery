/**
 * Deterministically decides the recovery strategy based on:
 * - Customer Type (new vs returning)
 * - Cart Value (threshold at ₹5000)
 * - Attempt Number (1, 2, or 3)
 */
function getStrategyForAttempt(userType, cartValue, attemptNumber) {
  // Sequence rules:
  // 1. Returning customer: Reminder (Attempt 1) -> Scarcity (Attempt 2) -> Discount (Attempt 3)
  // 2. New customer, Cart value < ₹5000: Social Proof (Attempt 1) -> Reminder (Attempt 2) -> Scarcity (Attempt 3)
  // 3. New customer, Cart value >= ₹5000: Social Proof (Attempt 1) -> Scarcity (Attempt 2) -> Discount (Attempt 3)

  let sequence;
  if (userType === 'returning') {
    sequence = ['reminder', 'scarcity', 'discount'];
  } else {
    // New customer
    if (cartValue >= 5000) {
      sequence = ['social_proof', 'scarcity', 'discount'];
    } else {
      sequence = ['social_proof', 'reminder', 'scarcity'];
    }
  }

  const index = attemptNumber - 1;
  if (index < 0 || index >= sequence.length) {
    return null; // No strategy defined for this attempt number
  }

  const messageType = sequence[index];
  const discountPercent = messageType === 'discount' ? 10 : 0;

  return {
    message_type: messageType,
    discount_percent: discountPercent
  };
}

module.exports = { getStrategyForAttempt };
