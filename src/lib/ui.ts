import { Forecast, RiskLevel } from "./types";

export const STATUS_COLORS: Record<Forecast["status"], { bg: string; text: string; dot: string; ring: string }> = {
  critical: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-500", ring: "ring-red-500/30" },
  "at-risk": { bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-500", ring: "ring-orange-500/30" },
  watch: { bg: "bg-amber-400/10", text: "text-amber-300", dot: "bg-amber-400", ring: "ring-amber-400/30" },
  healthy: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-500", ring: "ring-emerald-500/30" },
};

export const STATUS_LABEL: Record<Forecast["status"], string> = {
  critical: "Critical",
  "at-risk": "At Risk",
  watch: "Watch",
  healthy: "Healthy",
};

export const RISK_LEVEL_COLORS: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  regional: { bg: "bg-red-500/10", text: "text-red-300", border: "border-red-500/40" },
  watch: { bg: "bg-amber-400/10", text: "text-amber-300", border: "border-amber-400/40" },
  isolated: { bg: "bg-slate-500/10", text: "text-slate-300", border: "border-slate-500/30" },
};

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  regional: "Regional Risk",
  watch: "Emerging Pattern",
  isolated: "Isolated Event",
};

export function confidenceLabel(confidence: number): string {
  if (confidence >= 0.7) return "High confidence";
  if (confidence >= 0.45) return "Moderate confidence";
  return "Low confidence";
}
