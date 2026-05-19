# Decision Log

A running list of architectural and product decisions made during the build of RecoverAI.

### 1. Choice of AI Model: Gemini 2.5 Flash over GPT-4o
*   **Considered:** GPT-4o, Claude 3.5 Sonnet, Gemini 2.5 Flash.
*   **Chose:** Gemini 2.5 Flash.
*   **Because:** High-speed real-time recovery requires low latency. Flash is incredibly fast, and since we are using strict system prompting and `responseMimeType: "application/json"`, it provides more than enough reasoning capability for email generation while keeping our server response times low.

### 2. State Management: Supabase over Redis
*   **Considered:** Redis (for fast ephemeral state) vs Supabase (PostgreSQL).
*   **Chose:** Supabase.
*   **Because:** While checkout sessions are ephemeral, we need persistent records to measure conversion rates and view the history in the merchant dashboard. Supabase allows us to build the dashboard directly off the same DB without syncing to a separate data warehouse.

### 3. Splitting Cart Analysis from Message Generation
*   **Considered:** Passing the raw Shopify webhook JSON directly to the LLM and asking it to figure out what to do.
*   **Chose:** Building `cartAnalyzer.js` to deterministically parse and simplify the payload before passing it to the LLM.
*   **Because:** Raw Shopify webhook payloads are massive and full of noise. Passing the raw payload increases token cost, adds latency, and risks the LLM hallucinating product prices. Extracting only what matters deterministically ensures the LLM stays focused strictly on tone and copy generation.

### 4. Handling LLM Hallucinations via Fallbacks
*   **Considered:** Retrying the LLM call 3 times if it fails to return valid JSON.
*   **Chose:** Zero retries, immediate static fallback.
*   **Because:** In a real-time recovery scenario, latency is the enemy. Waiting for 3 failed LLM calls could delay the process significantly. If the LLM fails once, we log the error and immediately send a safe, pre-written static template. Reliability beats slight personalization in edge cases.

### 5. Dual Escalation Architecture: setTimeout vs Cron
*   **Considered:** Relying solely on `setTimeout` for follow-ups or solely on a cron job.
*   **Chose:** A dual architecture using both `setTimeout` (with demo mode scaling) and a cron job (`escalationChecker.js`).
*   **Because:** `setTimeout` enables rapid testing in demo mode (compressing 24 hours to minutes) but doesn't survive server restarts. The cron job acts as a production safety net for multi-day follow-ups. Double-sending is prevented by checking the attempt count (`attempts.length === 1`) in the database before sending.
