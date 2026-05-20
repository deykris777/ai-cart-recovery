import { z } from "zod";

export const KpiDataSchema = z.object({
  revenueRecovered: z.number(),
  revenueRecoveredTrend: z.array(z.number()),
  recoveryRate: z.number(),
  recoveryRateTrend: z.array(z.number()),
  cartsRecovered: z.number().int(),
  cartsRecoveredTrend: z.array(z.number()),
  marginProtected: z.number(),
  marginProtectedTrend: z.array(z.number()),
});

export type KpiData = z.infer<typeof KpiDataSchema>;

export const StrategyChartItemSchema = z.object({
  strategy: z.string(),
  attempts: z.number().int(),
  converted: z.number().int(),
});

export type StrategyChartItem = z.infer<typeof StrategyChartItemSchema>;

export const AgentLogItemSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  email: z.string(),
  cartValue: z.number(),
  strategy: z.string(),
  decision: z.string(),
  reasoning: z.string(),
});

export type AgentLogItem = z.infer<typeof AgentLogItemSchema>;

export const StrategyPerformanceItemSchema = z.object({
  name: z.string(),
  attempts: z.number().int(),
  successRate: z.number(),
  revenueRecovered: z.number(),
  marginImpact: z.number(),
});

export type StrategyPerformanceItem = z.infer<typeof StrategyPerformanceItemSchema>;

export const InterventionItemSchema = z.object({
  id: z.string(),
  email: z.string(),
  cartValue: z.number(),
  tier: z.string(),
  frictionPoint: z.string(),
  strategy: z.string(),
  status: z.string(),
  timestamp: z.string(),
});

export type InterventionItem = z.infer<typeof InterventionItemSchema>;

export const SimulationRequestSchema = z.object({
  cartValue: z.number(),
  email: z.string(),
  productName: z.string(),
  customerType: z.string(),
});

export type SimulationRequest = z.infer<typeof SimulationRequestSchema>;

export const SimulationResponseSchema = z.object({
  strategy: z.string(),
  emailCopy: z.string(),
  confidenceScore: z.number(),
  reasoning: z.string(),
});

export type SimulationResponse = z.infer<typeof SimulationResponseSchema>;
