# RecoverAI

**Hackathon Track:** Track 2: AI-Assisted Checkout Recovery

"A recovery agent that doesn't just send emails — it reads the situation, decides the best move, and follows up step by step until the customer converts or it knows to stop."

## Problem Statement
Cart abandonment is the biggest revenue leak in ecommerce. Most recovery today is a static follow-up email sent hours later. RecoverAI intervenes in real time, deterministically analyzing the cart's value and contents, and using AI to generate context-aware, personalized interventions that address the buyer's likely friction points.

## Required Links
*   **GitHub Repository:** https://github.com/deykris777/ai-cart-recovery
*   **Demo Video:** [INSERT AFTER RECORDING]
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
