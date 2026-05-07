const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateRecoveryEmail(cartData, decision) {
  const prompt = `
Write a checkout recovery email for a customer who abandoned their cart.

CUSTOMER INFO:
- Name: \${cartData.customer_name}
- Cart Value: ₹\${cartData.cart_value}
- Products: \${cartData.products.map(p => p.title).join(', ')}
- Customer Type: \${cartData.user_type}

EMAIL STRATEGY:
- Type: \${decision.message_type}
- Tone: \${decision.tone}
\${decision.discount_percent > 0 ? \`- Include discount code: RECOVER\${decision.discount_percent} for \${decision.discount_percent}% off\` : '- Do NOT mention any discount'}

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

  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });
  const result = await model.generateContent(prompt);
  const rawText = result.response.text();

  let emailContent;
  try {
    const cleanText = rawText.replace(/```json\n?|```/g, '').replace(/[\u0000-\u001F]+/g, " ");
    emailContent = JSON.parse(cleanText);
  } catch (parseError) {
    logger.warn(`JSON Parse error for email: ${parseError.message}. Using fallback email.`);
    emailContent = {
      subject: `Don't forget your cart, ${cartData.customer_name}!`,
      body: `Hi ${cartData.customer_name},\n\nWe noticed you left some items in your cart. Come back and complete your purchase today!\n\nBest,\nThe Team`
    };
  }

  logger.info(`📧 Email generated: "${emailContent.subject}"`);
  return emailContent;
}

module.exports = { generateRecoveryEmail };
