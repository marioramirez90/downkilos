export interface WeightEntry {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  weight: number; // in kg
  note?: string;
}

export interface WeightStats {
  startWeight: number;
  currentWeight: number;
  targetWeight: number;
  totalChangeKg: number;
  remainingKg: number;
  progressPercent: number;
}
