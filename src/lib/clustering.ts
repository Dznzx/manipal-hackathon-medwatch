import { Forecast, RegionalRisk, RiskLevel, WorldState } from "./types";

// "watch" is included deliberately: the regional-pattern signal we want to catch is
// facilities *trending* toward stockout together, not only the ones already critical —
// by the time several facilities hit "critical" independently, it's too late to redistribute.
const AT_RISK_STATUSES = new Set(["critical", "at-risk", "watch"]);

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
