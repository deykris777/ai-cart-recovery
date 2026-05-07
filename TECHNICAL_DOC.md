# Technical Document: RecoverAI

## System Architecture
RecoverAI is built on a Node.js (Express) backend, utilizing Shopify Webhooks, Supabase for state management, and Google's Gemini API for generative tasks.

**Data Flow:**
1.  **Ingestion:** Shopify `checkouts/create` webhook sends payload to `/webhooks/checkout/abandoned` (via ngrok for local dev).
2.  **Analysis (Deterministic):** `cartAnalyzer.js` parses the webhook, standardizes currency, extracts line items, and classifies the cart into a `value_tier` (low, medium, high) and `product_category`.
3.  **Strategy Formulation:** `escalationChecker.js` checks the state in Supabase and decides the next step based on the cart's deterministic profile.
4.  **Generation (AI):** `messageGenerator.js` prompts the Gemini model with strict JSON output instructions to generate the subject and body of the recovery message.
5.  **Delivery:** `emailService.js` dispatches the message.

## AI vs. Deterministic Boundaries
A critical design decision was drawing a strict line between what the LLM handles and what code handles:

*   **Deterministic (`cartAnalyzer.js`):** Math, currency, cart value tiering, user type (new/returning), and discount ceiling logic. *Why? LLMs are notoriously unreliable with exact math and business rules. A hallucinated discount ruins merchant trust.*
*   **AI Generative (`messageGenerator.js`):** Tone, phrasing, contextualizing the product category (e.g., referencing "apparel" fit vs "electronics" specs), and crafting a human-sounding email. *Why? Deterministic templates feel robotic. The AI excels at synthesizing facts into a warm, contextual message.*

## Failure Handling & Graceful Degradation
RecoverAI is designed to fail gracefully across several potential points of failure:

1.  **LLM Failure / Hallucination:** If the Gemini API times out, returns malformed JSON, or fails to parse, the `try/catch` block in `messageGenerator.js` immediately falls back to a hardcoded, safe static email. The user still gets a recovery email, just not a personalized one.
2.  **Missing Shopify Data:** If the Shopify webhook payload is missing the customer's first name, the deterministic parser falls back to "there" (`checkout.customer?.first_name || 'there'`), preventing the AI from breaking or sending "Hi null,".
3.  **Database Outages:** If Supabase fails during the state-check, the webhook endpoint returns a 500 but safely aborts the email generation to prevent duplicate blasts.

## Known Limitations & Future Work
*   **Single Channel:** Currently limited to Email. Adding SMS via Twilio would improve conversion rates for urgent, high-intent carts.
*   **One-Way Communication:** The system sends emails but doesn't yet parse customer replies to handle objections (e.g., if a user replies "Shipping is too high"). Future iterations would pipe inbound email replies back through the LLM.
