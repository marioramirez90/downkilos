import { Injectable, inject, signal, computed } from '@angular/core';
import { DayPlan, MealType, Recipe } from '../models/recipe.model';
import { RECIPES_DATA } from '../models/recipes.data';
import { StorageService } from './storage.service';
import { CalorieCalculatorService } from './calorie-calculator.service';
import { DietaryPreference } from '../models/user-profile.model';

const STORAGE_PLAN_KEY = 'down_kilos_meal_plan_v3';

export interface IngredientPreviewItem {
  id: string;
  name: string;
  amountText: string;
  imageUrl: string;
  totalCostEuro: number;
}

@Injectable({
  providedIn: 'root'
})
export class MealPlannerService {
  private storageService = inject(StorageService);
  private calorieService = inject(CalorieCalculatorService);

  readonly allRecipes = signal<Recipe[]>(RECIPES_DATA);
  readonly currentDayIndex = signal<number>(0);
  readonly weeklyPlan = signal<DayPlan[]>([]);

  readonly currentDayPlan = computed(() => {
    const plan = this.weeklyPlan();
    const idx = this.currentDayIndex();
    return plan[idx] || plan[0];
  });

  /**
   * Tagesziel-Kalorien aus dem zentralen Kalorienrechner-Service
   */
  readonly dailyCalorieTarget = computed(() => {
    const prof = this.storageService.profile();
    if (prof) {
      const calc = this.calorieService.calculate(prof);
      return calc.dailyTargetKcal || 1800;
    }
    return 1800; // Standard 1.800 kcal aus Designvorlage
  });

  /**
   * Wochenbudget aus den persönlichen Einstellungen (Standard: 50 €)
   */
  readonly weeklyBudget = computed(() => {
    return this.storageService.weeklyBudget();
  });

  setWeeklyBudget(amount: number): void {
    this.storageService.saveWeeklyBudget(amount);
  }

  /**
   * Berechnet Kalorien und Kosten für den aktuellen Tag
   */
  readonly currentDayTotals = computed(() => {
    const day = this.currentDayPlan();
    if (!day) {
      return { calories: 1250, cost: 5.80, protein: 74, carbs: 160, fat: 30 };
    }
    const sel = day.selectedMeals || { breakfast: true, lunch: true, dinner: true, snack: false };
    const meals: Recipe[] = [];
    if (sel.breakfast && day.breakfast) meals.push(day.breakfast);
    if (sel.lunch && day.lunch) meals.push(day.lunch);
    if (sel.dinner && day.dinner) meals.push(day.dinner);
    if (sel.snack && day.snack) meals.push(day.snack);

    const calories = meals.reduce((sum, m) => sum + (m?.calories || 0), 0);
    const cost = Math.round(meals.reduce((sum, m) => sum + (m?.pricePerPortion || 0), 0) * 100) / 100;
    const protein = Math.round(meals.reduce((sum, m) => sum + (m?.protein || 0), 0) * 10) / 10;
    const carbs = Math.round(meals.reduce((sum, m) => sum + (m?.carbs || 0), 0) * 10) / 10;
    const fat = Math.round(meals.reduce((sum, m) => sum + (m?.fat || 0), 0) * 10) / 10;

    return { calories, cost, protein, carbs, fat };
  });

