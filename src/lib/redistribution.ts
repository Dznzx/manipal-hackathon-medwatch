import { Forecast, RedistributionSuggestion, WorldState } from "./types";

const EARTH_RADIUS_KM = 6371;

// Real great-circle distance between two GPS points — facilities now carry
// real coordinates, so "N km away" in the UI is an actual distance, not a
// synthetic grid unit.
function distance(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

const SURPLUS_STOCKOUT_DAY_THRESHOLD = 60; // "safe enough to lend from" horizon
const TARGET_COVER_MULTIPLIER = 3; // recipients should be topped up to 3x their lead time

export function computeRedistributionSuggestions(
  world: WorldState,
  forecasts: Forecast[]
): RedistributionSuggestion[] {
  const facilityById = new Map(world.facilities.map((f) => [f.id, f]));
  const stockByKey = new Map(world.stock.map((s) => [`${s.facilityId}:${s.medicineId}`, s]));

  const suggestions: RedistributionSuggestion[] = [];

  for (const medicine of world.medicines) {
    const forMedicine = forecasts.filter((f) => f.medicineId === medicine.id);

    const recipients = forMedicine
      .filter((f) => f.status === "critical" || f.status === "at-risk")
      .sort((a, b) => (a.daysToStockout ?? 999) - (b.daysToStockout ?? 999));

    const donors = forMedicine.filter((f) => {
      const isHealthy = f.daysToStockout === null || f.daysToStockout >= SURPLUS_STOCKOUT_DAY_THRESHOLD;
      const record = stockByKey.get(`${f.facilityId}:${f.medicineId}`);
      const record_ok = record && record.currentStock > record.reorderLevel * 1.5;
      return isHealthy && record_ok;
    });

    if (recipients.length === 0 || donors.length === 0) continue;

    // Track surplus already committed to earlier (more urgent) recipients so the
    // same donor isn't offered its full surplus more than once in this pass.
    const remainingSurplus = new Map<string, number>();
    for (const donor of donors) {
      const donorRecord = stockByKey.get(`${donor.facilityId}:${donor.medicineId}`);
      if (!donorRecord) continue;
      remainingSurplus.set(donor.facilityId, Math.max(0, Math.round(donorRecord.currentStock - donorRecord.reorderLevel * 1.5)));
    }

    for (const recipient of recipients) {
      const recipientRecord = stockByKey.get(`${recipient.facilityId}:${recipient.medicineId}`);
      if (!recipientRecord) continue;
      const recipientFacility = facilityById.get(recipient.facilityId);
      if (!recipientFacility) continue;

      const targetCoverDays = recipientRecord.replenishmentLeadTimeDays * TARGET_COVER_MULTIPLIER;
      const neededQty = Math.max(
        0,
        Math.round(targetCoverDays * recipient.avgDailyConsumption - recipientRecord.currentStock)
      );
      if (neededQty <= 0) continue;

      // Rank donors for this recipient by distance (closer = cheaper/faster to move).
      const rankedDonors = donors
        .map((donor) => {
          const donorFacility = facilityById.get(donor.facilityId);
          const donorRecord = stockByKey.get(`${donor.facilityId}:${donor.medicineId}`);
          if (!donorFacility || !donorRecord || donorFacility.id === recipientFacility.id) return null;
          const surplusAvailable = remainingSurplus.get(donor.facilityId) ?? 0;
          if (surplusAvailable <= 0) return null;
          return { donor, donorFacility, donorRecord, surplusAvailable, dist: distance(donorFacility, recipientFacility) };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
        .sort((a, b) => a.dist - b.dist);

      const best = rankedDonors[0];
      if (!best) continue;

      const suggestedQuantity = Math.min(neededQty, best.surplusAvailable);
      // Skip transfers that would move less than a day's worth of consumption —
      // by the time a donor's surplus is mostly spoken for by more urgent
      // recipients, what's left may be too little to be a meaningful move.
      if (suggestedQuantity < recipient.avgDailyConsumption) continue;
      remainingSurplus.set(best.donorFacility.id, best.surplusAvailable - suggestedQuantity);

      // Three normalized 0-1 factors, blended into one explainable urgency score.
      const urgencyFactor = recipient.daysToStockout !== null
        ? Math.max(0, 1 - recipient.daysToStockout / (recipientRecord.replenishmentLeadTimeDays * 2))
        : 0;
      const adequacyFactor = Math.min(1, suggestedQuantity / neededQty);
      const proximityFactor = Math.max(0, 1 - best.dist / 100);
      const urgencyScore = Math.round((urgencyFactor * 0.5 + adequacyFactor * 0.3 + proximityFactor * 0.2) * 100);

      // Impact preview: how many extra days of cover this specific shipment buys,
      // on top of whatever the recipient's own forecast already assumes (including
      // its own pending routine reorder, if any) — makes the recommendation's value
      // concrete instead of an abstract "urgency score".
      const withoutTransferDays = recipient.daysToStockout;
      const extraDaysGained = recipient.avgDailyConsumption > 0 ? Math.round(suggestedQuantity / recipient.avgDailyConsumption) : 0;
      const withTransferDays = withoutTransferDays !== null ? withoutTransferDays + extraDaysGained : null;

      const reasoning = [
        `${recipientFacility.name} is projected to run out of ${medicine.name} in ${recipient.daysToStockout} day(s) (status: ${recipient.status}), which is inside or near its own ${recipientRecord.replenishmentLeadTimeDays}-day replenishment lead time — a routine reorder may not arrive in time.`,
        `${best.donorFacility.name} is the nearest facility with confirmed surplus: ${best.surplusAvailable} ${medicine.unit} above its own safety buffer, ${best.dist.toFixed(0)} km away.`,
        `Suggested transfer of ${suggestedQuantity} ${medicine.unit} covers ${Math.round((suggestedQuantity / neededQty) * 100)}% of the recipient's gap to a ${targetCoverDays}-day safety cover.`,
        `Without this transfer: stockout in ${withoutTransferDays} day(s). With it: pushed to ~${withTransferDays} day(s) — ${extraDaysGained} extra day(s) of cover.`,
        `Urgency score ${urgencyScore}/100 = 50% recipient urgency + 30% how fully this shipment covers the gap + 20% proximity.`,
      ];

      suggestions.push({
        id: `${best.donorFacility.id}->${recipientFacility.id}:${medicine.id}`,
        medicineId: medicine.id,
        medicineName: medicine.name,
        fromFacilityId: best.donorFacility.id,
        fromFacilityName: best.donorFacility.name,
        toFacilityId: recipientFacility.id,
        toFacilityName: recipientFacility.name,
        suggestedQuantity,
        distance: Math.round(best.dist),
        urgencyScore,
        reasoning,
        withoutTransferDays,
        withTransferDays,
        extraDaysGained,
      });
    }
  }

  return suggestions.sort((a, b) => b.urgencyScore - a.urgencyScore);
}
