import { pgTable, uuid, text, timestamp, doublePrecision } from "drizzle-orm/pg-core";

export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  cartValue: doublePrecision("cart_value").notNull(),
  productName: text("product_name").notNull(),
  customerTier: text("customer_tier").notNull(), // 'Bronze', 'Silver', 'Gold', 'VIP'
  frictionPoint: text("friction_point").notNull(), // 'Price', 'Shipping Cost', 'Technical Error', 'Trust'
  strategy: text("strategy").notNull(), // 'Reminder', 'Social Proof', 'Scarcity', 'Discount'
  status: text("status").notNull(), // 'Pending', 'Sent', 'Converted', 'Failed'
  confidenceScore: doublePrecision("confidence_score").notNull(),
  agentLog: text("agent_log").notNull(),
  emailCopy: text("email_copy").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
