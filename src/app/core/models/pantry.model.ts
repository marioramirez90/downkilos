export interface PantryItem {
  id: string;
  productId: string;
  name: string;
  brand?: string;
  category: string;
  imageUrl: string;
  packageSize: string;
  initialQuantityGrams: number;
  remainingQuantityGrams: number;
  currentAmountGrams?: number;
  daysShelfLife?: number;
  unit: string;
  purchasedDate: string;    // ISO Date YYYY-MM-DD
  maxStorageDays: number;   // Haltbarkeit nach Anbruch: z.B. 2 Tage für frisches Fleisch, 5 für Milchprodukte, 180 für Getreide/Reis
  expiresAt: string;        // Berechnetes Mindesthaltbarkeitsdatum nach Öffnung
  isPerishable: boolean;    // Leicht verderblich (z.B. frisches Hähnchen, Hackfleisch)
  storageLocation: 'refrigerator' | 'freezer' | 'pantry_shelf';
  suggestedRecipeIds?: string[];
}

export interface LeftoverOptimizationMessage {
  text: string;
  pantryItemName: string;
  remainingGrams: number;
  possibleMealsCount: number;
  recipeSuggestions: Array<{
    recipeId: string;
    recipeTitle: string;
    usedAmountGrams: number;
  }>;
}
