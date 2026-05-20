import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { db, carts } from "@workspace/db";
import { desc, eq, sql } from "drizzle-orm";
import { SimulationRequestSchema } from "@workspace/api-zod";

dotenv.config({ path: "../../.env" });

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// GET /api/kpis
app.get("/api/kpis", async (req, res) => {
  try {
    const allCarts = await db.select().from(carts);

    const convertedCarts = allCarts.filter(c => c.status === "Converted");
    const totalRecovered = convertedCarts.reduce((sum, c) => sum + c.cartValue, 0);
    const recoveryRate = allCarts.length > 0 ? (convertedCarts.length / allCarts.length) : 0;
    const cartsRecoveredCount = convertedCarts.length;

    // Margin Protected: Sum of (cartValue * (1 - discountRate)) or a similar logic.
    // For our dataset, we can assume a margin of 65% minus the discount impact.
    // Let's compute: sum of cartValue * 0.65 for non-discounts, and cartValue * 0.50 for discounts (simulating a 15% discount impact).
    const marginProtected = convertedCarts.reduce((sum, c) => {
      const baseMargin = c.cartValue * 0.65;
      if (c.strategy === "Discount") {
        return sum + (baseMargin - (c.cartValue * 0.15)); // discount reduces margin
      }
      return sum + baseMargin;
    }, 0);

    // Sparkline trend data (mocking historical trends over the last 7 points based on the seeded db and time)
    const revenueRecoveredTrend = [450, 750, 950, 1100, 1400, 1850, totalRecovered];
    const recoveryRateTrend = [0.38, 0.42, 0.45, 0.48, 0.52, 0.56, recoveryRate];
    const cartsRecoveredTrend = [2, 4, 5, 6, 8, 9, cartsRecoveredCount];
    const marginProtectedTrend = [280, 480, 600, 700, 900, 1180, marginProtected];

    res.json({
      revenueRecovered: totalRecovered,
      revenueRecoveredTrend,
      recoveryRate: parseFloat(recoveryRate.toFixed(4)),
      recoveryRateTrend,
      cartsRecovered: cartsRecoveredCount,
      cartsRecoveredTrend,
      marginProtected,
      marginProtectedTrend,
    });
  } catch (error) {
    console.error("Error fetching KPIs:", error);
    res.status(500).json({ error: "Failed to fetch KPIs" });
  }
});

