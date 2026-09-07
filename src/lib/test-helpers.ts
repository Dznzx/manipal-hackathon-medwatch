import { Facility, Medicine, StockRecord, ConsumptionDay, Forecast } from "./types";

// Shared fixtures for the core-engine test suite. Kept deliberately minimal
// and independent of the real generator.ts data, so these tests exercise the
// forecast/clustering/redistribution logic directly rather than the specific
// Udupi district dataset.

export function makeFacility(overrides: Partial<Facility> = {}): Facility {
  return {
    id: "f1",
    name: "Test PHC",
    type: "PHC",
    lat: 13.3,
    lng: 74.75,
    clusterId: "cluster-a",
    clusterName: "Cluster A",
    ...overrides,
  };
}

export function makeMedicine(overrides: Partial<Medicine> = {}): Medicine {
  return { id: "med1", name: "Test Medicine", unit: "units", criticality: "high", ...overrides };
}

function history(units: number[]): ConsumptionDay[] {
  return units.map((u, i) => ({ day: i, units: u }));
}

export function makeStockRecord(overrides: Partial<StockRecord> = {}): StockRecord {
  return {
    facilityId: "f1",
    medicineId: "med1",
    currentStock: 100,
    history: history(Array(21).fill(5)),
    replenishmentLeadTimeDays: 7,
    pendingReplenishment: null,
    reorderLevel: 30,
    ...overrides,
  };
}

export function makeForecast(overrides: Partial<Forecast> = {}): Forecast {
  return {
    facilityId: "f1",
    medicineId: "med1",
    currentStock: 100,
    avgDailyConsumption: 5,
    consumptionStdDev: 1,
    daysToStockout: 20,
    projectedStockoutDay: 20,
    confidence: 0.8,
    confidenceReasoning: "test reasoning",
    status: "healthy",
    trend: "stable",
    ...overrides,
  };
}

export { history };
