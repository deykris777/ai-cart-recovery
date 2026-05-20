import React, { useState, useEffect } from "react";
import {
  useGetKpis,
  useGetChartData,
  useGetLogs,
  useGetStrategies,
  useGetInterventions,
  useSimulateIntervention,
  SimulationRequest,
} from "@workspace/api-client-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  LayoutGrid,
  History,
  Terminal,
  ShieldCheck,
  Zap,
  TrendingUp,
  Percent,
  ShoppingCart,
  Play,
  User,
  Mail,
  IndianRupee,
  Package,
} from "lucide-react";

const STRATEGY_CONVERTED_COLORS: Record<string, string> = {
  Reminder: "#818cf8",
  Discount: "#f87171",
  "Social Proof": "#4ade80",
  Scarcity: "#fbbf24",
  reminder: "#818cf8",
  discount: "#f87171",
  social_proof: "#4ade80",
  scarcity: "#fbbf24",
};

const STRATEGY_ATTEMPTS_COLORS: Record<string, string> = {
  Reminder: "rgba(129, 140, 248, 0.25)",
  Discount: "rgba(248, 113, 113, 0.25)",
  "Social Proof": "rgba(74, 222, 128, 0.25)",
  Scarcity: "rgba(251, 191, 36, 0.25)",
  reminder: "rgba(129, 140, 248, 0.25)",
  discount: "rgba(248, 113, 113, 0.25)",
  social_proof: "rgba(74, 222, 128, 0.25)",
  scarcity: "rgba(251, 191, 36, 0.25)",
};

const getStrategyColor = (strategy: string) => STRATEGY_CONVERTED_COLORS[strategy] || "#2DD4BF";

const MOCK_SHOPPERS = [
  { email: "aarav.sharma@gmail.com", type: "Gold" },
  { email: "vihaan.patel@yahoo.com", type: "Silver" },
  { email: "ananya.iyer@outlook.com", type: "VIP" },
  { email: "diya.sen@gmail.com", type: "Bronze" },
  { email: "kabir.singh@hotmail.com", type: "Gold" },
  { email: "ishaan.reddy@gmail.com", type: "Silver" },
  { email: "riya.gupta@yahoo.co.in", type: "VIP" },
  { email: "aditya.joshi@gmail.com", type: "Bronze" },
  { email: "saisha.nair@icloud.com", type: "VIP" },
  { email: "arjun.rao@gmail.com", type: "Gold" },
  { email: "priya.pillai@gmail.com", type: "Silver" },
  { email: "neil.dutta@gmail.com", type: "VIP" }
];

