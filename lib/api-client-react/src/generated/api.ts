import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

// Default axios instance config
const AXIOS_INSTANCE = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || "http://localhost:3000",
});

export interface KpiData {
  revenueRecovered: number;
  revenueRecoveredTrend: number[];
  recoveryRate: number;
  recoveryRateTrend: number[];
  cartsRecovered: number;
  cartsRecoveredTrend: number[];
  marginProtected: number;
  marginProtectedTrend: number[];
}

export interface StrategyChartItem {
  strategy: string;
  attempts: number;
  converted: number;
}

export interface AgentLogItem {
  id: string;
  timestamp: string;
  email: string;
  cartValue: number;
  strategy: string;
  decision: string;
  reasoning: string;
}

export interface StrategyPerformanceItem {
  name: string;
  attempts: number;
  successRate: number;
  revenueRecovered: number;
  marginImpact: number;
}

export interface InterventionItem {
  id: string;
  email: string;
  cartValue: number;
  tier: string;
  frictionPoint: string;
  strategy: string;
  status: string;
  timestamp: string;
}

export interface SimulationRequest {
  cartValue: number;
  email: string;
  productName: string;
  customerType: string;
}

export interface SimulationResponse {
  strategy: string;
  emailCopy: string;
  confidenceScore: number;
  reasoning: string;
}

export const getKpis = (): Promise<KpiData> => {
  return AXIOS_INSTANCE.get(`/api/kpis`).then((res) => res.data);
};

export const useGetKpis = (options?: Omit<UseQueryOptions<KpiData, AxiosError>, "queryKey" | "queryFn">) => {
  return useQuery<KpiData, AxiosError>({
    queryKey: ["/api/kpis"],
    queryFn: getKpis,
    ...options,
  });
};

export const getChartData = (): Promise<StrategyChartItem[]> => {
  return AXIOS_INSTANCE.get(`/api/chart`).then((res) => res.data);
};

export const useGetChartData = (options?: Omit<UseQueryOptions<StrategyChartItem[], AxiosError>, "queryKey" | "queryFn">) => {
  return useQuery<StrategyChartItem[], AxiosError>({
    queryKey: ["/api/chart"],
    queryFn: getChartData,
    ...options,
  });
};

export const getLogs = (): Promise<AgentLogItem[]> => {
  return AXIOS_INSTANCE.get(`/api/logs`).then((res) => res.data);
};

export const useGetLogs = (options?: Omit<UseQueryOptions<AgentLogItem[], AxiosError>, "queryKey" | "queryFn">) => {
  return useQuery<AgentLogItem[], AxiosError>({
    queryKey: ["/api/logs"],
    queryFn: getLogs,
    ...options,
  });
};

export const getStrategies = (): Promise<StrategyPerformanceItem[]> => {
  return AXIOS_INSTANCE.get(`/api/strategies`).then((res) => res.data);
};

export const useGetStrategies = (options?: Omit<UseQueryOptions<StrategyPerformanceItem[], AxiosError>, "queryKey" | "queryFn">) => {
  return useQuery<StrategyPerformanceItem[], AxiosError>({
    queryKey: ["/api/strategies"],
    queryFn: getStrategies,
    ...options,
  });
};

export const getInterventions = (): Promise<InterventionItem[]> => {
  return AXIOS_INSTANCE.get(`/api/interventions`).then((res) => res.data);
};

export const useGetInterventions = (options?: Omit<UseQueryOptions<InterventionItem[], AxiosError>, "queryKey" | "queryFn">) => {
  return useQuery<InterventionItem[], AxiosError>({
    queryKey: ["/api/interventions"],
    queryFn: getInterventions,
    ...options,
  });
};

export const simulateIntervention = (data: SimulationRequest): Promise<SimulationResponse> => {
  return AXIOS_INSTANCE.post(`/api/simulate`, data).then((res) => res.data);
};

export const useSimulateIntervention = (options?: UseMutationOptions<SimulationResponse, AxiosError, SimulationRequest>) => {
  return useMutation<SimulationResponse, AxiosError, SimulationRequest>({
    mutationFn: simulateIntervention,
    ...options,
  });
};
