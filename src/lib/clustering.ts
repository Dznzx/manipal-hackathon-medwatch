import { Forecast, RegionalRisk, RiskLevel, WorldState } from "./types";

// Deliberately excludes "watch": with routine reordering in play, healthy facilities
// pass through "watch" briefly on every normal reorder cycle, so it's too noisy a
// signal for "this needs regional attention". "at-risk"/"critical" means a facility's
// own resupply may not arrive in time, which is the real regional-pattern signal.
const AT_RISK_STATUSES = new Set(["critical", "at-risk"]);

interface GroupKey {
  clusterId: string;
  clusterName: string;
  medicineId: string;
  medicineName: string;
}

export function computeRegionalRisks(world: WorldState, forecasts: Forecast[]): RegionalRisk[] {
  const facilityById = new Map(world.facilities.map((f) => [f.id, f]));
  const medicineById = new Map(world.medicines.map((m) => [m.id, m]));

  const groups = new Map<string, { key: GroupKey; forecasts: Forecast[] }>();

  for (const fc of forecasts) {
    const facility = facilityById.get(fc.facilityId);
    const medicine = medicineById.get(fc.medicineId);
    if (!facility || !medicine) continue;
    const groupKey = `${facility.clusterId}:${fc.medicineId}`;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        key: {
          clusterId: facility.clusterId,
          clusterName: facility.clusterName,
          medicineId: fc.medicineId,
          medicineName: medicine.name,
        },
        forecasts: [],
      });
    }
    groups.get(groupKey)!.forecasts.push(fc);
  }

  const risks: RegionalRisk[] = [];

  for (const { key, forecasts: groupForecasts } of groups.values()) {
    const atRisk = groupForecasts.filter((f) => AT_RISK_STATUSES.has(f.status) && f.daysToStockout !== null);
    if (atRisk.length === 0) continue;

    const stockoutDays = atRisk.map((f) => f.daysToStockout as number);
    const minDay = Math.min(...stockoutDays);
    const maxDay = Math.max(...stockoutDays);
    const spread = maxDay - minDay;
    const overlapping = atRisk.length >= 2 && spread <= 12; // "similar timeframe" window

    let riskLevel: RiskLevel;
    const reasoning: string[] = [];

    if (atRisk.length >= 2 && overlapping) {
      riskLevel = "regional";
      reasoning.push(
        `${atRisk.length} facilities in ${key.clusterName} are all trending toward a ${key.medicineName} stockout within a ${spread.toFixed(0)}-day window of each other (day ${minDay} to day ${maxDay}) — this looks like a shared supply/demand pattern, not coincidence.`
      );

      // Root-cause hint: a rough demand-vs-supply read using the trend field
      // each forecast already carries. Worsening consumption across most of
      // the group points at a shared demand shock; stable consumption with
      // the same shortfall points at chronically tight supply instead.
      const worseningCount = atRisk.filter((f) => f.trend === "worsening").length;
      if (worseningCount >= Math.ceil(atRisk.length * 0.6)) {
        reasoning.push(
          `Likely driver: demand-side. Consumption is actively trending upward at ${worseningCount}/${atRisk.length} of these facilities — consistent with a shared demand shock (e.g. a seasonal illness surge) rather than a one-off supply delay.`
        );
      } else {
        reasoning.push(
          `Likely driver: supply-side. Consumption at these facilities is largely stable, not spiking — the shared risk looks more like chronically thin buffers relative to replenishment lead time than a sudden demand surge.`
        );
      }
    } else if (atRisk.length >= 2) {
      riskLevel = "watch";
      reasoning.push(
        `${atRisk.length} facilities in ${key.clusterName} are trending toward a ${key.medicineName} stockout, but their projected dates are spread ${spread.toFixed(0)} days apart — could still be independent issues, worth monitoring.`
      );
    } else {
      riskLevel = "isolated";
      reasoning.push(
        `Only 1 facility in ${key.clusterName} (${facilityById.get(atRisk[0].facilityId)?.name}) shows a ${key.medicineName} shortage trend — no corroborating signal from nearby facilities, so this reads as a local inventory issue rather than a regional one.`
      );
    }

    const avgConfidence = atRisk.reduce((s, f) => s + f.confidence, 0) / atRisk.length;
    reasoning.push(
      `Average forecast confidence behind this signal: ${(avgConfidence * 100).toFixed(0)}%.`
    );

    const urgency = atRisk.reduce((s, f) => s + 1 / Math.max(1, f.daysToStockout as number), 0);
    const score = Math.round(
      (riskLevel === "regional" ? 60 : riskLevel === "watch" ? 30 : 10) +
        urgency * 40 +
        avgConfidence * 10
    );

    risks.push({
      clusterId: key.clusterId,
      clusterName: key.clusterName,
      medicineId: key.medicineId,
      medicineName: key.medicineName,
      facilitiesAtRisk: atRisk.map((f) => ({
        facilityId: f.facilityId,
        facilityName: facilityById.get(f.facilityId)?.name ?? f.facilityId,
        daysToStockout: f.daysToStockout,
      })),
      riskLevel,
      reasoning,
      score: Math.min(100, score),
    });
  }

  return risks.sort((a, b) => b.score - a.score);
}