// GET /api/chart
app.get("/api/chart", async (req, res) => {
  try {
    const allCarts = await db.select().from(carts);
    const strategies = ["Social Proof", "Reminder", "Scarcity", "Discount"];

    const chartData = strategies.map(strategyName => {
      const attempts = allCarts.filter(c => c.strategy === strategyName).length;
      const converted = allCarts.filter(c => c.strategy === strategyName && c.status === "Converted").length;
      return {
        strategy: strategyName,
        attempts,
        converted,
      };
    });

    res.json(chartData);
  } catch (error) {
    console.error("Error fetching chart data:", error);
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
});

// GET /api/logs
app.get("/api/logs", async (req, res) => {
  try {
    const allCarts = await db.select().from(carts).orderBy(desc(carts.createdAt));
    const logs = allCarts.map(c => ({
      id: c.id,
      timestamp: c.createdAt.toISOString(),
      email: c.email,
      cartValue: c.cartValue,
      strategy: c.strategy,
      decision: `Selected ${c.strategy} recovery strategy`,
      reasoning: c.agentLog,
    }));
    res.json(logs);
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// GET /api/strategies
app.get("/api/strategies", async (req, res) => {
  try {
    const allCarts = await db.select().from(carts);
    const strategies = ["Social Proof", "Reminder", "Scarcity", "Discount"];

    const performance = strategies.map(name => {
      const strategyCarts = allCarts.filter(c => c.strategy === name);
      const attempts = strategyCarts.length;
      const converted = strategyCarts.filter(c => c.status === "Converted").length;
      const successRate = attempts > 0 ? (converted / attempts) : 0;
      const revenueRecovered = strategyCarts
        .filter(c => c.status === "Converted")
        .reduce((sum, c) => sum + c.cartValue, 0);

      // Margin Impact: for discount strategy it is lower than others due to coupon code
      const marginImpact = name === "Discount" ? 0.50 : 0.65;

      return {
        name,
        attempts,
        successRate: parseFloat(successRate.toFixed(4)),
        revenueRecovered,
        marginImpact,
      };
    });

    res.json(performance);
  } catch (error) {
    console.error("Error fetching strategies performance:", error);
    res.status(500).json({ error: "Failed to fetch strategies" });
  }
});

// GET /api/interventions
app.get("/api/interventions", async (req, res) => {
  try {
    const allCarts = await db.select().from(carts).orderBy(desc(carts.createdAt));
    const interventions = allCarts.map(c => ({
      id: c.id,
      email: c.email,
      cartValue: c.cartValue,
      tier: c.customerTier,
      frictionPoint: c.frictionPoint,
      strategy: c.strategy,
      status: c.status,
      timestamp: c.createdAt.toISOString(),
    }));
    res.json(interventions);
  } catch (error) {
    console.error("Error fetching interventions:", error);
    res.status(500).json({ error: "Failed to fetch interventions" });
  }
});

// POST /api/simulate
app.post("/api/simulate", async (req, res) => {
  try {
    const validated = SimulationRequestSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ error: validated.error.errors });
    }

    const { cartValue, email, productName, customerType } = validated.data;

    // Simulate agent logic based on inputs:
    let strategy = "Reminder";
    let confidenceScore = 0.70;
    let reasoning = "";
    let emailCopy = "";

    if (cartValue >= 5000 && customerType === "VIP") {
      strategy = "Discount";
      confidenceScore = 0.94;
      reasoning = `VIP customer with high-value item (${productName}, ₹${cartValue}). Margins allow for VIP treatment. AI suggests a generous 15% discount to guarantee high-value conversion.`;
      emailCopy = `Dear Valued VIP, we noticed you left the ${productName} in your cart. To ensure you receive the ultimate experience, we'd like to extend an exclusive 15% off your order. Use code: VIP15.`;
    } else if (cartValue >= 2000 && (customerType === "Gold" || customerType === "Silver")) {
      strategy = "Social Proof";
      confidenceScore = 0.85;
      reasoning = `High-tier customer with cart value ₹${cartValue}. Product verification indicates high social volume. Selected Social Proof to emphasize quality and community reception.`;
      emailCopy = `Hello, we noticed you forgot the ${productName} in your cart. Don't take our word for it—see why over 4.9/5 stars rate this as their top purchase. Read customer reviews...`;
    } else if (cartValue < 1000) {
      strategy = "Reminder";
      confidenceScore = 0.75;
      reasoning = `Low-value cart (₹${cartValue}). Discount strategy is not cost-effective. AI selected standard Reminder strategy to preserve margins.`;
      emailCopy = `Hi, we saved the items in your shopping cart. Click here to resume your checkout of the ${productName} before you forget!`;
    } else {
      strategy = "Scarcity";
      confidenceScore = 0.80;
      reasoning = `Mid-value cart (₹${cartValue}) and customer type is ${customerType}. Stock levels for ${productName} are low. urgency selected to prompt immediate checkout.`;
      emailCopy = `Hi there, the ${productName} in your cart is selling fast! We can only hold it for a limited time due to high demand. Complete checkout now to lock in yours.`;
    }

    // Save simulation to the database as a "Pending" intervention
    const [inserted] = await db.insert(carts).values({
      email,
      cartValue,
      productName,
      customerTier: customerType,
      frictionPoint: "Price",
      strategy,
      status: "Pending",
      confidenceScore,
      agentLog: reasoning,
      emailCopy,
    }).returning();

    res.json({
      strategy,
      emailCopy,
      confidenceScore,
      reasoning,
    });
  } catch (error) {
    console.error("Error in simulator:", error);
    res.status(500).json({ error: "Failed to simulate" });
  }
});

// Serve static assets from recoveryai-dashboard dist if it exists
const frontendDistPath = path.join(__dirname, "../../recoveryai-dashboard/dist");
app.use(express.static(frontendDistPath));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, "index.html"), (err) => {
    if (err) {
      res.status(200).send(`
        <html>
          <head>
            <title>RecoverAI API Server</title>
            <style>
              body { background: #080C10; color: #F3F4F6; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              a { color: #2DD4BF; text-decoration: none; font-weight: bold; border: 1px solid #2DD4BF; padding: 10px 20px; border-radius: 4px; margin-top: 20px; display: inline-block; transition: all 0.2s; }
              a:hover { background: #2DD4BF; color: #080C10; }
              h1 { margin: 0; font-size: 24px; letter-spacing: 1px; }
              p { color: #9CA3AF; margin: 10px 0 0 0; }
            </style>
          </head>
          <body>
            <h1>RecoverAI Control Room API</h1>
            <p>The backend is running, but the frontend static files aren't built or served here yet.</p>
            <a href="http://localhost:5173">Go to Dashboard Dev Server (Port 5173)</a>
          </body>
        </html>
      `);
    }
  });
});

app.listen(port, () => {
  console.log(`RecoverAI API Server running on port ${port}`);
});
