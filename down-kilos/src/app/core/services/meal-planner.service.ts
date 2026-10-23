import { Injectable, inject, signal, computed } from '@angular/core';
import { DayPlan, MealType, Recipe } from '../models/recipe.model';
import { RECIPES_DATA } from '../models/recipes.data';
import { StorageService } from './storage.service';
import { DietaryPreference } from '../models/user-profile.model';

const STORAGE_PLAN_KEY = 'down_kilos_meal_plan';

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
    const meals = [day.breakfast, day.lunch, day.snack, day.dinner];
    const calories = meals.reduce((sum, m) => sum + (m?.calories || 0), 0);
    const cost = Math.round(meals.reduce((sum, m) => sum + (m?.pricePerPortion || 0), 0) * 100) / 100;
    const protein = meals.reduce((sum, m) => sum + (m?.protein || 0), 0);
    const carbs = meals.reduce((sum, m) => sum + (m?.carbs || 0), 0);
    const fat = meals.reduce((sum, m) => sum + (m?.fat || 0), 0);

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

    // Default 7-day plan matching Screen 5 from reference
    const days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    const defaultBreakfast = this.getRecipeById('rec-overnight-oats')!;
    const defaultLunch = this.getRecipeById('rec-chicken-bowl')!;
    const defaultSnack = this.getRecipeById('rec-skyr-snack')!;
    const defaultDinner = this.getRecipeById('rec-lentil-curry')!;

    const initialPlan: DayPlan[] = days.map((dayName, idx) => ({
      dayIndex: idx,
      dayName: idx === 0 ? 'Heute' : idx === 1 ? 'Morgen' : dayName,
      dateStr: this.getDateForDayOffset(idx),
      breakfast: defaultBreakfast,
      lunch: defaultLunch,
      snack: defaultSnack,
      dinner: defaultDinner
    }));

    this.weeklyPlan.set(initialPlan);
    this.savePlan(initialPlan);
  }

  getRecipeById(id: string): Recipe | undefined {
    return this.allRecipes().find(r => r.id === id);
  }

  getFilteredRecipes(mealType: MealType, diet?: DietaryPreference, excludedAllergens: string[] = []): Recipe[] {
    return this.allRecipes().filter(r => {
      if (r.mealType !== mealType) return false;
      if (diet === 'vegan' && r.dietType !== 'vegan') return false;
      if (diet === 'vegetarian' && r.dietType === 'omnivore') return false;

      // Exclude allergens
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
