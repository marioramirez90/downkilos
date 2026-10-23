import { Injectable, inject, signal, computed } from '@angular/core';
import { FoodLogItem, DailyNutritionSummary } from '../models/food-log.model';
import { ProductItem } from '../models/product.model';
import { Recipe, MealType } from '../models/recipe.model';
import { StorageService } from './storage.service';

const FOOD_LOG_STORAGE_KEY = 'down_kilos_today_food_log';

@Injectable({
  providedIn: 'root'
})
export class FoodLogService {
  private storageService = inject(StorageService);

  readonly loggedItems = signal<FoodLogItem[]>([]);

  readonly targetCalories = signal<number>(2000);
  readonly targetProtein = signal<number>(120);
  readonly targetCarbs = signal<number>(220);
  readonly targetFat = signal<number>(60);

  readonly dailySummary = computed<DailyNutritionSummary>(() => {
    const list = this.loggedItems();
    const target = this.targetCalories();

    let plannedCal = 0;
    let eatenCal = 0;
    let eatenProtein = 0;
    let eatenCarbs = 0;
    let eatenFat = 0;

    for (const item of list) {
      plannedCal += item.calories;
      if (item.status === 'eaten') {
        eatenCal += item.calories;
        eatenProtein += item.protein;
        eatenCarbs += item.carbs;
        eatenFat += item.fat;
      }
    }

    const remaining = Math.max(0, target - eatenCal);

    return {
      targetCalories: target,
      plannedCalories: plannedCal,
      eatenCalories: eatenCal,
      remainingCalories: remaining,
      eatenProtein: Math.round(eatenProtein * 10) / 10,
      eatenCarbs: Math.round(eatenCarbs * 10) / 10,
      eatenFat: Math.round(eatenFat * 10) / 10,
      targetProtein: this.targetProtein(),
      targetCarbs: this.targetCarbs(),
      targetFat: this.targetFat()
    };
  });

  readonly dailyLog = this.loggedItems;
  readonly eatenCalories = computed(() => this.dailySummary().eatenCalories);
  readonly plannedCalories = computed(() => this.dailySummary().plannedCalories);
  readonly remainingCalories = computed(() => this.dailySummary().remainingCalories);
  readonly eatenProtein = computed(() => this.dailySummary().eatenProtein);
  readonly eatenCarbs = computed(() => this.dailySummary().eatenCarbs);
  readonly eatenFat = computed(() => this.dailySummary().eatenFat);

  constructor() {
    this.loadTodayLog();
  }

  loadTodayLog(): void {
    const profile = this.storageService.profile();
    if (profile && (profile as any).targetCalories) {
      this.targetCalories.set((profile as any).targetCalories);
    }

    const stored = this.getFromStorage<FoodLogItem[]>(FOOD_LOG_STORAGE_KEY, []);
    if (stored && stored.length > 0) {
      this.loggedItems.set(stored);
      return;
    }

    // Standard-Tagesbelegung (1 Banane, 1 Skyr, 2 Eier als Demonstration für Test 1 & Section 4)
    const initialItems: FoodLogItem[] = [
      {
        id: 'log-banana-demo',
        productId: 'netto-bananas-1kg',
        name: 'Bio Banane Fairtrade',
        brand: 'BioBio',
        category: 'fruits_veg',
        imageUrl: 'images/products/bananas.jpg',
        mealType: 'breakfast',
        amountGrams: 120,
        displayQuantity: '1 Banane (ca. 120 g)',
        calories: 107,
        protein: 1.3,
        carbs: 27.4,
        fat: 0.4,
        portionCost: 0.20,
        status: 'eaten',
        loggedAt: new Date().toISOString()
      },
      {
        id: 'log-skyr-demo',
        productId: 'netto-skyr-500',
        name: 'Skyr Natur traditionell',
        brand: 'Gutes Land',
        category: 'dairy',
        imageUrl: 'images/products/skyr.jpg',
        mealType: 'breakfast',
        amountGrams: 150,
        displayQuantity: '1 Portion (150 g)',
        calories: 95,
        protein: 16.5,
        carbs: 6.0,
        fat: 0.3,
        portionCost: 0.42,
        status: 'eaten',
        loggedAt: new Date().toISOString()
      },
      {
        id: 'log-eggs-demo',
        productId: 'netto-eggs-10stk',
        name: 'Frische Eier Klasse M',
        brand: 'Gut Ponholz',
        category: 'dairy',
        imageUrl: 'images/products/oats.jpg',
        mealType: 'lunch',
        amountGrams: 106,
        displayQuantity: '2 Eier (ca. 106 g)',
        calories: 152,
        protein: 13.6,
        carbs: 0.7,
        fat: 10.5,
        portionCost: 0.40,
        status: 'planned',
        loggedAt: new Date().toISOString()
      }
    ];

    this.loggedItems.set(initialItems);
    this.saveTodayLog(initialItems);
  }

