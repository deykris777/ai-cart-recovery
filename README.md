# RecoverAI

**Hackathon Track:** Track 2: AI-Assisted Checkout Recovery

"A recovery agent that doesn't just send emails — it reads the situation, decides the best move, and follows up step by step until the customer converts or it knows to stop."

## Problem Statement
Cart abandonment is the biggest revenue leak in ecommerce. Most recovery today is a static follow-up email sent hours later. RecoverAI intervenes in real time, deterministically analyzing the cart's value and contents, and using AI to generate context-aware, personalized interventions that address the buyer's likely friction points.

## Required Links
*   **GitHub Repository:** https://github.com/deykris777/ai-cart-recovery
*   **Demo Video:** [INSERT AFTER RECORDING]

    > The demo opens with a real Shopify abandoned-checkout webhook hitting the `/webhooks/checkout/abandoned` endpoint, showing the raw payload logged in real time as the deterministic engine classifies the cart by value tier and product category. The server logs then reveal the Groq LLaMA agent working through its strategy decision — selecting tone, timing, and whether to apply a discount — before committing to a single recovery plan bounded by the hard rules set in `cartAnalyzer.js`. Finally, the AI-generated email subject and body appear in the logs and land in the buyer's inbox, demonstrating the full pipeline from abandoned cart signal to personalized, context-aware recovery message in under 10 seconds.
*   **Product Document:** [PRODUCT_DOC.md](./PRODUCT_DOC.md)
*   **Technical Document:** [TECHNICAL_DOC.md](./TECHNICAL_DOC.md)
*   **Decision Log:** [DECISIONS.md](./DECISIONS.md)

## Contribution Note
Solo participation. 35% on product framing, scope decisions, and documentation; 65% on implementing the Node/Express backend, Shopify webhooks, Groq LLaMA integration, Supabase state management, and escalation logic.

## Setup Instructions
1. Run `npm install`
2. Copy `.env.example` to `.env` and fill in your real keys (Groq API Key, Supabase URL/Key, SendGrid API Key, and Sender Email).
3. Create the required Supabase tables.

Run the following SQL in your Supabase SQL editor:

```sql
CREATE TABLE abandoned_carts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  shopify_checkout_id TEXT UNIQUE NOT NULL,
  customer_email TEXT,
  cart_value NUMERIC,
  currency TEXT DEFAULT 'INR',
  user_type TEXT DEFAULT 'new',
  product_name TEXT,
  product_category TEXT,
  value_tier TEXT,
  status TEXT DEFAULT 'abandoned',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE recovery_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id uuid REFERENCES abandoned_carts(id),
  attempt_number INTEGER,
  message_type TEXT,
  discount_percent INTEGER DEFAULT 0,
  email_subject TEXT,
  email_body TEXT,
  agent_reasoning TEXT,
  tone TEXT,
  confidence NUMERIC,
  risk TEXT,
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
```
4. Start the server: `npm run dev` (starts on port 3000).
5. Start ngrok: `ngrok http 3000` (to receive actual Shopify webhooks).
6. Register the webhook in your Shopify partner/dev store: `checkouts/create` -> `[your-ngrok-url]/webhooks/checkout/abandoned`.

## How to Test and Use
1. **Access the Dashboard**: Open `http://localhost:3000` in your web browser, or simply double-click `dashboard/index.html` (the app dynamically falls back to query the Express backend at `http://localhost:3000` even if loaded via the `file://` scheme or VS Code Live Server).
2. **Use the Live Simulator**: Use the simulator card on the dashboard to trigger mock recovery attempts. Adjust values like cart size, user type (new/returning), and product category to see how the Groq (LLaMA 3.3 70B) agent alters its timing, tone, and discount decisions dynamically.
3. **Check the Live Reasoning Log**: As soon as the agent triggers and completes its decision, you will see a detailed log card show up on the dashboard displaying the agent's exact decision (Action, Tone, Delay, Discount), the generated recovery email subject and body, and the raw chain of reasoning.
4. **Mark as Converted**: If a checkout is recovered (e.g., simulating order paid webhook), the system updates the status and propagates it to the attempts chart, updating the dashboard analytics instantly.

> [!WARNING]
> **SendGrid & Gmail DMARC Notice:** If your `SENDER_EMAIL` is a `@gmail.com` address, SendGrid will accept the API call (202 Accepted) but major email providers (like Gmail) will reject or drop the email due to DMARC verification policies. To receive actual test emails in your inbox, use a sender email verified under a custom domain in SendGrid. If a Gmail sender is used, the system logs a console warning but continues mock execution so the dashboard is still fully functional.

Enjoy the AI agent!

