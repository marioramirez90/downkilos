export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active';
export type UserGoal = 'lose_weight' | 'maintain_weight' | 'gain_weight';
export type DietaryPreference = 'omnivore' | 'vegetarian' | 'vegan';
export type BiologicalGender = 'female' | 'male' | 'other';

export interface UserProfile {
  id: string;
  name: string;
  birthDate: string; // ISO format YYYY-MM-DD
  gender: BiologicalGender;
  currentWeight: number; // in kg
  height: number; // in cm
  targetWeight?: number; // optional target in kg
  targetPaceWeeklyKg?: number; // optional pace in kg/week (e.g. 0.5)
  email?: string; // optional email
  activityLevel: ActivityLevel;
  goal: UserGoal;
  dietaryPreference?: DietaryPreference;
  allergies?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityOption {
  value: ActivityLevel;
  title: string;
  subtitle: string;
}

export const ACTIVITY_OPTIONS: ActivityOption[] = [
  {
    value: 'sedentary',
    title: 'Wenig aktiv',
    subtitle: 'Sitzender Alltag'
  },
  {
    value: 'light',
    title: 'Leicht aktiv',
    subtitle: '1–3x pro Woche'
  },
  {
    value: 'moderate',
    title: 'Moderat aktiv',
    subtitle: '3–5x pro Woche'
  },
  {
    value: 'very_active',
    title: 'Sehr aktiv',
    subtitle: '5+x pro Woche'
  }
];

export interface GoalOption {
  value: UserGoal;
  label: string;
}

export const GOAL_OPTIONS: GoalOption[] = [
  { value: 'lose_weight', label: 'Gewicht reduzieren' },
  { value: 'maintain_weight', label: 'Gewicht halten' },
  { value: 'gain_weight', label: 'Muskelaufbau / Zunehmen' }
];
