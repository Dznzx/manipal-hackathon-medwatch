import { Facility, Medicine, StockRecord, Forecast, RegionalRisk, RedistributionSuggestion, SimParams } from "./types";

export interface StateResponse {
  facilities: Facility[];
  medicines: Medicine[];
  stock: StockRecord[];
  simDay: number;
  simParams: SimParams;
  forecasts: Forecast[];
  regionalRisks: RegionalRisk[];
  suggestions: RedistributionSuggestion[];
}
