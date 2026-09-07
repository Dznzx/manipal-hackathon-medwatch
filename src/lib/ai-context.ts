import { StateResponse } from "./api-types";

// Serializes the current computed state (already produced by the deterministic
// forecast/clustering/redistribution engine) into compact text the LLM can be
// grounded on. The model is never asked to invent or recompute any number —
// only to read, explain, or narrate what's already here.
export function buildGroundingText(data: StateResponse): string {
  const lines: string[] = [];
  lines.push(`Simulated day: ${data.simDay}. Consumption spike multiplier: ${data.simParams.consumptionSpikeMultiplier}x. Replenishment delay: +${data.simParams.replenishmentDelayDays}d.`);
  lines.push("");

  lines.push("FACILITIES (id | name | type | taluk):");
  for (const f of data.facilities) {
    lines.push(`${f.id} | ${f.name} | ${f.type} | ${f.clusterName}`);
  }
  lines.push("");

  lines.push("FORECASTS (facility | medicine | stock | avg daily use | days to stockout | confidence | status | trend):");
  for (const fc of data.forecasts) {
    const facility = data.facilities.find((f) => f.id === fc.facilityId)?.name ?? fc.facilityId;
    const medicine = data.medicines.find((m) => m.id === fc.medicineId)?.name ?? fc.medicineId;
    lines.push(
      `${facility} | ${medicine} | ${fc.currentStock} | ${fc.avgDailyConsumption}/day | ${fc.daysToStockout ?? "n/a"}d | ${Math.round(fc.confidence * 100)}% | ${fc.status} | ${fc.trend}`
    );
  }
  lines.push("");

  lines.push("REGIONAL RISK SIGNALS (riskLevel | taluk | medicine | facilities | reasoning):");
  for (const r of data.regionalRisks) {
    lines.push(
      `${r.riskLevel} | ${r.clusterName} | ${r.medicineName} | ${r.facilitiesAtRisk.map((f) => f.facilityName).join(", ")} | ${r.reasoning.join(" ")}`
    );
  }
  lines.push("");

  lines.push("REDISTRIBUTION SUGGESTIONS (from -> to | medicine | qty | distance | urgency | impact):");
  for (const s of data.suggestions) {
    lines.push(
      `${s.fromFacilityName} -> ${s.toFacilityName} | ${s.medicineName} | ${s.suggestedQuantity} units | ${s.distance} km | urgency ${s.urgencyScore} | without: ${s.withoutTransferDays}d, with: ${s.withTransferDays}d`
    );
  }

  return lines.join("\n");
}

export const SYSTEM_PROMPT = `You are the natural-language interface for MedWatch, a medicine shortage early-warning dashboard for health facilities in Udupi district, Karnataka.

Rules you must follow strictly:
- Only use the data given to you below. Never invent facility names, numbers, or medicines that aren't in the data.
- If asked something the data doesn't cover, say so plainly instead of guessing.
- Stock levels and consumption in the data are simulated for this prototype; facility names, types, and locations are real. If relevant, be honest about that distinction.
- Keep answers concise (a few sentences, or a short list) — this is a dashboard assistant, not an essay generator.
- Never claim certainty the data doesn't support. Reflect confidence scores and risk levels (isolated/watch/regional) as given, don't round them up to sound more certain.`;
