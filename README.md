# RecoverAI

**Hackathon Track:** Track 2: AI-Assisted Checkout Recovery

"A recovery agent that doesn't just send emails — it reads the situation, decides the best move, and follows up step by step until the customer converts or it knows to stop."

## Problem Statement
Cart abandonment is the biggest revenue leak in ecommerce. Most recovery today is a static follow-up email sent hours later. RecoverAI intervenes in real time, deterministically analyzing the cart's value and contents, and using AI to generate context-aware, personalized interventions that address the buyer's likely friction points.

## Required Links
*   **GitHub Repository:** https://github.com/deykris777/ai-cart-recovery
*   **Demo Video:** [INSERT AFTER RECORDING]

    > The demo opens with a real Shopify abandoned-checkout webhook hitting the `/webhooks/checkout/abandoned` endpoint, showing the raw payload logged in real time as the deterministic engine classifies the cart by value tier and product category. The server logs then reveal the Gemini agent working through its strategy decision — selecting tone, timing, and whether to apply a discount — before committing to a single recovery plan bounded by the hard rules set in `cartAnalyzer.js`. Finally, the AI-generated email subject and body appear in the logs and land in the buyer's inbox, demonstrating the full pipeline from abandoned cart signal to personalized, context-aware recovery message in under 10 seconds.
*   **Product Document:** [PRODUCT_DOC.md](./PRODUCT_DOC.md)
*   **Technical Document:** [TECHNICAL_DOC.md](./TECHNICAL_DOC.md)
*   **Decision Log:** [DECISIONS.md](./DECISIONS.md)

## Contribution Note
Solo participation. 35% on product framing, scope decisions, and documentation; 65% on implementing the Node/Express backend, Shopify webhooks, Gemini AI integration, Supabase state management, and escalation logic.

## Setup Instructions
1. Run `npm install`
2. Copy `.env.example` to `.env` and fill in your real keys (Gemini, Supabase, etc.)
3. Create the required Supabase tables.
4. Start the server: `npm run dev`
5. Start ngrok: `ngrok http 3000`
6. Register the webhook in your Shopify dev store: `checkouts/create` -> `[your-ngrok-url]/webhooks/checkout/abandoned`

Enjoy the AI agent!
