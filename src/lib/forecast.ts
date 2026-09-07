import { Forecast, StockRecord, WorldState } from "./types";

// --- Weighted moving average: recent days count more, so a sudden spike shows up
// fast while old noise fades out. Weights are linear (day 1 = weight 1, day N = weight N).
function weightedAverage(units: number[]): number {
  if (units.length === 0) return 0;
  let weightedSum = 0;
  let weightTotal = 0;
  units.forEach((u, i) => {
    const weight = i + 1;
    weightedSum += u * weight;
    weightTotal += weight;
  });
  return weightedSum / weightTotal;
}

function stdDev(units: number[], mean: number): number {
  if (units.length < 2) return mean * 0.5; // assume high uncertainty with almost no data
  const variance = units.reduce((sum, u) => sum + (u - mean) ** 2, 0) / (units.length - 1);
  return Math.sqrt(variance);
}

function trendDirection(units: number[]): Forecast["trend"] {
  if (units.length < 4) return "stable";
  const mid = Math.floor(units.length / 2);
  const firstHalf = units.slice(0, mid);
  const secondHalf = units.slice(mid);
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const delta = avgSecond - avgFirst;
  const threshold = Math.max(0.3, avgFirst * 0.08);
  if (delta > threshold) return "worsening";
  if (delta < -threshold) return "improving";
  return "stable";
}

// Confidence heuristic: combines (a) how much history backs the number, and
// (b) how consistent (low-variance) that history is. Both are plain 0-1 factors
// multiplied together, then floored so a forecast is never displayed as 100% sure.
function computeConfidence(
  historyLen: number,
  mean: number,
  sd: number
): { confidence: number; reasoning: string } {
  const historyFactor = Math.min(1, historyLen / 21); // full confidence needs 3 weeks of data
  const coefficientOfVariation = mean > 0 ? sd / mean : 1;
  const stabilityFactor = 1 / (1 + coefficientOfVariation * 1.5);
  const raw = historyFactor * stabilityFactor;
  const confidence = Math.max(0.15, Math.min(0.95, raw));

  const historyDesc =
    historyLen >= 21 ? "a full 3-week consumption history" :
    historyLen >= 10 ? `only ${historyLen} days of consumption history (less than the ideal 3 weeks)` :
    `just ${historyLen} days of consumption history — too little to be confident`;

  const stabilityDesc =
    coefficientOfVariation < 0.25 ? "consumption has been very consistent day-to-day" :
    coefficientOfVariation < 0.5 ? "consumption has some day-to-day variability" :
    "consumption has been highly volatile, which widens the uncertainty";

  const reasoning = `Based on ${historyDesc}, and ${stabilityDesc} (coefficient of variation ${coefficientOfVariation.toFixed(2)}). Confidence = history-completeness (${(historyFactor * 100).toFixed(0)}%) x consistency (${(stabilityFactor * 100).toFixed(0)}%).`;

  return { confidence, reasoning };
}

function computeDaysToStockout(
  currentStock: number,
  avgDailyConsumption: number,
  pendingQty: number,
  pendingEtaDay: number
): number | null {
  if (avgDailyConsumption <= 0.01) return null;

  // If a replenishment is due to arrive before stock would run out, factor it in:
  // simulate day-by-day depletion, adding the pending quantity on its ETA day.
  let stock = currentStock;
  let day = 0;
  const maxHorizon = 120;
  let replenished = pendingQty <= 0; // if no pending order, "already applied" (skip)

  while (day < maxHorizon) {
    if (!replenished && day >= pendingEtaDay) {
      stock += pendingQty;
      replenished = true;
    }
    if (stock <= 0) return day;
    stock -= avgDailyConsumption;
    day += 1;
  }
  return stock <= 0 ? maxHorizon : null;
}

function classifyStatus(daysToStockout: number | null, leadTime: number): Forecast["status"] {
  if (daysToStockout === null) return "healthy";
  if (daysToStockout <= leadTime) return "critical"; // will run out before a reorder could even arrive
  if (daysToStockout <= leadTime * 2) return "at-risk";
  if (daysToStockout <= leadTime * 3.5) return "watch";
  return "healthy";
}

export function computeForecast(record: StockRecord, simDay: number): Forecast {
  const units = record.history.map((h) => h.units);
  const avgDailyConsumption = weightedAverage(units);
  const sd = stdDev(units, avgDailyConsumption);

  const pendingQty = record.pendingReplenishment?.quantity ?? 0;
  const pendingEta = record.pendingReplenishment?.etaDay ?? 0;

  const daysToStockout = computeDaysToStockout(record.currentStock, avgDailyConsumption, pendingQty, pendingEta);
  const projectedStockoutDay = daysToStockout !== null ? simDay + daysToStockout : null;

  const { confidence, reasoning } = computeConfidence(units.length, avgDailyConsumption, sd);
  const status = classifyStatus(daysToStockout, record.replenishmentLeadTimeDays);
  const trend = trendDirection(units);

  return {
    facilityId: record.facilityId,
    medicineId: record.medicineId,
    currentStock: record.currentStock,
    avgDailyConsumption: Math.round(avgDailyConsumption * 100) / 100,
    consumptionStdDev: Math.round(sd * 100) / 100,
    daysToStockout,
    projectedStockoutDay,
    confidence: Math.round(confidence * 100) / 100,
    confidenceReasoning: reasoning,
    status,
    trend,
  };
}

export function computeAllForecasts(world: WorldState): Forecast[] {
  return world.stock.map((record) => computeForecast(record, world.simDay));
}
