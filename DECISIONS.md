# RecoverAI — Decision Log

## Philosophy
We considered X, chose Y, because Z.
This log documents every major decision made during the build.

---

## Decision 1: Why we built real-time intervention instead of email recovery

Considered: Post-abandonment email (standard industry approach)
Chose: Real-time in-session intervention
Because: Emails arrive hours later when purchase intent has already 
dropped. Real-time intervention catches the customer at peak intent. 
The window to recover a cart is widest in the first 30 minutes.
Ruled out: Email recovery — too late, too generic, too easy to ignore.

---

## Decision 2: Why we chose these 4 strategies (Discount, Reminder, 
## Social Proof, Scarcity)

Considered: Free shipping offer, loyalty points, live chat escalation,
bundle offers
Chose: Discount, Reminder, Social Proof, Scarcity
Because: These four cover the four core friction points in checkout 
abandonment — price hesitation (discount), distraction (reminder), 
trust gap (social proof), and indecision (scarcity). Adding more 
strategies increases complexity without meaningfully improving coverage.
Ruled out: Free shipping — requires merchant configuration we cannot 
control. Loyalty points — requires existing loyalty program integration.

---

## Decision 3: Why we never repeat a failed strategy

Considered: Retrying the same strategy with a different message
Chose: Hard rule — never repeat a failed strategy on same customer
Because: If a strategy failed once, the underlying friction it 
addresses is not the customer's actual blocker. Repeating it wastes 
an attempt and risks annoying the customer.
Ruled out: Strategy retry — diminishing returns, increases unsubscribe 
risk.

---

## Decision 4: Strategy selection rules by customer type and cart value

Considered: Purely AI-driven strategy selection with no rules
Chose: Deterministic rules + AI reasoning hybrid
Because: Pure AI selection is unpredictable and can offer unnecessary 
discounts to customers who would have converted anyway, hurting merchant 
margin. Hard rules protect business logic while AI handles personalization.

Rules defined:
- Returning customer, any cart value → start with Reminder
- New customer, cart value below ₹5000 → start with Social Proof
- New customer, cart value above ₹5000 → start with Social Proof 
  then Discount if needed
- Any customer, previous attempt failed → escalate to Scarcity 
  before Discount
- Discount is always last resort to protect merchant margin

---

## Decision 5: Attempt 1 — Returning Customer, ₹3500 cart, 
## Trail Running Shoes

Considered: Discount, Social Proof, Scarcity, Reminder
Chose: Reminder
Because: Returning customer means trust is already established, 
so Social Proof is unnecessary. Cart value is medium tier — 
no need to sacrifice margin with a discount on first attempt. 
A gentle reminder tests whether the customer was simply distracted.
Message sent: "Hi Alex, just a quick heads-up that you left those 
Trail Running Shoes in your cart. We've securely saved your session 
in case you got pulled away. Let us know if you need any help with 
sizing before you check out!"
Expected outcome: Low-pressure nudge converts without discount.
If this fails: Attempt 2 will use Scarcity — highlight that popular 
sizes sell out quickly. Discount avoided unless both Reminder and 
Scarcity fail.

---

## Decision 6: Attempt 1 — Returning Customer, ₹7500 cart,
## Ergonomic Office Chair

Considered: Discount, Social Proof, Scarcity, Reminder
Chose: Reminder (Attempt 1) → Scarcity (Attempt 2)
Because: Returning customer, high value cart. First attempt uses 
Reminder following returning customer rule. When Reminder failed, 
Scarcity was chosen over Discount because returning customer already 
knows product value — discount signals desperation and hurts margin 
unnecessarily. Scarcity creates urgency without reducing perceived value.
Message sent (Attempt 2): "Hi there! Just a heads-up that our 
Ergonomic Office Chairs are selling faster than expected this week. 
We can't guarantee your cart will stay reserved for much longer, 
so secure yours before they're gone!"
Reasoning: Price hesitation on high-value item is best resolved 
through urgency, not price reduction.

---

## Decision 7: What the AI handles vs what deterministic code handles

Considered: Letting AI decide everything including strategy selection
Chose: Hard rules for strategy selection, AI for message generation 
and reasoning
Because: Strategy selection must be predictable and margin-safe. 
AI is unreliable for business-critical decisions without guardrails. 
AI excels at personalized, human-sounding message generation — 
that is where we let it operate freely.

AI handles:
- Writing the recovery message
- Reasoning about likely friction point
- Generating the agent reasoning log

Deterministic code handles:
- Strategy elimination (never repeat failed strategy)
- Cart value thresholds
- Customer type routing
- Attempt sequencing

---

## Decision 8: Failure handling — what happens when things break

Considered: Failing silently, showing error to merchant
Chose: Graceful degradation with fallback message
Because: A failed API call should never mean zero recovery attempt. 
If LLM returns malformed response, we retry once then fall back to 
a pre-written template message matching the chosen strategy.

Failure scenarios handled:
- Shopify API down → cache last known cart data, attempt recovery 
  with available information
- LLM returns garbage → retry once, then use template fallback
- Customer email invalid → log as unrecoverable, skip attempt
- Strategy selection error → default to Reminder as safest first step

---

## Decision 9: What we chose NOT to build

Ruled out: Multi-channel recovery (SMS, push notifications)
Because: Scope too large for this build. Email/in-session is the 
highest ROI channel for cart recovery.

Ruled out: A/B testing framework for strategies
Because: Requires sufficient volume of carts to be statistically 
meaningful. Out of scope for hackathon but noted as next improvement.

Ruled out: Merchant customization panel
Because: Adds frontend complexity without improving core recovery logic. 
Merchants can adjust rules in configuration file for now.

---

## What we would improve with more time

1. Memory across sessions — agent remembers what failed for a 
   customer across multiple visits, not just current session
2. Time-based strategy adjustment — different strategies at 
   1 hour, 6 hours, 24 hours post abandonment
3. A/B testing framework — measure which strategy works best 
   per product category
4. Merchant margin protection setting — let merchant define 
   maximum discount percentage they are willing to offer
5. Recovery rate improvement — current rate is 3%, target is 
   10-15% with smarter strategy sequencing