const MOCK_PRODUCTS = [
  "Premium Wireless Earbuds",
  "Smart Fitness Watch",
  "Ergonomic Office Chair",
  "Mechanical Gaming Keyboard",
  "Designer Leather Wallet",
  "Noise Cancelling Headphones",
  "Ultralight Running Shoes",
  "Stainless Steel Water Bottle",
  "Compact Travel Backpack",
  "Portable Bluetooth Speaker",
  "4K UltraHD Smart Monitor",
  "Minimalist Desk Organizer"
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Fetching real data via the API client hooks
  const { data: kpis, isLoading: isKpisLoading, refetch: refetchKpis } = useGetKpis();
  const { data: chartData, isLoading: isChartLoading } = useGetChartData();
  const { data: logs, isLoading: isLogsLoading, refetch: refetchLogs } = useGetLogs();
  const { data: strategies, isLoading: isStrategiesLoading } = useGetStrategies();
  const { data: interventions, isLoading: isInterventionsLoading, refetch: refetchInterventions } = useGetInterventions();

  const simulatorMutation = useSimulateIntervention({
    onSuccess: () => {
      // Refetch table data and logs on successful simulation
      refetchInterventions();
      refetchLogs();
      refetchKpis();
    },
  });

  // Simulator Form State
  const [email, setEmail] = useState("test.shopper@domain.com");
  const [cartValue, setCartValue] = useState("2500.00");
  const [productName, setProductName] = useState("Premium Leather Boots");
  const [customerType, setCustomerType] = useState("Gold");

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: SimulationRequest = {
      email,
      cartValue: parseFloat(cartValue) || 0,
      productName,
      customerType,
    };
    simulatorMutation.mutate(payload);
  };

  // Auto-Pilot Traffic Simulator Mode
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);

  useEffect(() => {
    if (!isAutoSimulating) return;

    // Simulate right away on toggle activation
    const runSimulation = () => {
      const randomShopper = MOCK_SHOPPERS[Math.floor(Math.random() * MOCK_SHOPPERS.length)];
      const randomProduct = MOCK_PRODUCTS[Math.floor(Math.random() * MOCK_PRODUCTS.length)];
      const randomCartValue = Math.floor(800 + Math.random() * 11200).toFixed(2);

      const payload: SimulationRequest = {
        email: randomShopper.email,
        cartValue: parseFloat(randomCartValue),
        productName: randomProduct,
        customerType: randomShopper.type,
      };

      simulatorMutation.mutate(payload);
    };

    runSimulation();

    // Trigger simulation periodically
    const interval = setInterval(runSimulation, 6000); // 6 seconds for dynamic lively dashboard feel

    return () => clearInterval(interval);
  }, [isAutoSimulating]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-textPrimary">
        {/* 1. Sidebar Navigation */}
        <aside className="hidden lg:flex w-64 border-r border-border bg-surface flex-col justify-between h-full">
        <div>
          <div className="p-6 border-b border-border flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-accent flex items-center justify-center text-background font-bold tracking-tighter">
              RA
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-widest text-textPrimary uppercase">
                RecoverAI
              </h1>
              <p className="text-[10px] text-accent font-mono uppercase tracking-wider">
                Control Room
              </p>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-all ${
                activeTab === "dashboard"
                  ? "bg-accent-dim text-accent border-l-2 border-accent"
                  : "text-textSecondary hover:text-textPrimary hover:bg-border/30"
              }`}
            >
              <LayoutGrid size={16} />
              <span>Dashboard Overview</span>
            </button>
            <button
              onClick={() => setActiveTab("interventions")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-all ${
                activeTab === "interventions"
                  ? "bg-accent-dim text-accent border-l-2 border-accent"
                  : "text-textSecondary hover:text-textPrimary hover:bg-border/30"
              }`}
            >
              <History size={16} />
              <span>Recovery Attempts</span>
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-all ${
                activeTab === "logs"
                  ? "bg-accent-dim text-accent border-l-2 border-accent"
                  : "text-textSecondary hover:text-textPrimary hover:bg-border/30"
              }`}
            >
              <Terminal size={16} />
              <span>Agent Decision Logs</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between text-[11px] font-mono text-textMuted">
            <span>Agent Status</span>
            <span className="flex items-center gap-1.5 text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Autonomous
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-textMuted">
            <span>LLM Engine</span>
            <span>Groq LLaMA</span>
          </div>
        </div>
      </aside>

      {/* Bottom Navigation for Mobile */}
      <nav className="flex lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border z-50 justify-around items-center px-4">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-all ${
            activeTab === "dashboard" ? "text-accent" : "text-textSecondary"
          }`}
        >
          <LayoutGrid size={18} />
          <span>Overview</span>
        </button>
        <button
          onClick={() => setActiveTab("interventions")}
          className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-all ${
            activeTab === "interventions" ? "text-accent" : "text-textSecondary"
          }`}
        >
          <History size={18} />
          <span>Attempts</span>
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-all ${
            activeTab === "logs" ? "text-accent" : "text-textSecondary"
          }`}
        >
          <Terminal size={18} />
          <span>Decision Logs</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-background pb-16 lg:pb-0">
        <header className="h-16 border-b border-border flex items-center justify-between px-4 lg:px-8 bg-surface">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold tracking-wider uppercase text-textPrimary">
              {activeTab === "dashboard" && "Mission Control Overview"}
              {activeTab === "interventions" && "All Recovery Attempts"}
              {activeTab === "logs" && "Live Decision Rationale Feed"}
            </h2>
            <span className="px-2 py-0.5 bg-border rounded text-[10px] font-mono text-textSecondary">
              Live updates
            </span>
          </div>
          <div className="text-xs font-mono text-textSecondary">
            System time: {new Date().toLocaleTimeString()}
          </div>
        </header>

        <div className="p-4 lg:p-8 space-y-6">
          {activeTab === "dashboard" && (
            <>
              {/* 2. KPI Cards Section */}
              {isKpisLoading ? (
                <div className="grid grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-28 bg-surface border border-border rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* KPI 1: Revenue Recovered */}
                  <div className="bg-surface border border-border p-4 rounded flex flex-col justify-between relative overflow-hidden">
                    <div>
                      <div className="flex justify-between items-center text-textMuted text-[10px] uppercase tracking-wider font-semibold">
                        <span>Revenue Recovered</span>
                        <TrendingUp size={14} className="text-accent" />
                      </div>
                      <div className="text-xl font-bold mt-1 text-textPrimary">
                        ₹{kpis?.revenueRecovered?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="h-10 mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={kpis?.revenueRecoveredTrend?.map((v, i) => ({ value: v, id: i }))}>
                          <Line type="monotone" dataKey="value" stroke="#2DD4BF" strokeWidth={1.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* KPI 2: Recovery Rate */}
                  <div className="bg-surface border border-border p-4 rounded flex flex-col justify-between relative overflow-hidden">
                    <div>
                      <div className="flex justify-between items-center text-textMuted text-[10px] uppercase tracking-wider font-semibold">
                        <span>Recovery Rate</span>
                        <Percent size={14} className="text-accent" />
                      </div>
                      <div className="text-xl font-bold mt-1 text-textPrimary">
                        {((kpis?.recoveryRate || 0) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="h-10 mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={kpis?.recoveryRateTrend?.map((v, i) => ({ value: v, id: i }))}>
                          <Line type="monotone" dataKey="value" stroke="#2DD4BF" strokeWidth={1.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* KPI 3: Carts Recovered */}
                  <div className="bg-surface border border-border p-4 rounded flex flex-col justify-between relative overflow-hidden">
                    <div>
                      <div className="flex justify-between items-center text-textMuted text-[10px] uppercase tracking-wider font-semibold">
                        <span>Carts Recovered</span>
                        <ShoppingCart size={14} className="text-accent" />
                      </div>
                      <div className="text-xl font-bold mt-1 text-textPrimary">
                        {kpis?.cartsRecovered}
                      </div>
                    </div>
                    <div className="h-10 mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={kpis?.cartsRecoveredTrend?.map((v, i) => ({ value: v, id: i }))}>
                          <Line type="monotone" dataKey="value" stroke="#2DD4BF" strokeWidth={1.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* KPI 4: Margin Protected */}
                  <div className="bg-surface border border-border p-4 rounded flex flex-col justify-between relative overflow-hidden">
                    <div>
                      <div className="flex justify-between items-center text-textMuted text-[10px] uppercase tracking-wider font-semibold">
                        <span>Margin Protected</span>
                        <ShieldCheck size={14} className="text-accent" />
                      </div>
                      <div className="text-xl font-bold mt-1 text-textPrimary">
                        ₹{kpis?.marginProtected?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="h-10 mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={kpis?.marginProtectedTrend?.map((v, i) => ({ value: v, id: i }))}>
                          <Line type="monotone" dataKey="value" stroke="#2DD4BF" strokeWidth={1.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Core Charts and Simulator Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 3. Grouped Bar Chart */}
                <div className="lg:col-span-2 bg-surface border border-border rounded p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-textPrimary mb-4">
                      Attempts vs Converted per Strategy
                    </h3>
                    <div className="h-72 w-full">
                      {isChartLoading ? (
                        <div className="h-full w-full bg-border/20 rounded animate-pulse" />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <XAxis
                              dataKey="strategy"
                              stroke="#6B7280"
                              fontSize={10}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              stroke="#6B7280"
                              fontSize={10}
                              tickLine={false}
                              axisLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#0E1318",
                                borderColor: "#1C232B",
                                borderRadius: "4px",
                                color: "#F3F4F6",
                                fontSize: "11px",
                              }}
                              itemStyle={{ color: "#2DD4BF" }}
                            />
                            <Legend
                              verticalAlign="top"
                              height={36}
                              iconType="rect"
                              iconSize={10}
                              wrapperStyle={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px" }}
                            />
                            <Bar dataKey="attempts" name="Attempts Initiated" radius={[2, 2, 0, 0]}>
                              {chartData?.map((entry: any, index: number) => (
                                <Cell
                                  key={`cell-attempts-${index}`}
                                  fill={STRATEGY_ATTEMPTS_COLORS[entry.strategy] || "rgba(45, 212, 191, 0.2)"}
                                  stroke={STRATEGY_CONVERTED_COLORS[entry.strategy] || "#2DD4BF"}
                                  strokeWidth={1}
                                  strokeDasharray="3 3"
                                />
                              ))}
                            </Bar>
                            <Bar dataKey="converted" name="Converted Revenue" radius={[2, 2, 0, 0]}>
                              {chartData?.map((entry: any, index: number) => (
                                <Cell
                                  key={`cell-converted-${index}`}
                                  fill={STRATEGY_CONVERTED_COLORS[entry.strategy] || "#2DD4BF"}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>

                {/* 7. Simulator Panel */}
                <div className="bg-surface border border-border rounded p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-textPrimary flex items-center gap-2">
                        <Zap size={14} className="text-accent" />
                        Agent Simulator
                      </h3>
                      <button
                        onClick={() => setIsAutoSimulating(!isAutoSimulating)}
                        type="button"
                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border transition-all ${
                          isAutoSimulating
                            ? "bg-accent/15 text-accent border-accent/30 animate-pulse"
                            : "bg-border/30 text-textMuted border-border hover:text-textSecondary"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isAutoSimulating ? "bg-accent" : "bg-textMuted"}`} />
                        {isAutoSimulating ? "Auto-Pilot: ON" : "Auto-Pilot: OFF"}
                      </button>
                    </div>
                    <form onSubmit={handleSimulate} className="space-y-4 text-xs">
                      <div>
                        <label className="block text-textMuted font-medium mb-1 font-mono uppercase tracking-wider text-[9px]">
                          Customer Email
                        </label>
                        <div className="relative">
                          <Mail size={12} className="absolute left-2.5 top-2.5 text-textMuted" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isAutoSimulating}
                            className="w-full bg-background border border-border rounded pl-8 pr-3 py-2 text-textPrimary focus:outline-none focus:border-accent text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-textMuted font-medium mb-1 font-mono uppercase tracking-wider text-[9px]">
                            Cart Value (₹)
                          </label>
                          <div className="relative">
                            <IndianRupee size={12} className="absolute left-2.5 top-2.5 text-textMuted" />
                            <input
                              type="number"
                              value={cartValue}
                              onChange={(e) => setCartValue(e.target.value)}
                              required
                              disabled={isAutoSimulating}
                              className="w-full bg-background border border-border rounded pl-8 pr-3 py-2 text-textPrimary focus:outline-none focus:border-accent text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-textMuted font-medium mb-1 font-mono uppercase tracking-wider text-[9px]">
                            Customer Tier
                          </label>
                          <div className="relative">
                            <User size={12} className="absolute left-2.5 top-2.5 text-textMuted" />
                            <select
                              value={customerType}
                              onChange={(e) => setCustomerType(e.target.value)}
                              disabled={isAutoSimulating}
                              className="w-full bg-background border border-border rounded pl-8 pr-2 py-2 text-textPrimary focus:outline-none focus:border-accent text-xs appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option>Bronze</option>
                              <option>Silver</option>
                              <option>Gold</option>
                              <option>VIP</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-textMuted font-medium mb-1 font-mono uppercase tracking-wider text-[9px]">
                          Product Name
                        </label>
                        <div className="relative">
                          <Package size={12} className="absolute left-2.5 top-2.5 text-textMuted" />
                          <input
                            type="text"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            required
                            disabled={isAutoSimulating}
                            className="w-full bg-background border border-border rounded pl-8 pr-3 py-2 text-textPrimary focus:outline-none focus:border-accent text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={simulatorMutation.isPending || isAutoSimulating}
                        className="w-full bg-accent hover:bg-accent/80 text-background font-bold uppercase tracking-wider py-2.5 px-4 rounded transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAutoSimulating ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-background animate-ping" />
                            <span>Auto-Pilot Simulating...</span>
                          </>
                        ) : (
                          <>
                            <Play size={12} fill="currentColor" />
                            {simulatorMutation.isPending ? "Evaluating..." : "Run AI Simulation"}
                          </>
                        )}
                      </button>
                    </form>

                    {/* Simulation Results Display */}
                    {simulatorMutation.data && (
                      <div className="mt-4 pt-4 border-t border-border space-y-3 font-mono">
                        <div className="flex justify-between items-center text-[10px] text-textSecondary">
                          <span>Decision</span>
                          <span className="px-1.5 py-0.5 bg-accent-dim text-accent rounded uppercase text-[9px]">
                            {simulatorMutation.data.strategy}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-textSecondary">
                          <span>Confidence Score</span>
                          <span className="text-accent font-semibold">
                            {(simulatorMutation.data.confidenceScore * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="text-[10px] space-y-1">
                          <span className="text-textMuted block uppercase text-[8px] tracking-wider">
                            Decision Reasoning
                          </span>
                          <p className="bg-background border border-border rounded p-2 text-textSecondary text-[10px] leading-relaxed">
                            {simulatorMutation.data.reasoning}
                          </p>
                        </div>
                        <div className="text-[10px] space-y-1">
                          <span className="text-textMuted block uppercase text-[8px] tracking-wider">
                            Generated Recovery Email
                          </span>
                          <p className="bg-background border border-border rounded p-2 text-textSecondary text-[10px] italic leading-relaxed">
                            "{simulatorMutation.data.emailCopy}"
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Live Logs and Strategy Table Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 4. Live Agent Reasoning Log Feed */}
                <div className="bg-surface border border-border rounded p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-textPrimary">
                      Live Agent Reasoning Feed
                    </h3>
                    <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                  </div>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {isLogsLoading ? (
                      <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-16 bg-border/20 rounded animate-pulse" />
                        ))}
                      </div>
                    ) : logs && logs.length > 0 ? (
                      logs.map((log) => (
                        <div
                          key={log.id}
                          className="bg-background border border-border p-3 rounded font-mono text-[10px] space-y-1.5"
                        >
                          <div className="flex justify-between text-textMuted text-[9px]">
                            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <span>{log.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-1 bg-border rounded text-textSecondary font-semibold">
                              {log.strategy}
                            </span>
                            <span className="text-accent">{log.decision}</span>
                          </div>
                          <p className="text-textSecondary leading-relaxed border-l border-accent/30 pl-2">
                            {log.reasoning}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-textMuted text-xs">
                        No logs recorded yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Strategy Performance Table */}
                <div className="bg-surface border border-border rounded p-6 flex flex-col">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-textPrimary mb-4">
                    Strategy Performance Analysis
                  </h3>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border text-textMuted font-mono uppercase text-[9px] tracking-wider">
                          <th className="py-2.5">Strategy</th>
                          <th className="py-2.5">Attempts</th>
                          <th className="py-2.5">Success Rate</th>
                          <th className="py-2.5">Recovered</th>
                          <th className="py-2.5">Margin Impact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {isStrategiesLoading ? (
                          [...Array(4)].map((_, i) => (
                            <tr key={i} className="animate-pulse">
                              <td colSpan={5} className="py-3 h-8 bg-border/10" />
                            </tr>
                          ))
                        ) : (
                          strategies?.map((strat) => (
                            <tr key={strat.name} className="hover:bg-border/10">
                              <td className="py-3 font-semibold text-textPrimary">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-2.5 h-2.5 rounded-sm inline-block shrink-0"
                                    style={{ backgroundColor: getStrategyColor(strat.name) }}
                                  />
                                  <span>{strat.name}</span>
                                </div>
                              </td>
                              <td className="py-3 font-mono text-textSecondary">
                                {strat.attempts}
                              </td>
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-border h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${strat.successRate * 100}%`,
                                        backgroundColor: getStrategyColor(strat.name)
                                      }}
                                    />
                                  </div>
                                  <span className="font-mono text-textSecondary">
                                    {(strat.successRate * 100).toFixed(0)}%
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 font-mono text-textPrimary">
                                ₹{strat.revenueRecovered?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                              </td>
                              <td className="py-3 font-mono text-textSecondary">
                                {(strat.marginImpact * 100).toFixed(0)}%
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards View */}
                  <div className="block lg:hidden space-y-3">
                    {isStrategiesLoading ? (
                      [...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 bg-border/10 rounded animate-pulse" />
                      ))
                    ) : (
                      strategies?.map((strat) => (
                        <div key={strat.name} className="bg-surface/40 border border-border/60 rounded p-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-sm inline-block shrink-0"
                                style={{ backgroundColor: getStrategyColor(strat.name) }}
                              />
                              <span className="font-semibold text-textPrimary text-xs">{strat.name}</span>
                            </div>
                            <span className="text-[10px] text-textMuted font-mono">
                              {strat.attempts} Attempts
                            </span>
                          </div>
                          <div className="flex items-center gap-2 pt-1 border-t border-border/20">
                            <span className="text-[10px] text-textSecondary font-mono shrink-0">Success:</span>
                            <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${strat.successRate * 100}%`,
                                  backgroundColor: getStrategyColor(strat.name)
                                }}
                              />
                            </div>
                            <span className="font-mono text-textPrimary text-xs shrink-0">
                              {(strat.successRate * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px] font-mono pt-1">
                            <span className="text-textSecondary">Recovered: <span className="text-textPrimary font-semibold">₹{strat.revenueRecovered?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span></span>
                            <span className="text-textSecondary">Margin: <span className="text-textPrimary font-semibold">{(strat.marginImpact * 100).toFixed(0)}%</span></span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* 6. Recent Interventions Table */}
              <div className="bg-surface border border-border rounded p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-textPrimary mb-4">
                  Recent Recovery Interventions
                </h3>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border text-textMuted font-mono uppercase text-[9px] tracking-wider">
                        <th className="py-2.5">Email</th>
                        <th className="py-2.5">Cart Value</th>
                        <th className="py-2.5">Customer Tier</th>
                        <th className="py-2.5">Friction Point</th>
                        <th className="py-2.5">Chosen Strategy</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {isInterventionsLoading ? (
                        [...Array(5)].map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td colSpan={7} className="py-3 h-8 bg-border/10" />
                          </tr>
                        ))
                      ) : interventions && interventions.length > 0 ? (
                        interventions.map((item) => (
                          <tr key={item.id} className="hover:bg-border/20 transition-all">
                            <td className="py-3 text-textPrimary font-mono">{item.email}</td>
                            <td className="py-3 font-mono text-textPrimary">
                              ₹{item.cartValue?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                                item.tier === "VIP" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                item.tier === "Gold" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                                item.tier === "Silver" ? "bg-slate-400/10 text-slate-300 border border-slate-400/20" :
                                "bg-zinc-600/10 text-zinc-400 border border-zinc-600/20"
                              }`}>
                                {item.tier}
                              </span>
                            </td>
                            <td className="py-3 text-textSecondary">{item.frictionPoint}</td>
                            <td className="py-3">
                              <span className="px-1.5 py-0.5 bg-border text-textPrimary rounded font-mono text-[10px]">
                                {item.strategy}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                item.status === "Converted" ? "bg-accent/10 text-accent border border-accent/20" :
                                item.status === "Failed" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                item.status === "Sent" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                                "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="py-3 font-mono text-textMuted">
                              {new Date(item.timestamp).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-4 text-center text-textMuted font-mono">
                            No interventions found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="block lg:hidden space-y-3">
                  {isInterventionsLoading ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="h-24 bg-border/10 rounded animate-pulse" />
                    ))
                  ) : interventions && interventions.length > 0 ? (
                    interventions.map((item) => (
                      <div key={item.id} className="bg-surface/40 border border-border/60 rounded p-4 space-y-2 text-xs">
                        <div className="flex justify-between items-start">
                          <span className="text-textPrimary font-mono break-all max-w-[70%]">
                            {item.email}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold shrink-0 ${
                            item.status === "Converted" ? "bg-accent/10 text-accent border border-accent/20" :
                            item.status === "Failed" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                            item.status === "Sent" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                            "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-[11px] text-textSecondary font-mono">
                          <span>Cart: <span className="text-textPrimary font-semibold">₹{item.cartValue?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
                          <span className="flex items-center gap-1">Tier: 
                            <span className={`px-1 rounded text-[9px] font-mono ${
                              item.tier === "VIP" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                              item.tier === "Gold" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                              item.tier === "Silver" ? "bg-slate-400/10 text-slate-300 border border-slate-400/20" :
                              "bg-zinc-600/10 text-zinc-400 border border-zinc-600/20"
                            }`}>
                              {item.tier}
                            </span>
                          </span>
                        </div>

                        <div className="text-[11px] text-textSecondary flex flex-wrap gap-2 pt-1.5 border-t border-border/20">
                          <span className="font-mono bg-border/60 text-textPrimary px-1.5 py-0.5 rounded text-[9px]">
                            {item.strategy}
                          </span>
                          <span className="text-[10px] text-textMuted bg-border/30 px-1.5 py-0.5 rounded">
                            {item.frictionPoint}
                          </span>
                        </div>

                        <div className="text-[9px] text-textMuted text-right font-mono">
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-textMuted font-mono py-4">
                      No interventions found.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === "interventions" && (
            <div className="bg-surface border border-border rounded p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-textPrimary mb-4">
                Recovery Attempts Audit Log
              </h3>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border text-textMuted font-mono uppercase text-[9px] tracking-wider">
                      <th className="py-2.5">Email</th>
                      <th className="py-2.5">Cart Value</th>
                      <th className="py-2.5">Customer Tier</th>
                      <th className="py-2.5">Friction Point</th>
                      <th className="py-2.5">Strategy</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {interventions?.map((item) => (
                      <tr key={item.id} className="hover:bg-border/20 transition-all">
                        <td className="py-3 text-textPrimary font-mono">{item.email}</td>
                        <td className="py-3 font-mono text-textPrimary">
                          ₹{item.cartValue?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                            item.tier === "VIP" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                            item.tier === "Gold" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                            item.tier === "Silver" ? "bg-slate-400/10 text-slate-300 border border-slate-400/20" :
                            "bg-zinc-600/10 text-zinc-400 border border-zinc-600/20"
                          }`}>
                            {item.tier}
                          </span>
                        </td>
                        <td className="py-3 text-textSecondary">{item.frictionPoint}</td>
                        <td className="py-3">
                          <span className="px-1.5 py-0.5 bg-border text-textPrimary rounded font-mono text-[10px]">
                            {item.strategy}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            item.status === "Converted" ? "bg-accent/10 text-accent border border-accent/20" :
                            item.status === "Failed" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                            item.status === "Sent" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                            "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-textMuted">
                          {new Date(item.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="block lg:hidden space-y-3">
                {interventions?.map((item) => (
                  <div key={item.id} className="bg-surface/40 border border-border/60 rounded p-4 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="text-textPrimary font-mono break-all max-w-[70%]">
                        {item.email}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold shrink-0 ${
                        item.status === "Converted" ? "bg-accent/10 text-accent border border-accent/20" :
                        item.status === "Failed" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                        item.status === "Sent" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                        "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-[11px] text-textSecondary font-mono">
                      <span>Cart: <span className="text-textPrimary font-semibold">₹{item.cartValue?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
                      <span className="flex items-center gap-1">Tier: 
                        <span className={`px-1 rounded text-[9px] font-mono ${
                          item.tier === "VIP" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                          item.tier === "Gold" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                          item.tier === "Silver" ? "bg-slate-400/10 text-slate-300 border border-slate-400/20" :
                          "bg-zinc-600/10 text-zinc-400 border border-zinc-600/20"
                        }`}>
                          {item.tier}
                        </span>
                      </span>
                    </div>

                    <div className="text-[11px] text-textSecondary flex flex-wrap gap-2 pt-1.5 border-t border-border/20">
                      <span className="font-mono bg-border/60 text-textPrimary px-1.5 py-0.5 rounded text-[9px]">
                        {item.strategy}
                      </span>
                      <span className="text-[10px] text-textMuted bg-border/30 px-1.5 py-0.5 rounded">
                        {item.frictionPoint}
                      </span>
                    </div>

                    <div className="text-[9px] text-textMuted text-right font-mono">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-textPrimary">
                Complete AI Decision History
              </h3>
              <div className="space-y-3">
                {logs?.map((log) => (
                  <div
                    key={log.id}
                    className="bg-surface border border-border p-4 rounded font-mono text-xs space-y-2"
                  >
                    <div className="flex justify-between text-textMuted text-[10px]">
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                      <span>Target: {log.email} | Cart Value: ₹{log.cartValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-accent-dim text-accent rounded font-semibold text-[10px]">
                        {log.strategy}
                      </span>
                      <span className="text-textPrimary font-semibold">{log.decision}</span>
                    </div>
                    <div className="bg-background border border-border/80 rounded p-3 text-textSecondary text-[11px] leading-relaxed">
                      {log.reasoning}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
