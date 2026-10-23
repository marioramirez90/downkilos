import { DietaryPreference } from './user-profile.model';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface RecipeIngredient {
  productId?: string;
  name: string;
  amount: number;
  unit: string; // 'g', 'ml', 'Stück', 'TL', 'EL'
  portionCost?: number;
}

export interface Recipe {
  id: string;
  title: string;
  mealType: MealType;
  dietType: DietaryPreference;
  imageUrl: string;
  prepTimeMinutes: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  pricePerPortion: number;
  allergens: string[];
  ingredients: RecipeIngredient[];
  instructions: string[];
}

export interface DayPlan {
  dayIndex: number;
  dayName: string;
  dateStr: string;
  breakfast: Recipe;
  lunch: Recipe;
  snack: Recipe;
  dinner: Recipe;
}
