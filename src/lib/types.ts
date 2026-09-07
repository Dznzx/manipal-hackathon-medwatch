// Core domain types for the shortage-detection prototype.
// Everything derived (forecasts, risk, suggestions) is computed on demand from
// this base state so the UI can re-run the pipeline whenever params change.

export type FacilityType = "PHC" | "CHC" | "District Hospital";

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  x: number; // synthetic coordinate, 0-100 grid (used as km-equivalent plane)
  y: number;
  clusterId: string; // geographic region grouping
  clusterName: string;
}

export interface Medicine {
  id: string;
  name: string;
  unit: string;
  criticality: "high" | "medium" | "low";
}

export interface ConsumptionDay {
  day: number; // 0 = oldest, N = most recent
  units: number;
}

export interface PendingReplenishment {
  quantity: number;
  etaDay: number; // days from "today" (0 = today, negative = overdue)
}

export interface StockRecord {
  facilityId: string;
  medicineId: string;
  currentStock: number;
  history: ConsumptionDay[]; // daily consumption, last HISTORY_DAYS days
  replenishmentLeadTimeDays: number;
  pendingReplenishment: PendingReplenishment | null;
  reorderLevel: number;
}

export interface WorldState {
  facilities: Facility[];
  medicines: Medicine[];
  stock: StockRecord[];
  simDay: number; // current simulated "today", advances with time-slider
  seed: number;
}

export interface Forecast {
  facilityId: string;
  medicineId: string;
  currentStock: number;
  avgDailyConsumption: number;
  consumptionStdDev: number;
  daysToStockout: number | null; // null = not depleting (consumption ~0)
  projectedStockoutDay: number | null; // simDay + daysToStockout
  confidence: number; // 0-1
  confidenceReasoning: string;
  status: "critical" | "at-risk" | "watch" | "healthy";
  trend: "worsening" | "stable" | "improving";
}

export type RiskLevel = "isolated" | "watch" | "regional";

export interface RegionalRisk {
  clusterId: string;
  clusterName: string;
  medicineId: string;
  medicineName: string;
  facilitiesAtRisk: { facilityId: string; facilityName: string; daysToStockout: number | null }[];
  riskLevel: RiskLevel;
  reasoning: string[];
  score: number; // 0-100 driving factor for sorting
}

export interface RedistributionSuggestion {
  id: string;
  medicineId: string;
  medicineName: string;
  fromFacilityId: string;
  fromFacilityName: string;
  toFacilityId: string;
  toFacilityName: string;
  suggestedQuantity: number;
  distance: number;
  urgencyScore: number; // 0-100
  reasoning: string[];
  withoutTransferDays: number | null; // recipient's current projected days-to-stockout
  withTransferDays: number | null; // projected days-to-stockout after this transfer
  extraDaysGained: number;
}

export interface SimParams {
  consumptionSpikeMultiplier: number; // 1 = normal
  replenishmentDelayDays: number; // extra delay added to all pending replenishments
}