  /**
   * Fügt ein einzelnes Netto-Produkt mit einer wählbaren Verzehrmenge direkt zum Tagesplan hinzu.
   */
  addProductToDay(
    product: ProductItem,
    amountGrams: number,
    mealType: MealType = 'snack',
    status: 'planned' | 'eaten' = 'planned'
  ): void {
    const yieldFactor = product.edibleYieldPercent || 1.0;
    const edibleGrams = Math.round(amountGrams * yieldFactor);

    // Kalorien & Makros berechnen
    const factor = edibleGrams / 100;
    const calories = Math.round(product.nutrition.caloriesPer100g * factor);
    const protein = Math.round(product.nutrition.proteinPer100g * factor * 10) / 10;
    const carbs = Math.round(product.nutrition.carbsPer100g * factor * 10) / 10;
    const fat = Math.round(product.nutrition.fatPer100g * factor * 10) / 10;

    // Anteilige Portionskosten berechnen
    let portionCost = 0;
    if (product.price !== null && product.packageWeightGrams > 0) {
      portionCost = Math.round(((product.price / product.packageWeightGrams) * amountGrams) * 100) / 100;
    }

    const newItem: FoodLogItem = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      imageUrl: product.imageUrl,
      mealType,
      amountGrams,
      displayQuantity: `${amountGrams} g (${edibleGrams} g essbar)`,
      calories,
      protein,
      carbs,
      fat,
      portionCost,
      status,
      loggedAt: new Date().toISOString()
    };

    const updated = [newItem, ...this.loggedItems()];
    this.loggedItems.set(updated);
    this.saveTodayLog(updated);
  }

  /**
   * Fügt ein vollständiges Rezept zum Tag hinzu.
   */
  addRecipeToDay(
    recipe: Recipe,
    servings: number = 1,
    mealType: MealType = 'lunch',
    status: 'planned' | 'eaten' = 'planned'
  ): void {
    const calories = Math.round(recipe.calories * servings);
    const protein = Math.round(recipe.protein * servings * 10) / 10;
    const carbs = Math.round(recipe.carbs * servings * 10) / 10;
    const fat = Math.round(recipe.fat * servings * 10) / 10;
    const portionCost = Math.round((recipe.pricePerPortion * servings) * 100) / 100;

    const newItem: FoodLogItem = {
      id: `log-rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipeId: recipe.id,
      name: recipe.title,
      category: 'recipe',
      imageUrl: recipe.imageUrl,
      mealType,
      amountGrams: 350 * servings,
      displayQuantity: `${servings} Portion(en)`,
      calories,
      protein,
      carbs,
      fat,
      portionCost,
      status,
      loggedAt: new Date().toISOString(),
      isRecipe: true
    };

    const updated = [newItem, ...this.loggedItems()];
    this.loggedItems.set(updated);
    this.saveTodayLog(updated);
  }

  logRecipe(
    recipe: Recipe,
    servings: number = 1,
    status: 'planned' | 'eaten' = 'planned',
    calories?: number,
    protein?: number,
    carbs?: number,
    fat?: number
  ): void {
    if (calories !== undefined && protein !== undefined && carbs !== undefined && fat !== undefined) {
      const portionCost = Math.round((recipe.pricePerPortion * servings) * 100) / 100;
      const newItem: FoodLogItem = {
        id: `log-rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        recipeId: recipe.id,
        name: recipe.title,
        category: 'recipe',
        imageUrl: recipe.imageUrl,
        mealType: recipe.mealType || 'lunch',
        amountGrams: 350 * servings,
        displayQuantity: `${servings} Portion(en)`,
        calories,
        protein,
        carbs,
        fat,
        portionCost,
        status,
        loggedAt: new Date().toISOString(),
        isRecipe: true
      };
      const updated = [newItem, ...this.loggedItems()];
      this.loggedItems.set(updated);
      this.saveTodayLog(updated);
    } else {
      this.addRecipeToDay(recipe, servings, recipe.mealType || 'lunch', status);
    }
  }

  /**
   * Wechselt den Status zwischen „Geplant“ und „Tatsächlich gegessen“.
   */
  toggleStatus(id: string): void {
    const updated = this.loggedItems().map(item => {
      if (item.id === id) {
        const newStatus = item.status === 'planned' ? 'eaten' : 'planned';
        return { ...item, status: newStatus as any };
      }
      return item;
    });

    this.loggedItems.set(updated);
    this.saveTodayLog(updated);
  }

  /**
   * Ändert die Verzehrmenge eines Eintrags.
   */
  updateAmount(id: string, newAmountGrams: number, caloriesPer100g: number): void {
    if (newAmountGrams <= 0) {
      this.removeItem(id);
      return;
    }

    const updated = this.loggedItems().map(item => {
      if (item.id === id) {
        const factor = newAmountGrams / 100;
        const newCal = Math.round(caloriesPer100g * factor);
        return {
          ...item,
          amountGrams: newAmountGrams,
          displayQuantity: `${newAmountGrams} g`,
          calories: newCal
        };
      }
      return item;
    });

    this.loggedItems.set(updated);
    this.saveTodayLog(updated);
  }

  /**
   * Entfernt einen Eintrag aus dem Tagesplan.
   */
  removeItem(id: string): void {
    const updated = this.loggedItems().filter(i => i.id !== id);
    this.loggedItems.set(updated);
    this.saveTodayLog(updated);
  }

  private saveTodayLog(items: FoodLogItem[]): void {
    try {
      localStorage.setItem(FOOD_LOG_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }

  private getFromStorage<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }
}
