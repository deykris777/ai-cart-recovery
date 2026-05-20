const Groq = require('groq-sdk');
const logger = require('../utils/logger');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function generateRecoveryEmail(cartData, decision) {
  const discountLine = decision.discount_percent > 0
    ? `- Include discount code: RECOVER${decision.discount_percent} for ${decision.discount_percent}% off`
    : '- Do NOT mention any discount';

  const prompt = `
Write a checkout recovery email for a customer who abandoned their cart.

CUSTOMER INFO:
- Name: ${cartData.customer_name}
- Cart Value: ₹${cartData.cart_value}
- Products: ${cartData.products.map(p => p.title).join(', ')}
- Customer Type: ${cartData.user_type}

EMAIL STRATEGY:
- Type: ${decision.message_type}
- Tone: ${decision.tone}
${discountLine}

STRICT RULES:
- Keep email under 120 words
- Sound human, not robotic
- No excessive emojis (max 1-2)
- End with a single clear call to action
- For premium tone: warm, reassuring, confident
- For friendly tone: casual, helpful, light
- For urgent tone: brief, direct, time-sensitive

Reply ONLY with this JSON:
{
  "subject": "email subject line here",
  "body": "full email body here with \\n for line breaks"
}
`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-8b-8192",
      response_format: { type: "json_object" }
    });
    const rawText = chatCompletion.choices[0].message.content;

    let emailContent;
    try {
      let cleanText = rawText
        .replace(/```json\s*/gi, '')
        .replace(/```/g, '')
        .replace(/[\u0000-\u001F\u007F]+/g, ' ')
        .trim();
      // Extract first {...} block in case model adds surrounding text
      const firstBrace = cleanText.indexOf('{');
      const lastBrace  = cleanText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanText = cleanText.substring(firstBrace, lastBrace + 1);
      }
      emailContent = JSON.parse(cleanText);
    } catch (parseError) {
      logger.warn(`JSON Parse error for email: ${parseError.message}. Using fallback email.`);
      emailContent = buildFallbackEmail(cartData, decision);
    }

    logger.info(`📧 Email generated: "${emailContent.subject}"`);
    return emailContent;

  } catch (geminiError) {
    logger.warn(`⚠️  Groq email generation failed (${geminiError.message}). Using template fallback.`);
    return buildFallbackEmail(cartData, decision);
  }
}

function buildFallbackEmail(cartData, decision) {
  const name = cartData.customer_name || 'there';
  const value = cartData.cart_value ? `₹${cartData.cart_value}` : 'your items';
  const discountLine = decision.discount_percent > 0
    ? `\n\nAs a thank-you, use code RECOVER${decision.discount_percent} for ${decision.discount_percent}% off.`
    : '';

  const subjects = {
    discount:     `Special offer just for you — complete your ₹${cartData.cart_value || ''} order`,
    social_proof: `Others are loving what you left behind`,
    scarcity:     `Your cart is almost gone — act fast!`,
    reminder:     `You left something behind`
  };

  return {
    subject: subjects[decision.message_type] || `Don't forget your cart, ${name}!`,
    body: `Hi ${name},\n\nWe noticed you left ${value} worth of items in your cart.${discountLine}\n\nCome back and complete your purchase — we'd love to have you.\n\nBest,\nThe RecoverAI Team`
  };
}

module.exports = { generateRecoveryEmail };
