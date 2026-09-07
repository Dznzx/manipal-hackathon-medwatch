import { describe, it, expect } from "vitest";
import { computeRedistributionSuggestions } from "./redistribution";
import { makeFacility, makeForecast, makeMedicine, makeStockRecord } from "./test-helpers";
import { WorldState } from "./types";

const RECIPIENT = makeFacility({ id: "recipient", name: "At-Risk Facility", lat: 13.3, lng: 74.75 });
const DONOR = makeFacility({ id: "donor", name: "Surplus Facility", lat: 13.32, lng: 74.77 });
const MEDICINE = makeMedicine({ id: "med1", name: "Test Medicine", unit: "units" });

function baseWorld(): WorldState {
  return {
    facilities: [RECIPIENT, DONOR],
    medicines: [MEDICINE],
    stock: [
      makeStockRecord({ facilityId: "recipient", medicineId: "med1", currentStock: 20, reorderLevel: 20, replenishmentLeadTimeDays: 6 }),
      makeStockRecord({ facilityId: "donor", medicineId: "med1", currentStock: 300, reorderLevel: 50, replenishmentLeadTimeDays: 5 }),
    ],
    simDay: 0,
    seed: 1,
  };
}

describe("computeRedistributionSuggestions", () => {
  it("matches an at-risk recipient to a nearby facility with surplus", () => {
    const forecasts = [
      makeForecast({ facilityId: "recipient", medicineId: "med1", status: "at-risk", daysToStockout: 10, avgDailyConsumption: 5 }),
      makeForecast({ facilityId: "donor", medicineId: "med1", status: "healthy", daysToStockout: null, avgDailyConsumption: 2 }),
    ];

    const suggestions = computeRedistributionSuggestions(baseWorld(), forecasts);
    expect(suggestions).toHaveLength(1);

    const s = suggestions[0];
    expect(s.fromFacilityId).toBe("donor");
    expect(s.toFacilityId).toBe("recipient");
    expect(s.suggestedQuantity).toBeGreaterThan(0);
    expect(s.distance).toBeGreaterThan(0);
    expect(s.urgencyScore).toBeGreaterThanOrEqual(0);
    expect(s.urgencyScore).toBeLessThanOrEqual(100);
  });

  it("computes the impact preview consistently: with = without + extra days gained", () => {
    const forecasts = [
      makeForecast({ facilityId: "recipient", medicineId: "med1", status: "at-risk", daysToStockout: 10, avgDailyConsumption: 5 }),
      makeForecast({ facilityId: "donor", medicineId: "med1", status: "healthy", daysToStockout: null, avgDailyConsumption: 2 }),
    ];

    const [s] = computeRedistributionSuggestions(baseWorld(), forecasts);
    expect(s.withoutTransferDays).toBe(10);
    expect(s.extraDaysGained).toBeGreaterThan(0);
    expect(s.withTransferDays).toBe((s.withoutTransferDays as number) + s.extraDaysGained);
  });

  it("produces no suggestions when nothing is at-risk", () => {
    const forecasts = [
      makeForecast({ facilityId: "recipient", medicineId: "med1", status: "healthy", daysToStockout: 90, avgDailyConsumption: 1 }),
      makeForecast({ facilityId: "donor", medicineId: "med1", status: "healthy", daysToStockout: null, avgDailyConsumption: 2 }),
    ];

    expect(computeRedistributionSuggestions(baseWorld(), forecasts)).toHaveLength(0);
  });

  it("produces no suggestions when no facility has confirmed surplus", () => {
    const world = baseWorld();
    world.stock = world.stock.map((r) => (r.facilityId === "donor" ? { ...r, currentStock: 60 } : r)); // below reorderLevel*1.5
    const forecasts = [
      makeForecast({ facilityId: "recipient", medicineId: "med1", status: "critical", daysToStockout: 3, avgDailyConsumption: 5 }),
      makeForecast({ facilityId: "donor", medicineId: "med1", status: "healthy", daysToStockout: null, avgDailyConsumption: 2 }),
    ];

    expect(computeRedistributionSuggestions(world, forecasts)).toHaveLength(0);
  });

  it("never allocates more of a donor's surplus than it actually has across multiple recipients", () => {
    const recipient2 = makeFacility({ id: "recipient2", name: "Another At-Risk Facility", lat: 13.31, lng: 74.76 });
    const world = baseWorld();
    world.facilities.push(recipient2);
    world.stock.push(makeStockRecord({ facilityId: "recipient2", medicineId: "med1", currentStock: 15, reorderLevel: 20, replenishmentLeadTimeDays: 6 }));
    // Shrink the donor's surplus so it can't fully cover both recipients.
    world.stock = world.stock.map((r) => (r.facilityId === "donor" ? { ...r, currentStock: 120 } : r));

    const forecasts = [
      makeForecast({ facilityId: "recipient", medicineId: "med1", status: "at-risk", daysToStockout: 8, avgDailyConsumption: 5 }),
      makeForecast({ facilityId: "recipient2", medicineId: "med1", status: "at-risk", daysToStockout: 6, avgDailyConsumption: 5 }),
      makeForecast({ facilityId: "donor", medicineId: "med1", status: "healthy", daysToStockout: null, avgDailyConsumption: 2 }),
    ];

    const suggestions = computeRedistributionSuggestions(world, forecasts);
    const donorSurplus = 120 - 50 * 1.5; // currentStock - reorderLevel * 1.5
    const totalAllocated = suggestions.filter((s) => s.fromFacilityId === "donor").reduce((sum, s) => sum + s.suggestedQuantity, 0);
    expect(totalAllocated).toBeLessThanOrEqual(donorSurplus);
  });
});
