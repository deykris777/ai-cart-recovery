# Product Document: RecoverAI

## Problem & Significance
Cart abandonment is the largest leak in ecommerce revenue, yet the industry standard solution—a generic "you left something behind" email sent hours later—is fundamentally broken. It treats all abandonments as forgetfulness, ignoring real friction points like shipping shock, payment issues, or simple hesitation.

RecoverAI solves this by moving from **batch-and-blast to real-time conversational recovery**. We detect abandonment intent quickly, assess the cart value, and use an AI agent to craft a highly context-aware, personalized intervention that directly addresses the likely friction point.

## Target User & Core Journey
**The Merchant:** Wants higher recovery rates without seeming desperate or discounting unnecessarily.
**The Buyer:** Wants their specific hesitation addressed (e.g., "Is this shoe true to size?") or a gentle, non-annoying nudge.

**Core Journey:**
1. User abandons a Shopify checkout.
2. RecoverAI ingests the webhook in real-time.
3. The deterministic engine categorizes the cart (value tier, product category).
4. The AI Agent determines the optimal intervention strategy (tone, timing, incentive).
5. The AI generates a contextual email designed to unblock the user.
6. The system monitors for conversion, stopping the escalation sequence if the user purchases.

## Scope Decisions
*   **What we built:** A smart intervention system that analyzes carts deterministically but generates communication generatively.
*   **What we chose NOT to build:** We did not build a chat widget on the checkout page itself.
    *   *Why:* Injecting scripts into Shopify's checkout is highly restricted (requires Checkout Extensibility) and often degrades page load times. Intervening immediately *post-abandonment* via existing channels (email) is safer, universally compatible, and easier for merchants to adopt.

## Key Tradeoffs
*   **Speed vs. Complexity:** We traded deep multi-turn conversation memory for high-speed, single-shot contextual generation. A multi-turn bot over email is too slow; instead, we aim to resolve friction in one highly targeted message.
*   **AI Autonomy vs. Safety:** We restricted the AI from deciding cart value or discount rules. The deterministic layer sets the rules (e.g., "Max 10% discount"), and the AI simply crafts the message within those strict boundaries. This prevents the bot from hallucinating a 90% discount.
