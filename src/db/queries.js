const { supabase } = require('./supabaseClient');
const logger = require('../utils/logger');

// In-memory fallback for hackathon demo
const mockDb = { carts: [], attempts: [] };

async function saveAbandonedCart(cartData) {
  const { value_tier, ...dbData } = cartData;
  const { data, error } = await supabase.from('abandoned_carts').upsert([dbData], { onConflict: 'shopify_checkout_id' }).select();
  if (error) {
    logger.warn(`Supabase error (${error.message}). Using mock DB.`);
    let existing = mockDb.carts.find(c => c.shopify_checkout_id === dbData.shopify_checkout_id);
    if (existing) { Object.assign(existing, dbData); return existing; }
    mockDb.carts.push(dbData); return dbData;
  }
  return data[0];
}

async function saveRecoveryAttempt(attemptData) {
  const { data, error } = await supabase.from('recovery_attempts').insert([attemptData]).select();
  if (error) {
    logger.warn(`Supabase error (${error.message}). Using mock DB.`);
    const mockAttempt = { ...attemptData, id: Date.now(), sent_at: new Date().toISOString() };
    mockDb.attempts.push(mockAttempt);
    return mockAttempt;
  }
  return data[0];
}

async function updateCartStatus(shopifyCheckoutId, status) {
  const { error } = await supabase.from('abandoned_carts').update({ status }).eq('shopify_checkout_id', shopifyCheckoutId);
  if (error) {
    let cart = mockDb.carts.find(c => c.shopify_checkout_id === shopifyCheckoutId);
    if (cart) cart.status = status;
  }
}

async function getCartsForEscalation() {
  const { data, error } = await supabase.from('abandoned_carts').select('*').eq('status', 'in_recovery');
  if (error) return mockDb.carts.filter(c => c.status === 'in_recovery');
  return data;
}

async function getCartAttempts(cartId) {
  const { data, error } = await supabase.from('recovery_attempts').select('*').eq('cart_id', cartId).order('sent_at', { ascending: true });
  if (error) return mockDb.attempts.filter(a => a.cart_id === cartId);
  return data;
}

async function getDashboardStats() {
  const [carts, attempts] = await Promise.all([
    supabase.from('abandoned_carts').select('status'),
    supabase.from('recovery_attempts').select('message_type, converted')
  ]);

  let cartsData = carts.data;
  let attemptsData = attempts.data;

  if (carts.error || attempts.error) {
    cartsData = mockDb.carts;
    attemptsData = mockDb.attempts;
  }

  const total_carts = cartsData?.length || 0;
  const total_converted = cartsData?.filter(c => c.status === 'converted').length || 0;
  const total_attempts = attemptsData?.length || 0;
  const recovery_rate = total_carts > 0 ? Math.round((total_converted / total_carts) * 100) : 0;

  const by_message_type = {};
  attemptsData?.filter(a => a.converted).forEach(a => {
    by_message_type[a.message_type] = (by_message_type[a.message_type] || 0) + 1;
  });

  return { total_carts, total_attempts, total_converted, recovery_rate, by_message_type };
}

async function getRecentAttempts(limit = 10) {
  const { data, error } = await supabase.from('recovery_attempts').select(`*, abandoned_carts (cart_value, user_type, customer_email, product_category)`).order('sent_at', { ascending: false }).limit(limit);
  if (error) {
    return mockDb.attempts.slice(-limit).reverse().map(a => {
      let cart = mockDb.carts.find(c => c.id === a.cart_id);
      return { ...a, cart_value: cart?.cart_value, user_type: cart?.user_type, customer_email: cart?.customer_email };
    });
  }
  return data?.map(a => ({ ...a, cart_value: a.abandoned_carts?.cart_value, user_type: a.abandoned_carts?.user_type, customer_email: a.abandoned_carts?.customer_email }));
}

async function getHistoricalStats(userType) {
  const { data, error } = await supabase.from('recovery_attempts').select('message_type, converted').limit(50);
  
  let attemptsData = data;
  if (error) attemptsData = mockDb.attempts;

  if (!attemptsData || attemptsData.length < 5) return null;

  const calcRate = (type) => {
    const ofType = attemptsData.filter(d => d.message_type === type);
    if (ofType.length === 0) return 0;
    return Math.round((ofType.filter(d => d.converted).length / ofType.length) * 100);
  };

  const rates = {
    reminder_rate: calcRate('reminder'),
    discount_rate: calcRate('discount'),
    social_proof_rate: calcRate('social_proof'),
    scarcity_rate: calcRate('scarcity'),
  };

  const best = Object.entries(rates).sort((a, b) => b[1] - a[1])[0];
  rates.best_strategy = best[0].replace('_rate', '');

  return rates;
}

module.exports = {
  saveAbandonedCart,
  saveRecoveryAttempt,
  updateCartStatus,
  getCartsForEscalation,
  getCartAttempts,
  getDashboardStats,
  getRecentAttempts,
  getHistoricalStats
};
