import { DietaryPreference } from './user-profile.model';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface RecipeIngredient {
  productId?: string;      // Verknüpfung mit echtem Netto-Produkt
  name: string;
  amount: number;
  unit: string;            // 'g', 'ml', 'Stück', 'TL', 'EL', 'Prise'
  portionCost: number;     // Anteilige Kosten dieser Zutat für 1 Portion
  packageSize?: string;    // Packungsgröße des Netto-Produkts (z.B. '500 g', '10 Stück')
  packagePrice?: number | null; // Vollständiger Packungspreis bei Netto
  packagesNeeded?: number; // Mindestens zu kaufende ganze Packungen
  notes?: string;          // z.B. 'essbarer Anteil' oder 'nach Geschmack'
}

export interface RecipeCostBreakdown {
  portionCost: number;     // Rechnerischer Portionspreis (z.B. 1,35 €)
  fullPackageCost: number; // Tatsächlicher Einkaufspreis vollständiger Packungen (z.B. 4,50 €)
  packagesCount: number;   // Anzahl zu kaufender Packungen
}

export interface Recipe {
  id: string;
  title: string;
  subtitle?: string;
  mealType: MealType;
  dietType: DietaryPreference;
  imageUrl: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: 'Einfach' | 'Mittel' | 'Anspruchsvoll';
  calories: number;        // je Portion
  protein: number;         // je Portion in g
  carbs: number;           // je Portion in g
  fat: number;             // je Portion in g
  fiber?: number;          // je Portion in g
  pricePerPortion: number; // Rechnerischer Portionspreis (A)
  fullPackageCost: number; // Tatsächlicher Einkaufspreis für Neukauf (B)
  allergens: string[];
  ingredients: RecipeIngredient[];
  stepInstructions: string[]; // Vollständige Schritt-für-Schritt-Kochanleitung
  mealPrepTips?: string;   // Meal-Prep & Haltbarkeitshinweise
  storageTips?: string;    // Richtige Kühlung & Aufbewahrung
  defaultServings: number;
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
