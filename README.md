# RecoverAI

**Hackathon Track:** Track 2: AI-Assisted Checkout Recovery

"A recovery agent that doesn't just send emails — it reads the situation, decides the best move, and follows up step by step until the customer converts or it knows to stop."

## Problem Statement
Cart abandonment is the biggest revenue leak in ecommerce. Most recovery today is a static follow-up email sent hours later. RecoverAI intervenes in real time, deterministically analyzing the cart's value and contents, and using AI to generate context-aware, personalized interventions that address the buyer's likely friction points.

## Required Links
*   **GitHub Repository:** https://github.com/deykris777/ai-cart-recovery
*   **Live Demo (Render):** https://ai-cart-recovery.onrender.com/
*   **Demo Video:** [INSERT DEMO VIDEO LINK HERE]
*   **Product Document:** [PRODUCT_DOCUMENT.md](./PRODUCT_DOCUMENT.md) *(Please Export/Print as PDF for submission)*
*   **Technical Document:** [TECHNICAL_DOCUMENT.md](./TECHNICAL_DOCUMENT.md) *(Please Export/Print as PDF for submission)*
*   **Decision Log:** [DECISION_LOG.md](./DECISION_LOG.md)

## Contribution Note
Solo participation. 35% on product framing, scope decisions, and documentation; 65% on implementing the Node/Express backend, Shopify webhooks, Groq LLaMA integration, SendGrid email dispatch, Supabase state management, and the Vite/React dark-mode frontend dashboard.

## System Architecture
RecoverAI is a monorepo consisting of:
- A high-performance **Vite + React + TailwindCSS** frontend.
- An **Express.js** API backend powered by **Drizzle ORM**.
- **Supabase** (PostgreSQL) for state management.
- **Groq LLaMA-3 70B** for ultra-fast reasoning and text generation.
- **SendGrid** for live payload delivery.

## Setup Instructions (Local Development)
1. Clone the repository and run `npm install` at the root to install all monorepo dependencies.
2. Copy `.env.example` to `.env` in the root folder and fill in your real keys (Groq API Key, Supabase URL/Key, SendGrid API Key, and Sender Email).
3. Run `npm run db:seed` to optionally seed the database (or rely on the in-memory mock DB).
4. Run the full stack locally:
   ```bash
   npm run dev
   ```
5. The Vite dashboard will start on `http://localhost:5173` and the API server on `http://localhost:3000`.

## How to Test and Use
1. **Access the Dashboard**: Open the live Render link or your local Vite server.
2. **Use the Live Simulator**: Use the simulator panel on the dashboard to trigger mock recovery attempts. Adjust values like cart size, user type, and product category.
3. **Watch the AI Reason**: The Groq agent alters its timing, tone, and discount decisions dynamically. You will see the pipeline update in real-time, displaying the agent's exact decision (Action, Tone, Delay, Discount) and the generated recovery email.
4. **Check Your Inbox**: Because SendGrid is integrated into the simulator, if you put your real email into the simulator, you will receive the exact customized recovery email that the AI generated!