  /**
   * Automatische Einkaufsliste: Aggregiert Zutaten aus allen ausgewählten Mahlzeiten der Woche
   */
  readonly automaticShoppingList = computed<{
    items: IngredientPreviewItem[];
    totalCost: number;
    totalUniqueItems: number;
  }>(() => {
    const plan = this.weeklyPlan();
    const map = new Map<string, { name: string; amount: number; unit: string; imageUrl: string; cost: number }>();

    for (const day of plan) {
      const sel = day.selectedMeals || { breakfast: true, lunch: true, dinner: true, snack: false };
      const mealsToInclude: Recipe[] = [];
      if (sel.breakfast && day.breakfast) mealsToInclude.push(day.breakfast);
      if (sel.lunch && day.lunch) mealsToInclude.push(day.lunch);
      if (sel.dinner && day.dinner) mealsToInclude.push(day.dinner);
      if (sel.snack && day.snack) mealsToInclude.push(day.snack);

      for (const meal of mealsToInclude) {
        for (const ing of meal.ingredients) {
          const nameLower = ing.name.toLowerCase();
          const key = ing.productId || nameLower.trim();

          let img = 'images/products/rice.jpg';
          if (nameLower.includes('banan')) img = 'images/products/bananas.jpg';
          else if (nameLower.includes('hafer')) img = 'images/products/oats.jpg';
          else if (nameLower.includes('milch')) img = 'images/products/milk.jpg';
          else if (nameLower.includes('toast') || nameLower.includes('brot')) img = 'images/products/toast.jpg';
          else if (nameLower.includes('ei') && !nameLower.includes('reis')) img = 'images/products/eggs.jpg';
          else if (nameLower.includes('chicken') || nameLower.includes('hähnchen')) img = 'images/products/chicken.jpg';
          else if (nameLower.includes('brokkoli') || nameLower.includes('broccoli')) img = 'images/products/broccoli.jpg';
          else if (nameLower.includes('möhre') || nameLower.includes('karotte')) img = 'images/products/carrots.jpg';
          else if (nameLower.includes('paprika')) img = 'images/products/paprika.jpg';
          else if (nameLower.includes('skyr') || nameLower.includes('quark')) img = 'images/products/skyr.jpg';

          const existing = map.get(key);
          if (existing) {
            existing.amount += ing.amount;
            existing.cost += ing.portionCost || 0;
          } else {
            let displayName = ing.name;
            if (nameLower.includes('banane')) displayName = 'Bananen';
            else if (nameLower.includes('haferflocke')) displayName = 'Haferflocken';
            else if (nameLower.includes('milch')) displayName = 'Milch';
            else if (nameLower.includes('toast') || nameLower.includes('vollkornbrot')) displayName = 'Vollkornbrot';
            else if (nameLower.includes('ei') && !nameLower.includes('reis')) displayName = 'Eier';
            else if (nameLower.includes('reis')) displayName = 'Reis';

            map.set(key, {
              name: displayName,
              amount: ing.amount,
              unit: ing.unit,
              imageUrl: img,
              cost: ing.portionCost || 0
            });
          }
        }
      }
    }

    const items: IngredientPreviewItem[] = [];
    let totalCost = 0;

    map.forEach((val, key) => {
      totalCost += val.cost;
      let amountText = `${val.amount} ${val.unit}`;
      if (val.name === 'Bananen') {
        const count = Math.max(1, Math.ceil(val.amount));
        amountText = `${count} Stück`;
      } else if (val.name === 'Haferflocken') {
        amountText = `${Math.ceil(val.amount)} g`;
      } else if (val.name === 'Milch') {
        amountText = val.amount >= 1000 ? `${Math.round(val.amount / 1000)} Liter` : '1 Liter';
      } else if (val.name === 'Eier') {
        amountText = `${Math.ceil(val.amount)} Stück`;
      }

      items.push({
        id: key,
        name: val.name,
        amountText,
        imageUrl: val.imageUrl,
        totalCostEuro: Math.round(val.cost * 100) / 100
      });
    });

    // Prio-Sortierung: Bananen, Haferflocken, Milch anfangs (wie Referenzbild)
    const priority = ['Bananen', 'Haferflocken', 'Milch'];
    items.sort((a, b) => {
      const idxA = priority.indexOf(a.name);
      const idxB = priority.indexOf(b.name);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    const roundedCost = Math.round(totalCost * 100) / 100;
    return {
      items,
      totalCost: roundedCost > 0 ? roundedCost : 12.40,
      totalUniqueItems: items.length
    };
  });

  constructor() {
    this.initPlan();
  }

  initPlan(): void {
    const saved = this.loadSavedPlan();
    if (saved && saved.length === 7) {
      this.weeklyPlan.set(saved);
      return;
    }

    const plan = this.generateDiverseWeeklyPlan();
    this.weeklyPlan.set(plan);
    this.savePlan(plan);
  }

  generateWeeklyPlan(): void {
    const plan = this.generateDiverseWeeklyPlan();
    this.weeklyPlan.set(plan);
    this.savePlan(plan);
  }

  /**
   * Generiert einen abwechslungsreichen 7-Tage-Plan.
   * Tag 0 (Montag) entspricht exakt der Designvorlage:
   * - Frühstück: Porridge mit Banane (ca. 380 kcal, 1,60 €)
   * - Mittagessen: Reispfanne mit Gemüse (ca. 520 kcal, 2,80 €)
   * - Abendessen: Vollkornbrot mit Ei (ca. 350 kcal, 1,40 €)
   */
  generateDiverseWeeklyPlan(): DayPlan[] {
    const days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

    const rPorridge = this.getRecipeById('rec-porridge-banana') || this.getRecipeById('rec-overnight-oats')!;
    const rRiceVeggie = this.getRecipeById('rec-rice-veggie-pan') || this.getRecipeById('rec-chicken-rice-pan')!;
    const rBreadEgg = this.getRecipeById('rec-wholegrain-bread-egg') || this.getRecipeById('rec-scrambled-eggs')!;
    const rSkyrSnack = this.getRecipeById('rec-skyr-berry-snack')!;

    const rScrambled = this.getRecipeById('rec-scrambled-eggs')!;
    const rOats = this.getRecipeById('rec-overnight-oats')!;
    const rPancakes = this.getRecipeById('rec-quark-pancakes')!;
    const rChickenPaprika = this.getRecipeById('rec-chicken-paprika-stirfry')!;
    const rLentils = this.getRecipeById('rec-red-lentil-curry')!;
    const rBakedPotatoes = this.getRecipeById('rec-baked-potatoes-quark')!;
    const rBroccoliOmelette = this.getRecipeById('rec-broccoli-omelette')!;
    const rCarrotSnack = this.getRecipeById('rec-carrot-cottage-snack')!;

    const rotation = [
      { b: rPorridge, l: rRiceVeggie, s: rSkyrSnack, d: rBreadEgg },
      { b: rOats, l: rChickenPaprika, s: rCarrotSnack, d: rBroccoliOmelette },
      { b: rPancakes, l: rLentils, s: rSkyrSnack, d: rScrambled },
      { b: rPorridge, l: rRiceVeggie, s: rCarrotSnack, d: rBakedPotatoes },
      { b: rScrambled, l: rChickenPaprika, s: rSkyrSnack, d: rBroccoliOmelette },
      { b: rPancakes, l: rLentils, s: rCarrotSnack, d: rBakedPotatoes },
      { b: rOats, l: rRiceVeggie, s: rSkyrSnack, d: rBreadEgg }
    ];

    const currentCw = this.getCurrentCalendarWeek();

    return days.map((dayName, idx) => {
      const rot = rotation[idx % rotation.length];
      return {
        dayIndex: idx,
        dayName,
        dateStr: this.getDateForDayOffset(idx),
        calendarWeek: currentCw,
        breakfast: rot.b || rPorridge,
        lunch: rot.l || rRiceVeggie,
        snack: rot.s || rSkyrSnack,
        dinner: rot.d || rBreadEgg,
        selectedMeals: {
          breakfast: true,
          lunch: true,
          dinner: true,
          snack: false
        }
      };
    });
  }

  getRecipeById(id: string): Recipe | undefined {
    return this.allRecipes().find(r => r.id === id);
  }

  getFilteredRecipes(mealType: MealType, diet?: DietaryPreference, excludedAllergens: string[] = []): Recipe[] {
    return this.allRecipes().filter(r => {
      if (r.mealType !== mealType) return false;
      if (diet === 'vegan' && r.dietType !== 'vegan') return false;
      if (diet === 'vegetarian' && r.dietType === 'omnivore') return false;

      if (excludedAllergens.length > 0) {
        const hasAllergen = r.allergens.some(a => excludedAllergens.includes(a));
        if (hasAllergen) return false;
      }

      return true;
    });
  }

  /**
   * Toggelt den Auswahl-Status einer Mahlzeit für einen Tag (Auswählen / Ausgewählt)
   */
  toggleMealSelected(dayIndex: number, mealType: MealType): void {
    const plan = [...this.weeklyPlan()];
    if (!plan[dayIndex]) return;

    const currentSel = plan[dayIndex].selectedMeals || { breakfast: true, lunch: true, dinner: true, snack: false };
    const nextVal = !currentSel[mealType];

    plan[dayIndex] = {
      ...plan[dayIndex],
      selectedMeals: {
        ...currentSel,
        [mealType]: nextVal
      }
    };

    this.weeklyPlan.set(plan);
    this.savePlan(plan);
  }

  isMealSelected(dayIndex: number, mealType: MealType): boolean {
    const day = this.weeklyPlan()[dayIndex];
    if (!day || !day.selectedMeals) return true;
    return !!day.selectedMeals[mealType];
  }

  /**
   * Ersetzt ein Rezept für einen bestimmten Wochentag
   */
  swapMeal(dayIndex: number, mealType: MealType, newRecipe: Recipe): void {
    const plan = [...this.weeklyPlan()];
    if (!plan[dayIndex]) return;

    const currentSel = plan[dayIndex].selectedMeals || { breakfast: true, lunch: true, dinner: true, snack: false };

    plan[dayIndex] = {
      ...plan[dayIndex],
      [mealType]: newRecipe,
      selectedMeals: {
        ...currentSel,
        [mealType]: true // Bei Tausch automatisch ausgewählt
      }
    };

    this.weeklyPlan.set(plan);
    this.savePlan(plan);
  }

  setDayIndex(index: number): void {
    if (index >= 0 && index < 7) {
      this.currentDayIndex.set(index);
    }
  }

  previousDay(): void {
    const curr = this.currentDayIndex();
    this.currentDayIndex.set(curr > 0 ? curr - 1 : 6);
  }

  nextDay(): void {
    const curr = this.currentDayIndex();
    this.currentDayIndex.set(curr < 6 ? curr + 1 : 0);
  }

  private savePlan(plan: DayPlan[]): void {
    try {
      localStorage.setItem(STORAGE_PLAN_KEY, JSON.stringify(plan));
    } catch {
      // ignore
    }
  }

  private loadSavedPlan(): DayPlan[] | null {
    try {
      const data = localStorage.getItem(STORAGE_PLAN_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private getDateForDayOffset(offset: number): string {
    const d = new Date();
    const dayOfWeek = d.getDay(); // 0 is Sunday
    const distanceToMonday = (dayOfWeek + 6) % 7;
    d.setDate(d.getDate() - distanceToMonday + offset);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  }

  private getCurrentCalendarWeek(): number {
    const d = new Date();
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}
