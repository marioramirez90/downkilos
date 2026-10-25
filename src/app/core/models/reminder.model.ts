import { MealType } from './recipe.model';

export interface ReminderSettings {
  enabled: boolean;
  breakfastEnabled: boolean;
  lunchEnabled: boolean;
  dinnerEnabled: boolean;
  breakfastTime: string; // e.g. "12:00"
  lunchTime: string;     // e.g. "17:00"
  dinnerTime: string;    // e.g. "21:00"
  onlyOpenMeals: boolean;
  paused: boolean;
  privacyMode: boolean;
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  breakfastEnabled: true,
  lunchEnabled: true,
  dinnerEnabled: true,
  breakfastTime: '12:00',
  lunchTime: '17:00',
  dinnerTime: '21:00',
  onlyOpenMeals: true,
  paused: false,
  privacyMode: false
};

export type ReminderResponseStatus = 'as_planned' | 'replaced' | 'nothing_yet' | 'dismissed';

export interface MealReminderLogEntry {
  date: string; // YYYY-MM-DD
  slot: MealType;
  status: ReminderResponseStatus;
  respondedAt: string; // ISO
  details?: string;
}
