import { Facility, Medicine, StockRecord, WorldState, ConsumptionDay } from "./types";
import { mulberry32, gaussian, RandFn } from "./rng";

export const HISTORY_DAYS = 21;
export const DEFAULT_SEED = 42;

export const MEDICINES: Medicine[] = [
  { id: "amox", name: "Amoxicillin 500mg", unit: "strips", criticality: "high" },
  { id: "orsz", name: "ORS Sachets", unit: "sachets", criticality: "high" },
  { id: "para", name: "Paracetamol 500mg", unit: "strips", criticality: "medium" },
  { id: "insu", name: "Insulin (vials)", unit: "vials", criticality: "high" },
  { id: "iron", name: "Iron-Folic Acid Tablets", unit: "strips", criticality: "low" },
];

interface FacilityDef {
  id: string;
  name: string;
  type: Facility["type"];
  x: number;
  y: number;
  clusterId: string;
  clusterName: string;
}

// Coordinates are on a synthetic 0-100 plane (roughly km-equivalent) so distance
// math is simple, but the layout is composed to read as 3 real geographic clusters.
export const FACILITIES: FacilityDef[] = [
  // North Region cluster -- this is where the "regional shortage" narrative lives
  { id: "f1", name: "Udupi PHC", type: "PHC", x: 20, y: 78, clusterId: "north", clusterName: "North Region" },
  { id: "f2", name: "Kaup CHC", type: "CHC", x: 27, y: 82, clusterId: "north", clusterName: "North Region" },
  { id: "f3", name: "Brahmavar District Hospital", type: "District Hospital", x: 24, y: 70, clusterId: "north", clusterName: "North Region" },
  { id: "f4", name: "Kundapura PHC", type: "PHC", x: 15, y: 88, clusterId: "north", clusterName: "North Region" },

  // East Region cluster -- one isolated stockout here, should NOT be flagged regional
  { id: "f5", name: "Karkala CHC", type: "CHC", x: 62, y: 40, clusterId: "east", clusterName: "East Region" },
  { id: "f6", name: "Hebri PHC", type: "PHC", x: 70, y: 35, clusterId: "east", clusterName: "East Region" },
  { id: "f7", name: "Shivamogga District Hospital", type: "District Hospital", x: 68, y: 48, clusterId: "east", clusterName: "East Region" },

  // South Region cluster -- mostly healthy, holds surplus for redistribution
  { id: "f8", name: "Mangalore District Hospital", type: "District Hospital", x: 45, y: 15, clusterId: "south", clusterName: "South Region" },
  { id: "f9", name: "Bantwal PHC", type: "PHC", x: 52, y: 22, clusterId: "south", clusterName: "South Region" },
  { id: "f10", name: "Puttur CHC", type: "CHC", x: 40, y: 25, clusterId: "south", clusterName: "South Region" },
  { id: "f11", name: "Moodbidri PHC", type: "PHC", x: 48, y: 10, clusterId: "south", clusterName: "South Region" },
];

export function buildFacilities(): Facility[] {
  return FACILITIES.map((f) => ({ ...f }));
}

type Scenario =
  | "regional-decline" // trending to stockout, part of a cluster pattern
  | "isolated-decline" // trending to stockout, alone in its cluster
  | "surplus" // high stock, low consumption -> redistribution source
  | "healthy" // stable, adequate stock
  | "low-history"; // few reliable data points -> low confidence forecast

interface ScenarioSpec {
  facilityId: string;
  medicineId: string;
  scenario: Scenario;
  startStock: number;
  baseConsumption: number;
  noiseStdDev: number;
  leadTime: number;
  reorderLevel: number;
  pending?: { quantity: number; etaDay: number };
}

