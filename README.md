# RecoverAI — AI-Assisted Checkout Recovery
### Kasparro Agentic Commerce Hackathon · Track 2

> *"A recovery agent that doesn't just send emails — it reads the situation, decides the best move, and follows up step by step until the customer converts or it knows to stop."*

---

## Submission Links

| | |
|---|---|
| **GitHub Repository** | https://github.com/deykris777/ai-cart-recovery |
| **Live Demo (Render)** | https://ai-cart-recovery.onrender.com/ |
| **Demo Video** | https://drive.google.com/file/d/1DwcKheXG3Br_U68Nd01O4lHyiA03L7Hw/view?usp=drive_link|
| **Product Document** | [View PDF](https://drive.google.com/file/d/1V6Xbc0sOSR4hcKWkjc4rXg2diGNEusCV/view?usp=sharing) · [PRODUCT_DOCUMENT.md](./PRODUCT_DOCUMENT.md) |
| **Technical Document** | [View PDF](https://drive.google.com/file/d/1W7vEQRT-SLeP6ccdQbOGrZH99gRCHW-7/view?usp=sharing) · [TECHNICAL_DOCUMENT.md](./TECHNICAL_DOCUMENT.md) |
| **Decision Log** | [View PDF](https://drive.google.com/file/d/1hAKOHPlZ4pCazVhSr1y8ktA5D3sGnfxB/view?usp=sharing) · [DECISION_LOG.md](./DECISION_LOG.md) |
| **Git History** | [View PDF](https://drive.google.com/file/d/12CRFxvDzow3-K6q3nvjzcc_RvOYrdSZr/view?usp=sharing) |

---

## Problem Statement

Cart abandonment is the biggest revenue leak in ecommerce. Most recovery today is a static follow-up email sent hours later — after the buyer has already moved on.

RecoverAI intervenes in real time. It deterministically analyzes the cart value, customer type, and abandonment context to choose the right recovery strategy, then uses Groq LLaMA-3 70B to generate a personalized, context-aware email that addresses the buyer's actual friction point — not a generic "you left something behind" message.

The agent follows up across up to 3 attempts, escalating its strategy each time without repeating what already failed.

---

## How It Works

```
Cart Abandoned
      ↓
strategyEngine.js resolves strategy deterministically
(Reminder → Scarcity → Discount, based on customer type + cart value)
      ↓
Groq LLaMA-3 70B generates personalized recovery email
(tone, confidence, reasoning, email subject + body)
      ↓
SendGrid dispatches email
      ↓
Supabase logs attempt (strategy, reasoning, outcome)
      ↓
If no conversion in 24h → escalationChecker.js fires next attempt
      ↓
Dashboard shows live agent reasoning + recovery metrics
```

---

## Strategy Engine (Deterministic Rules)

The AI never decides which strategy to use. Strategy selection is deterministic — governed by hard rules that protect merchant margin.

| Customer Type | Attempt 1 | Attempt 2 | Attempt 3 |
|---|---|---|---|
| Returning Customer | Reminder | Scarcity | Discount |
| New Customer (cart < ₹5,000) | Social Proof | Reminder | Scarcity |
| New Customer (cart ≥ ₹5,000) | Social Proof | Scarcity | Discount |

> Discount is always the last resort. For new customers with low cart value, no discount is ever offered — protecting merchant margin completely.

**Groq LLaMA handles:** tone, confidence score, friction point reasoning, email copy.
**Deterministic code handles:** strategy selection, discount percentage, attempt sequencing, repetition prevention.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express.js |
| AI Reasoning | Groq LLaMA-3 70B (`groq-sdk`) |
| Database | Supabase (PostgreSQL) |
| Email Delivery | SendGrid |
| Frontend | Vite + React + TailwindCSS |
| ORM | Drizzle ORM |
| Ecommerce | Shopify Admin API (Webhooks) |
| Deployment | Render |

---

## Contribution Note

**Solo participation.**

- 35% — Product framing, scope decisions, user journey mapping, all documentation (Product Doc, Technical Doc, Decision Log)
- 65% — Node/Express backend, Shopify webhook integration, Groq LLaMA integration, SendGrid email dispatch, Supabase state management, escalation logic, React dashboard

---

## Repository Structure

```
ai-cart-recovery/
├── src/
│   ├── services/
│   │   ├── agentDecision.js       # Core recovery orchestrator
│   │   ├── escalationChecker.js   # Attempt 2 & 3 escalation
│   │   └── messageGenerator.js    # Groq email generation
│   ├── utils/
│   │   └── strategyEngine.js      # Deterministic strategy rules
│   ├── routes/
│   │   └── dashboard.js           # API endpoints
│   └── db/
│       └── supabase.js            # Database client
├── dashboard/
│   └── index.html                 # Frontend dashboard
├── PRODUCT_DOCUMENT.md
├── TECHNICAL_DOCUMENT.md
├── DECISION_LOG.md
├── .env.example
└── README.md
```

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/deykris777/ai-cart-recovery.git
cd ai-cart-recovery
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in your `.env`:

```env
# Groq (required — strategy reasoning + email generation)
GROQ_API_KEY=your_groq_api_key_here

# Supabase (required — state management)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx

# SendGrid (required — email delivery)
SENDGRID_API_KEY=SG.xxxx
SENDER_EMAIL=recoveryai@yourdomain.com

# Shopify (not required in DEMO_MODE)
SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxx
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret

DEMO_MODE=true
NODE_ENV=development
```

### 3. Create Supabase tables

Run this SQL in your Supabase SQL editor:

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

### 4. Start the server

```bash
npm run dev
```

Dashboard available at `http://localhost:3000`

---

## Testing the Agent

1. Open the dashboard at the live Render link or `http://localhost:3000`
2. Use the **Agent Simulator** panel — enter a cart value, email, product name, and customer type
3. Click **Fire Recovery Agent**
4. Watch the agent reasoning log update in real time — it shows the strategy chosen, why it was chosen, confidence score, and generated email
5. If you enter your real email, SendGrid will deliver the actual recovery email to your inbox

---

## Failure Handling

| Scenario | Behavior |
|---|---|
| Groq returns malformed response | Retry once, then fall back to pre-written template |
| Shopify API down | Use cached cart data, proceed with recovery |
| Customer email invalid | Mark as unrecoverable, skip further attempts |
| Strategy selection error | Default to Reminder as safest first attempt |
| Supabase write fails | Log error, continue attempt without persisting |

> The system always attempts recovery even when components fail. A template message is better than silence.

---

## What Was Not Built (Scope Decisions)

- **Login / Authentication** — Out of scope. Dashboard is merchant-internal.
- **Multi-channel recovery (SMS, push)** — Email is highest ROI channel. Added complexity without proportional gain.
- **A/B testing framework** — Requires volume for statistical significance. Noted as next improvement.
- **Merchant customization panel** — Rules adjustable in config file for now.
- **Real-time Shopify webhook** — Simulator replaces this for demo purposes.
