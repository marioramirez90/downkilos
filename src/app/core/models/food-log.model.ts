import { MealType } from './recipe.model';

export type FoodLogStatus = 'planned' | 'eaten';

export interface FoodLogItem {
  id: string;
  productId?: string;
  recipeId?: string;
  name: string;
  brand?: string;
  category: string;
  imageUrl: string;
  mealType: MealType;
  amountGrams: number;
  amount?: number;
  unit?: string;
  displayQuantity: string; // z.B. "1 Banane (ca. 120 g)" oder "1 Portion (150 g)"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portionCost: number;     // anteiliger Preis der gegessenen Menge
  status: FoodLogStatus;   // 'planned' oder 'eaten'
  loggedAt: string;        // ISO Timestamp
  isRecipe?: boolean;
}

export type LoggedFoodItem = FoodLogItem;

export interface DailyNutritionSummary {
  targetCalories: number;
  plannedCalories: number;
  eatenCalories: number;
  remainingCalories: number;
  eatenProtein: number;
  eatenCarbs: number;
  eatenFat: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}