// Hand-authored scenarios carry the demo narrative reliably; every facility/medicine
// pair not listed here gets a generic "healthy" filler so the dataset feels complete.
const SCENARIOS: ScenarioSpec[] = [
  // --- North Region: Amoxicillin declining at 3 of 4 facilities => regional risk ---
  { facilityId: "f1", medicineId: "amox", scenario: "regional-decline", startStock: 140, baseConsumption: 9, noiseStdDev: 1.8, leadTime: 7, reorderLevel: 60 },
  { facilityId: "f2", medicineId: "amox", scenario: "regional-decline", startStock: 110, baseConsumption: 8, noiseStdDev: 1.5, leadTime: 6, reorderLevel: 50 },
  { facilityId: "f3", medicineId: "amox", scenario: "regional-decline", startStock: 200, baseConsumption: 11, noiseStdDev: 2.2, leadTime: 8, reorderLevel: 80, pending: { quantity: 40, etaDay: 9 } },
  { facilityId: "f4", medicineId: "amox", scenario: "surplus", startStock: 260, baseConsumption: 4, noiseStdDev: 0.8, leadTime: 5, reorderLevel: 60 },

  // --- East Region: Insulin isolated stockout at one facility only ---
  { facilityId: "f5", medicineId: "insu", scenario: "isolated-decline", startStock: 45, baseConsumption: 4.2, noiseStdDev: 0.6, leadTime: 10, reorderLevel: 20 },
  { facilityId: "f6", medicineId: "insu", scenario: "healthy", startStock: 90, baseConsumption: 2.5, noiseStdDev: 0.5, leadTime: 9, reorderLevel: 25 },
  { facilityId: "f7", medicineId: "insu", scenario: "healthy", startStock: 130, baseConsumption: 3, noiseStdDev: 0.5, leadTime: 8, reorderLevel: 30 },

  // --- South Region: surplus reservoir for redistribution demo ---
  { facilityId: "f8", medicineId: "amox", scenario: "surplus", startStock: 420, baseConsumption: 5, noiseStdDev: 1, leadTime: 5, reorderLevel: 100 },
  { facilityId: "f9", medicineId: "amox", scenario: "healthy", startStock: 150, baseConsumption: 6, noiseStdDev: 1.2, leadTime: 6, reorderLevel: 50 },
  { facilityId: "f10", medicineId: "insu", scenario: "surplus", startStock: 160, baseConsumption: 2, noiseStdDev: 0.4, leadTime: 7, reorderLevel: 30 },

  // --- A low-history / newly onboarded facility-medicine pair -> low confidence forecast ---
  { facilityId: "f11", medicineId: "para", scenario: "low-history", startStock: 80, baseConsumption: 6, noiseStdDev: 3.5, leadTime: 6, reorderLevel: 40 },
];

function genHistory(rand: RandFn, spec: ScenarioSpec): { history: ConsumptionDay[]; currentStock: number } {
  const days = spec.scenario === "low-history" ? 5 : HISTORY_DAYS;
  const history: ConsumptionDay[] = [];
  let stock = spec.startStock;
  const trendSlope =
    spec.scenario === "regional-decline" ? 0.18 :
    spec.scenario === "isolated-decline" ? 0.15 :
    spec.scenario === "surplus" ? -0.05 :
    0.02;

  // Walk forward through history so currentStock ends up consistent with consumption.
  const consumptions: number[] = [];
  for (let d = 0; d < days; d++) {
    const trendFactor = 1 + trendSlope * (d / days);
    const units = Math.max(0, gaussian(rand, spec.baseConsumption * trendFactor, spec.noiseStdDev));
    consumptions.push(units);
  }
  const totalConsumed = consumptions.reduce((a, b) => a + b, 0);
  stock = spec.startStock; // startStock represents stock at the END of history (today)
  // Reconstruct stock-at-day-0 by adding back consumption, then walk forward to build the log
  let runningStock = stock + totalConsumed;
  for (let d = 0; d < days; d++) {
    runningStock -= consumptions[d];
    history.push({ day: d, units: Math.round(consumptions[d] * 10) / 10 });
  }

  return { history, currentStock: Math.round(stock) };
}

function fillerSpec(facilityId: string, medicineId: string): ScenarioSpec {
  return {
    facilityId,
    medicineId,
    scenario: "healthy",
    startStock: 100,
    baseConsumption: 3,
    noiseStdDev: 0.7,
    leadTime: 6,
    reorderLevel: 30,
  };
}

export function generateWorld(seed: number = DEFAULT_SEED): WorldState {
  const rand = mulberry32(seed);
  const facilities = buildFacilities();
  const stock: StockRecord[] = [];

  const specMap = new Map<string, ScenarioSpec>();
  for (const s of SCENARIOS) specMap.set(`${s.facilityId}:${s.medicineId}`, s);

  for (const f of facilities) {
    for (const m of MEDICINES) {
      const key = `${f.id}:${m.id}`;
      const spec = specMap.get(key) ?? fillerSpec(f.id, m.id);
      const { history, currentStock } = genHistory(rand, spec);
      stock.push({
        facilityId: f.id,
        medicineId: m.id,
        currentStock,
        history,
        replenishmentLeadTimeDays: spec.leadTime,
        pendingReplenishment: spec.pending ? { ...spec.pending } : null,
        reorderLevel: spec.reorderLevel,
      });
    }
  }

  return { facilities, medicines: MEDICINES, stock, simDay: 0, seed };
}
