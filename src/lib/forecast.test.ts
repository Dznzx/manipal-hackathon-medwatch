import { describe, it, expect } from "vitest";
import { computeForecast } from "./forecast";
import { makeStockRecord, history } from "./test-helpers";

describe("computeForecast", () => {
  it("projects a stockout day from steady consumption against current stock", () => {
    // 100 units, consistently using 5/day -> should run out in ~20 days
    const record = makeStockRecord({ currentStock: 100, history: history(Array(21).fill(5)) });
    const forecast = computeForecast(record, 0);
    expect(forecast.daysToStockout).not.toBeNull();
    expect(forecast.daysToStockout).toBeGreaterThanOrEqual(18);
    expect(forecast.daysToStockout).toBeLessThanOrEqual(22);
  });

  it("reports no stockout when consumption is effectively zero", () => {
    const record = makeStockRecord({ currentStock: 500, history: history(Array(21).fill(0)) });
    const forecast = computeForecast(record, 0);
    expect(forecast.daysToStockout).toBeNull();
    expect(forecast.status).toBe("healthy");
  });

  it("classifies status against the facility's own lead time, not a fixed cutoff", () => {
    // Same days-to-stockout (~10d), but different lead times should land in
    // different status bands: short lead time is more comfortable than a long one.
    const shortLead = makeStockRecord({ currentStock: 100, history: history(Array(21).fill(10)), replenishmentLeadTimeDays: 3 });
    const longLead = makeStockRecord({ currentStock: 100, history: history(Array(21).fill(10)), replenishmentLeadTimeDays: 9 });

    const forecastShort = computeForecast(shortLead, 0);
    const forecastLong = computeForecast(longLead, 0);

    expect(forecastShort.daysToStockout).toBe(forecastLong.daysToStockout);
    expect(["at-risk", "watch", "healthy"]).toContain(forecastShort.status);
    expect(["critical", "at-risk"]).toContain(forecastLong.status);
  });

  it("factors in a pending replenishment before computing stockout", () => {
    const withoutPending = makeStockRecord({ currentStock: 20, history: history(Array(21).fill(5)), pendingReplenishment: null });
    const withPending = makeStockRecord({
      currentStock: 20,
      history: history(Array(21).fill(5)),
      pendingReplenishment: { quantity: 100, etaDay: 3 },
    });

    const forecastWithout = computeForecast(withoutPending, 0);
    const forecastWith = computeForecast(withPending, 0);

    expect(forecastWith.daysToStockout).not.toBeNull();
    expect(forecastWithout.daysToStockout).not.toBeNull();
    expect(forecastWith.daysToStockout as number).toBeGreaterThan(forecastWithout.daysToStockout as number);
  });

  it("gives higher confidence to longer, more consistent history", () => {
    const consistent = makeStockRecord({ history: history(Array(21).fill(5)) });
    const volatile = makeStockRecord({ history: history([1, 9, 1, 9, 1, 9, 1, 9, 1, 9, 1, 9, 1, 9, 1, 9, 1, 9, 1, 9, 1]) });
    const short = makeStockRecord({ history: history([5, 5, 5]) });

    const consistentForecast = computeForecast(consistent, 0);
    const volatileForecast = computeForecast(volatile, 0);
    const shortForecast = computeForecast(short, 0);

    expect(consistentForecast.confidence).toBeGreaterThan(volatileForecast.confidence);
    expect(consistentForecast.confidence).toBeGreaterThan(shortForecast.confidence);
    // Confidence must never be displayed as absolute certainty.
    expect(consistentForecast.confidence).toBeLessThanOrEqual(0.95);
  });

  it("always attaches a non-empty plain-English reasoning string", () => {
    const forecast = computeForecast(makeStockRecord(), 0);
    expect(forecast.confidenceReasoning.length).toBeGreaterThan(20);
  });
});
