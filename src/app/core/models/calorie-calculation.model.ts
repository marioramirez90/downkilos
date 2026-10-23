export interface MacroNutrients {
  proteinGrams: number;
  proteinKcal: number;
  proteinPercentage: number;
  carbsGrams: number;
  carbsKcal: number;
  carbsPercentage: number;
  fatGrams: number;
  fatKcal: number;
  fatPercentage: number;
}

export interface WeightForecast {
  weeklyLossKg: number;
  monthlyLossMinKg: number;
  monthlyLossMaxKg: number;
}

export interface CalorieCalculationResult {
  bmr: number; // Basal Metabolic Rate / Ruheenergieverbrauch
  tdee: number; // Total Daily Energy Expenditure / Erhaltungsbedarf
  deficit: number; // Kaloriendefizit (z.B. 300-500 kcal) oder Überschuss
  dailyTargetKcal: number; // Täglicher Zielwert
  macros: MacroNutrients;
  forecast: WeightForecast;
  isUnderSafeMinimum: boolean;
  safeMinimumKcal: number;
  calculatedAge: number;
  notes?: string[];
}
