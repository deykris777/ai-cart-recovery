function analyzeCart(checkout) {
  const cartValue = parseFloat(checkout.total_price || 0);
  const lineItems = checkout.line_items || [];

  // Classify cart value tier
  const valueTier = cartValue >= 3000 ? 'high' :
                    cartValue >= 1000 ? 'medium' : 'low';

  // Detect product category from title keywords
  const allTitles = lineItems.map(i => i.title?.toLowerCase()).join(' ');
  const productCategory =
    allTitles.match(/shoe|sneaker|boot/) ? 'footwear' :
    allTitles.match(/phone|laptop|tablet|electronic/) ? 'electronics' :
    allTitles.match(/shirt|dress|jacket|cloth/) ? 'apparel' :
    allTitles.match(/book|course|guide/) ? 'education' : 'general';

  return {
    shopify_checkout_id: String(checkout.id),
    cart_value: cartValue,
    value_tier: valueTier,
    currency: checkout.currency || 'INR',
    user_type: checkout.customer ? 'returning' : 'new',
    customer_email: checkout.email || checkout.customer?.email,
    customer_name: checkout.billing_address?.first_name ||
                   checkout.customer?.first_name || 'there',
    products: lineItems.map(i => ({
      title: i.title,
      quantity: i.quantity,
      price: i.price
    })),
    product_category: productCategory,
    abandoned_at: new Date().toISOString()
  };
}

module.exports = { analyzeCart };
