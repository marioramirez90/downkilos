import { Injectable, inject, signal, computed } from '@angular/core';
import { DayPlan, MealType, Recipe } from '../models/recipe.model';
import { RECIPES_DATA } from '../models/recipes.data';
import { StorageService } from './storage.service';
import { DietaryPreference } from '../models/user-profile.model';

const STORAGE_PLAN_KEY = 'down_kilos_meal_plan_v2';

@Injectable({
  providedIn: 'root'
})
export class MealPlannerService {
  private storageService = inject(StorageService);

  readonly allRecipes = signal<Recipe[]>(RECIPES_DATA);
  readonly currentDayIndex = signal<number>(0);
  readonly weeklyPlan = signal<DayPlan[]>([]);

  readonly currentDayPlan = computed(() => {
    const plan = this.weeklyPlan();
    const idx = this.currentDayIndex();
    return plan[idx] || plan[0];
  });

  readonly currentDayTotals = computed(() => {
    const day = this.currentDayPlan();
    if (!day) {
      return { calories: 1800, cost: 6.40, protein: 120, carbs: 228, fat: 48 };
    }
    const meals = [day.breakfast, day.lunch, day.snack, day.dinner].filter(Boolean);
    const calories = meals.reduce((sum, m) => sum + (m?.calories || 0), 0);
    const cost = Math.round(meals.reduce((sum, m) => sum + (m?.pricePerPortion || 0), 0) * 100) / 100;
    const protein = Math.round(meals.reduce((sum, m) => sum + (m?.protein || 0), 0) * 10) / 10;
    const carbs = Math.round(meals.reduce((sum, m) => sum + (m?.carbs || 0), 0) * 10) / 10;
    const fat = Math.round(meals.reduce((sum, m) => sum + (m?.fat || 0), 0) * 10) / 10;

    return { calories, cost, protein, carbs, fat };
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
   * Generiert einen abwechslungsreichen 7-Tage-Plan ohne ständige Wiederholungen.
   * Berücksichtigt gezielt Resteverwertung (z.B. Hähnchenreste am Folgetag).
   */
  generateDiverseWeeklyPlan(): DayPlan[] {
    const days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    
    // Abwechslungsreiche Rezeptauswahl
    const rScrambled = this.getRecipeById('rec-scrambled-eggs')!;
    const rOats = this.getRecipeById('rec-overnight-oats')!;
    const rPancakes = this.getRecipeById('rec-quark-pancakes')!;

    const rChickenRice = this.getRecipeById('rec-chicken-rice-pan')!;
    const rChickenPaprika = this.getRecipeById('rec-chicken-paprika-stirfry')!;
    const rLentils = this.getRecipeById('rec-red-lentil-curry')!;

    const rBakedPotatoes = this.getRecipeById('rec-baked-potatoes-quark')!;
    const rBroccoliOmelette = this.getRecipeById('rec-broccoli-omelette')!;

    const rSkyrSnack = this.getRecipeById('rec-skyr-berry-snack')!;
    const rCarrotSnack = this.getRecipeById('rec-carrot-cottage-snack')!;

    const rotation = [
      { b: rScrambled, l: rChickenRice, s: rSkyrSnack, d: rBakedPotatoes },
      { b: rOats, l: rChickenPaprika, s: rCarrotSnack, d: rBroccoliOmelette },
      { b: rPancakes, l: rLentils, s: rSkyrSnack, d: rScrambled },
      { b: rOats, l: rChickenRice, s: rCarrotSnack, d: rBakedPotatoes },
      { b: rScrambled, l: rChickenPaprika, s: rSkyrSnack, d: rBroccoliOmelette },
      { b: rPancakes, l: rLentils, s: rCarrotSnack, d: rBakedPotatoes },
      { b: rOats, l: rChickenRice, s: rSkyrSnack, d: rBroccoliOmelette }
    ];

    return days.map((dayName, idx) => {
      const rot = rotation[idx % rotation.length];
      return {
        dayIndex: idx,
        dayName: idx === 0 ? 'Heute' : idx === 1 ? 'Morgen' : dayName,
        dateStr: this.getDateForDayOffset(idx),
        breakfast: rot.b || rScrambled,
        lunch: rot.l || rChickenRice,
        snack: rot.s || rSkyrSnack,
        dinner: rot.d || rBakedPotatoes
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

      // Allergene ausschließen
      if (excludedAllergens.length > 0) {
        const hasAllergen = r.allergens.some(a => excludedAllergens.includes(a));
        if (hasAllergen) return false;
      }

      return true;
    });
  }

  swapMeal(dayIndex: number, mealType: MealType, newRecipe: Recipe): void {
    const plan = [...this.weeklyPlan()];
    if (!plan[dayIndex]) return;

    plan[dayIndex] = {
      ...plan[dayIndex],
      [mealType]: newRecipe
    };

    this.weeklyPlan.set(plan);
    this.savePlan(plan);
  }

  setDayIndex(index: number): void {
    if (index >= 0 && index < 7) {
      this.currentDayIndex.set(index);
    }
  }

  regeneratePlan(): void {
    const newPlan = this.generateDiverseWeeklyPlan();
    this.weeklyPlan.set(newPlan);
    this.savePlan(newPlan);
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
    d.setDate(d.getDate() + offset);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  }
}
