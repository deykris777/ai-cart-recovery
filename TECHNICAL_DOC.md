# Technical Document: RecoverAI

## System Architecture
RecoverAI is built on a Node.js (Express) backend, utilizing Shopify Webhooks, Supabase for state management, and Google's Gemini API for generative tasks.

**Data Flow:**
1.  **Ingestion:** Shopify `checkouts/create` webhook sends payload to `/webhooks/checkout/abandoned` (via ngrok for local dev).
2.  **Analysis (Deterministic):** `cartAnalyzer.js` parses the webhook, extracts the currency field as-is from the payload (defaulting to `INR` if absent), extracts line items, and classifies the cart into a `value_tier` (low, medium, high) and `product_category`. *(Note: no currency conversion is performed — multi-currency normalization is a known limitation tracked under Future Work.)*
3.  **Strategy Formulation:** `agentDecision.js` calls Gemini to decide the optimal recovery strategy (tone, timing, message type, and whether to offer a discount), then schedules the escalation sequence. The AI decision is bounded by deterministic rules set in `cartAnalyzer.js` — the LLM cannot exceed the discount ceiling or override cart value tiers.
4.  **Generation (AI):** `messageGenerator.js` prompts the Gemini model with strict JSON output instructions to generate the subject and body of the recovery message.
5.  **Delivery:** `emailService.js` dispatches the message.

## AI vs. Deterministic Boundaries
A critical design decision was drawing a strict line between what the LLM handles and what code handles:

*   **Deterministic (`cartAnalyzer.js`):** Strategy elimination (never repeat failed strategy), cart value thresholds (above ₹5000 = avoid immediate discount), and customer type rules (returning vs new). *Why? LLMs are notoriously unreliable with exact math and business rules. A hallucinated discount ruins merchant trust.*
*   **AI Generative (`agentDecision.js` & `messageGenerator.js`):** Reasoning about WHY a strategy failed, predicting the most likely friction point, and writing the personalized message. *Why? Deterministic templates feel robotic. The AI excels at synthesizing facts into a warm, contextual message.*

*This boundary ensures the agent never makes logically invalid decisions while still being flexible in communication.*

## Failure Handling & Graceful Degradation
RecoverAI is designed to fail gracefully across several potential points of failure:

1.  **LLM Failure / Hallucination:** If the Gemini API times out, returns malformed JSON, or fails to parse, the `try/catch` block in `messageGenerator.js` immediately falls back to a hardcoded, safe static email. The user still gets a recovery email, just not a personalized one.
2.  **Missing Shopify Data:** If the Shopify webhook payload is missing the customer's first name, the deterministic parser falls back to "there" (`checkout.customer?.first_name || 'there'`), preventing the AI from breaking or sending "Hi null,".
3.  **Database Outages:** If Supabase fails during the state-check, the webhook endpoint returns a 500 but safely aborts the email generation to prevent duplicate blasts.

## Known Limitations & Future Work
*   **Single Channel:** Currently limited to Email. Adding SMS via Twilio would improve conversion rates for urgent, high-intent carts.
*   **One-Way Communication:** The system sends emails but doesn't yet parse customer replies to handle objections (e.g., if a user replies "Shipping is too high"). Future iterations would pipe inbound email replies back through the LLM.
*   Dual escalation systems (setTimeout + cron) should be unified in production into a job queue (e.g. Bull/BullMQ with Redis) so escalations survive server restarts without risk of duplicate sends.

