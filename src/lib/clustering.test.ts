import { describe, it, expect } from "vitest";
import { computeRegionalRisks } from "./clustering";
import { makeFacility, makeForecast, makeMedicine } from "./test-helpers";
import { WorldState } from "./types";

function makeWorld(facilities: WorldState["facilities"]): WorldState {
  return { facilities, medicines: [makeMedicine()], stock: [], simDay: 0, seed: 1 };
}

describe("computeRegionalRisks", () => {
  it("flags a regional risk when 2+ facilities in the same cluster are at-risk within a similar window", () => {
    const facilities = [
      makeFacility({ id: "f1", name: "Facility 1" }),
      makeFacility({ id: "f2", name: "Facility 2" }),
    ];
    const forecasts = [
      makeForecast({ facilityId: "f1", status: "at-risk", daysToStockout: 10 }),
      makeForecast({ facilityId: "f2", status: "at-risk", daysToStockout: 13 }),
    ];

    const risks = computeRegionalRisks(makeWorld(facilities), forecasts);
    expect(risks).toHaveLength(1);
    expect(risks[0].riskLevel).toBe("regional");
    expect(risks[0].facilitiesAtRisk).toHaveLength(2);
  });

  it("flags an isolated event when only one facility in the cluster is at-risk", () => {
    const facilities = [
      makeFacility({ id: "f1", name: "Facility 1" }),
      makeFacility({ id: "f2", name: "Facility 2" }),
    ];
    const forecasts = [
      makeForecast({ facilityId: "f1", status: "at-risk", daysToStockout: 10 }),
      makeForecast({ facilityId: "f2", status: "healthy", daysToStockout: null }),
    ];

    const risks = computeRegionalRisks(makeWorld(facilities), forecasts);
    expect(risks).toHaveLength(1);
    expect(risks[0].riskLevel).toBe("isolated");
    expect(risks[0].facilitiesAtRisk).toHaveLength(1);
  });

  it("does not escalate to regional when at-risk facilities' stockout dates are far apart", () => {
    const facilities = [
      makeFacility({ id: "f1", name: "Facility 1" }),
      makeFacility({ id: "f2", name: "Facility 2" }),
    ];
    const forecasts = [
      makeForecast({ facilityId: "f1", status: "at-risk", daysToStockout: 5 }),
      makeForecast({ facilityId: "f2", status: "at-risk", daysToStockout: 30 }),
    ];

    const risks = computeRegionalRisks(makeWorld(facilities), forecasts);
    expect(risks[0].riskLevel).toBe("watch");
  });

  it("does not produce any signal from facilities that are merely in 'watch' status", () => {
    const facilities = [
      makeFacility({ id: "f1", name: "Facility 1" }),
      makeFacility({ id: "f2", name: "Facility 2" }),
    ];
    const forecasts = [
      makeForecast({ facilityId: "f1", status: "watch", daysToStockout: 20 }),
      makeForecast({ facilityId: "f2", status: "watch", daysToStockout: 21 }),
    ];

    const risks = computeRegionalRisks(makeWorld(facilities), forecasts);
    expect(risks).toHaveLength(0);
  });

  it("reads a regional pattern as demand-driven when consumption is worsening across facilities", () => {
    const facilities = [
      makeFacility({ id: "f1", name: "Facility 1" }),
      makeFacility({ id: "f2", name: "Facility 2" }),
    ];
    const forecasts = [
      makeForecast({ facilityId: "f1", status: "at-risk", daysToStockout: 10, trend: "worsening" }),
      makeForecast({ facilityId: "f2", status: "at-risk", daysToStockout: 12, trend: "worsening" }),
    ];

    const risks = computeRegionalRisks(makeWorld(facilities), forecasts);
    expect(risks[0].reasoning.join(" ")).toMatch(/demand-side/i);
  });

  it("reads a regional pattern as supply-driven when consumption is stable across facilities", () => {
    const facilities = [
      makeFacility({ id: "f1", name: "Facility 1" }),
      makeFacility({ id: "f2", name: "Facility 2" }),
    ];
    const forecasts = [
      makeForecast({ facilityId: "f1", status: "at-risk", daysToStockout: 10, trend: "stable" }),
      makeForecast({ facilityId: "f2", status: "at-risk", daysToStockout: 12, trend: "stable" }),
    ];

    const risks = computeRegionalRisks(makeWorld(facilities), forecasts);
    expect(risks[0].reasoning.join(" ")).toMatch(/supply-side/i);
  });
});
