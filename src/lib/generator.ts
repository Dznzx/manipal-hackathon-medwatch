import { Facility, Medicine, StockRecord, WorldState, ConsumptionDay } from "./types";
import { mulberry32, gaussian, randRange, randInt, RandFn } from "./rng";

export const HISTORY_DAYS = 21;
export const DEFAULT_SEED = 2024;

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
  lat: number;
  lng: number;
  clusterId: string;
  clusterName: string;
}

// Real government health facilities in Udupi district, Karnataka — names and
// GPS coordinates sourced from OpenStreetMap (queried via the public Overpass
// API), grouped by their real taluk (sub-district). Facility *identities and
// locations* are real; stock levels and consumption below are simulated, since
// granular per-facility inventory data isn't publicly available anywhere —
// exactly the kind of data the problem statement explicitly allows simulating.
export const FACILITIES: FacilityDef[] = [
  // Kundapura taluk -- this is where the "regional shortage" narrative lives
  { id: "u1", name: "Kundapur Government Hospital", type: "CHC", lat: 13.629259, lng: 74.691012, clusterId: "kundapura", clusterName: "Kundapura Taluk" },
  { id: "u2", name: "PHC Hattiangadi", type: "PHC", lat: 13.6579769, lng: 74.7257812, clusterId: "kundapura", clusterName: "Kundapura Taluk" },
  { id: "u3", name: "Government Hospital, Basroor", type: "PHC", lat: 13.631449, lng: 74.739063, clusterId: "kundapura", clusterName: "Kundapura Taluk" },
  { id: "u4", name: "Government Hospital, Halady", type: "PHC", lat: 13.5786896, lng: 74.8643722, clusterId: "kundapura", clusterName: "Kundapura Taluk" },

  // Udupi taluk -- one isolated stockout here, should NOT be flagged regional
  { id: "u5", name: "District Hospital, Udupi", type: "District Hospital", lat: 13.3340175, lng: 74.7423038, clusterId: "udupi", clusterName: "Udupi Taluk" },
  { id: "u6", name: "Government Hospital, Mandarthi", type: "PHC", lat: 13.495691, lng: 74.810086, clusterId: "udupi", clusterName: "Udupi Taluk" },
  { id: "u7", name: "Government Hospital, Pethri", type: "PHC", lat: 13.4217895, lng: 74.8243893, clusterId: "udupi", clusterName: "Udupi Taluk" },
  { id: "u8", name: "Govt. Hospital, Hebri", type: "CHC", lat: 13.4573188, lng: 74.9917263, clusterId: "udupi", clusterName: "Udupi Taluk" },

  // Karkala taluk -- mostly healthy, holds surplus for redistribution
  { id: "u9", name: "Karkala Government Hospital", type: "CHC", lat: 13.2111087, lng: 75.0008586, clusterId: "karkala", clusterName: "Karkala Taluk" },
  { id: "u10", name: "CHC Mudbidri", type: "CHC", lat: 13.0662337, lng: 74.9956362, clusterId: "karkala", clusterName: "Karkala Taluk" },
  { id: "u11", name: "Government Hospital, Nitte", type: "PHC", lat: 13.186855, lng: 74.938596, clusterId: "karkala", clusterName: "Karkala Taluk" },
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
  // --- Kundapura taluk: Amoxicillin declining at 3 of 4 facilities => regional risk ---
  { facilityId: "u1", medicineId: "amox", scenario: "regional-decline", startStock: 140, baseConsumption: 9.5, noiseStdDev: 1.8, leadTime: 7, reorderLevel: 60 },
  { facilityId: "u2", medicineId: "amox", scenario: "regional-decline", startStock: 110, baseConsumption: 9.6, noiseStdDev: 1.5, leadTime: 6, reorderLevel: 50 },
  { facilityId: "u3", medicineId: "amox", scenario: "regional-decline", startStock: 200, baseConsumption: 14, noiseStdDev: 2.2, leadTime: 8, reorderLevel: 80 },
  { facilityId: "u4", medicineId: "amox", scenario: "surplus", startStock: 260, baseConsumption: 4, noiseStdDev: 0.8, leadTime: 5, reorderLevel: 60 },

  // --- Udupi taluk: Insulin isolated stockout at one facility only ---
  { facilityId: "u5", medicineId: "insu", scenario: "isolated-decline", startStock: 45, baseConsumption: 4.2, noiseStdDev: 0.6, leadTime: 10, reorderLevel: 20 },
  { facilityId: "u6", medicineId: "insu", scenario: "healthy", startStock: 90, baseConsumption: 2.5, noiseStdDev: 0.5, leadTime: 9, reorderLevel: 25 },
  { facilityId: "u7", medicineId: "insu", scenario: "healthy", startStock: 130, baseConsumption: 3, noiseStdDev: 0.5, leadTime: 8, reorderLevel: 30 },

  // --- Karkala taluk: surplus reservoir for redistribution demo ---
  { facilityId: "u9", medicineId: "amox", scenario: "surplus", startStock: 420, baseConsumption: 5, noiseStdDev: 1, leadTime: 5, reorderLevel: 100 },
  { facilityId: "u10", medicineId: "amox", scenario: "healthy", startStock: 150, baseConsumption: 6, noiseStdDev: 1.2, leadTime: 6, reorderLevel: 50 },
  { facilityId: "u10", medicineId: "insu", scenario: "surplus", startStock: 160, baseConsumption: 2, noiseStdDev: 0.4, leadTime: 7, reorderLevel: 30 },

  // --- A low-history / newly onboarded facility-medicine pair -> low confidence forecast ---
  { facilityId: "u11", medicineId: "para", scenario: "low-history", startStock: 80, baseConsumption: 6, noiseStdDev: 3.5, leadTime: 6, reorderLevel: 40 },
];

function genHistory(rand: RandFn, spec: ScenarioSpec): { history: ConsumptionDay[]; currentStock: number } {
  const days = spec.scenario === "low-history" ? 5 : HISTORY_DAYS;
  const history: ConsumptionDay[] = [];
  const trendSlope =
    spec.scenario === "regional-decline" ? 0.18 :
    spec.scenario === "isolated-decline" ? 0.15 :
    spec.scenario === "surplus" ? -0.05 :
    0.02;

  for (let d = 0; d < days; d++) {
    const trendFactor = 1 + trendSlope * (d / days);
    const units = Math.max(0, gaussian(rand, spec.baseConsumption * trendFactor, spec.noiseStdDev));
    history.push({ day: d, units: Math.round(units * 10) / 10 });
  }
  // startStock represents stock at the END of history (today).
  const stock = spec.startStock;

  return { history, currentStock: Math.round(stock) };
}

// Filler pairs deliberately vary in starting stock/consumption/lead-time/reorder
// point per facility. Without this variety they'd all cross their reorder
// threshold on nearly the same simulated day and falsely read as a "regional"
// pattern once the time-slider runs forward — a coincidence-of-timing artifact,
// not a real correlated-demand signal, which would undermine the demo's core claim.
function fillerSpec(rand: RandFn, facilityId: string, medicineId: string): ScenarioSpec {
  const baseConsumption = randRange(rand, 2, 5);
  const reorderLevel = randInt(rand, 20, 45);
  return {
    facilityId,
    medicineId,
    scenario: "healthy",
    startStock: reorderLevel * randRange(rand, 2.5, 4.5),
    baseConsumption,
    noiseStdDev: baseConsumption * 0.2,
    leadTime: randInt(rand, 4, 9),
    reorderLevel,
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
      const spec = specMap.get(key) ?? fillerSpec(rand, f.id, m.id);
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
