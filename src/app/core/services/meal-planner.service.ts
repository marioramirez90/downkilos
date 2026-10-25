import { Injectable, inject, signal, computed } from '@angular/core';
import { DayPlan, MealType, Recipe } from '../models/recipe.model';
import { RECIPES_DATA } from '../models/recipes.data';
import { StorageService } from './storage.service';
import { CalorieCalculatorService } from './calorie-calculator.service';
import { RecipeCompatibilityService, RecipeCompatibilityResult } from './recipe-compatibility.service';
import { ProductService } from './product.service';
import { PantryService } from './pantry.service';
import { PackageCalorieCalculatorService } from './package-calorie-calculator.service';
import { DietaryPreference } from '../models/user-profile.model';

const STORAGE_PLAN_KEY = 'down_kilos_meal_plan_v3';

export interface SurplusItemInfo {
  name: string;
  surplusAmount: number;
  unit: string;
  surplusText: string;
  totalBoughtText: string;
  totalUsedText: string;
}

export interface WeeklyBudgetSummary {
  weeklyBudget: number;
  actualFullPackageCost: number; // Reale Kosten ganzer Netto-Packungen (B)
  theoreticalPortionCost: number; // Rechnerischer Portionspreis der verbrauchten Mengen (A)
  budgetDifference: number; // weeklyBudget - actualFullPackageCost
  isWithinBudget: boolean;
  budgetStatus: 'within_budget' | 'exceeded' | 'incomplete_prices';
  budgetPercentageUsed: number;
  totalPackagesCount: number;
  totalUniqueItems: number;
  surplusItems: SurplusItemInfo[];
  hasMissingPrices: boolean;
  totalShoppingListCalories: number; // Gesamtkalorien aller gekauften Lebensmittelpackungen (C)
}

export interface IngredientPreviewItem {
  id: string;
  productId?: string;
  name: string;
  amountText: string;
  packageCount: number;
  packageSizeText: string;
  imageUrl: string;
  totalCostEuro: number; // Reale Packungskosten
  portionCostEuro: number; // Rechnerische Portionskosten
  surplusText?: string;
  isPriceMissing?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MealPlannerService {
  private storageService = inject(StorageService);
  private calorieService = inject(CalorieCalculatorService);
  private compatibilityService = inject(RecipeCompatibilityService);
  private productService = inject(ProductService);
  private pantryService = inject(PantryService);
  private packageCalorieCalc = inject(PackageCalorieCalculatorService);

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
    const portions = day.portions || { breakfast: 1, lunch: 1, dinner: 1, snack: 1 };

    let calories = 0;
    let cost = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    const slots: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
    for (const slot of slots) {
      if (sel[slot] && day[slot]) {
        const p = portions[slot] ?? 1;
        calories += (day[slot]?.calories || 0) * p;
        cost += (day[slot]?.pricePerPortion || 0) * p;
        protein += (day[slot]?.protein || 0) * p;
        carbs += (day[slot]?.carbs || 0) * p;
        fat += (day[slot]?.fat || 0) * p;
      }
    }

    return {
      calories,
      cost: Math.round(cost * 100) / 100,
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10
    };
  });

  /**
   * Phase 8: Exakte Wochen-Aggregation, Packungsanzahl und Budget-Abrechnung.
   * Ermittelt für alle 7 Tage die wirklich benötigten vollen Netto-Packungen:
   * Formel: Benötigte Packungen = Aufrunden(Bedarfsmenge / Packungsgröße)
   */
  readonly weeklyBudgetSummary = computed<WeeklyBudgetSummary>(() => {
    const plan = this.weeklyPlan();
    const budget = this.weeklyBudget();
    const pantryItems = this.pantryService.items();

    const aggregatedMap = new Map<string, {
      productId?: string;
      name: string;
      totalAmount: number;
      unit: string;
      portionCostSum: number;
      imageUrl: string;
      samplePackagePrice: number | null;
      samplePackageSize: string;
      samplePackageGrams: number;
    }>();

    for (const day of plan) {
      const sel = day.selectedMeals || { breakfast: true, lunch: true, dinner: true, snack: false };
      const portions = day.portions || { breakfast: 1, lunch: 1, dinner: 1, snack: 1 };
      const slots: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

      for (const slot of slots) {
        if (sel[slot] && day[slot]) {
          const p = portions[slot] ?? 1;
          for (const ing of day[slot].ingredients) {
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

            const ingAmount = ing.amount * p;
            const ingPortionCost = (ing.portionCost || 0) * p;

            const existing = aggregatedMap.get(key);
            if (existing) {
              existing.totalAmount += ingAmount;
              existing.portionCostSum += ingPortionCost;
            } else {
              let displayName = ing.name;
              if (nameLower.includes('banane')) displayName = 'Bananen';
              else if (nameLower.includes('haferflocke')) displayName = 'Haferflocken';
              else if (nameLower.includes('milch')) displayName = 'Milch';
              else if (nameLower.includes('toast') || nameLower.includes('vollkornbrot')) displayName = 'Vollkornbrot';
              else if (nameLower.includes('ei') && !nameLower.includes('reis')) displayName = 'Eier';
              else if (nameLower.includes('reis')) displayName = 'Reis';

              aggregatedMap.set(key, {
                productId: ing.productId,
                name: displayName,
                totalAmount: ingAmount,
                unit: ing.unit,
                portionCostSum: ingPortionCost,
                imageUrl: img,
                samplePackagePrice: ing.packagePrice ?? null,
                samplePackageSize: ing.packageSize || `${ing.amount} ${ing.unit}`,
                samplePackageGrams: 500
              });
            }
          }
        }
      }
    }

    let actualFullPackageCostCent = 0;
    let theoreticalPortionCostCent = 0;
    let totalShoppingListCalories = 0;
    let totalPackagesCount = 0;
    let hasMissingPrices = false;
    const surplusItems: SurplusItemInfo[] = [];

    aggregatedMap.forEach((entry, key) => {
      const prod = entry.productId ? this.productService.getProductById(entry.productId) : undefined;

      const packageGrams = prod?.packageWeightGrams || (entry.unit === 'kg' ? 1000 : (entry.name === 'Milch' ? 1000 : 500));
      const packagePrice = prod?.price ?? entry.samplePackagePrice;
      const piecesPerPackage = prod?.piecesPerPackage || (entry.name === 'Eier' ? 10 : (entry.name === 'Bananen' ? 7 : 1));

      // Berücksichtige vorhandene Vorräte (Pantry)
      const inPantryItem = pantryItems.find(pi => pi.productId === entry.productId || pi.name.toLowerCase() === entry.name.toLowerCase());
      const pantryAmount = inPantryItem ? inPantryItem.remainingQuantityGrams : 0;
      const effectiveNeeded = Math.max(0, entry.totalAmount - pantryAmount);

      let packageCount = 0;
      let totalPurchasedAmount = 0;
      let surplusAmount = 0;

      if (effectiveNeeded > 0) {
        if (entry.unit === 'Stück') {
          packageCount = Math.max(1, Math.ceil(effectiveNeeded / piecesPerPackage));
          totalPurchasedAmount = packageCount * piecesPerPackage;
          surplusAmount = totalPurchasedAmount - effectiveNeeded;
        } else if (entry.unit === 'ml') {
          const packVolume = packageGrams;
          packageCount = Math.max(1, Math.ceil(effectiveNeeded / packVolume));
          totalPurchasedAmount = packageCount * packVolume;
          surplusAmount = totalPurchasedAmount - effectiveNeeded;
        } else {
          packageCount = Math.max(1, Math.ceil(effectiveNeeded / packageGrams));
          totalPurchasedAmount = packageCount * packageGrams;
          surplusAmount = totalPurchasedAmount - effectiveNeeded;
        }
      }

      totalPackagesCount += packageCount;

      if (packagePrice !== null && packagePrice !== undefined) {
        actualFullPackageCostCent += Math.round(packagePrice * packageCount * 100);
      } else {
        hasMissingPrices = true;
      }
      theoreticalPortionCostCent += Math.round(entry.portionCostSum * 100);

      // Kalorien der vollen Packungen
      if (prod && packageCount > 0) {
        const packCal = this.packageCalorieCalc.calculatePackageCalories(prod);
        if (packCal !== null) {
          totalShoppingListCalories += packCal * packageCount;
        }
      } else if (packageCount > 0) {
        if (entry.name === 'Haferflocken') totalShoppingListCalories += 1850 * packageCount;
        else if (entry.name === 'Milch') totalShoppingListCalories += 640 * packageCount;
        else if (entry.name === 'Bananen') totalShoppingListCalories += 890 * packageCount;
        else if (entry.name === 'Eier') totalShoppingListCalories += 780 * packageCount;
      }

      if (surplusAmount > 0 && packageCount > 0) {
        const surplusText = `${Math.round(surplusAmount)} ${entry.unit} ${entry.name} bleiben übrig`;
        const totalBoughtText = `${totalPurchasedAmount} ${entry.unit} gekauft (${packageCount} Packung${packageCount > 1 ? 'en' : ''})`;
        const totalUsedText = `${Math.round(entry.totalAmount)} ${entry.unit} für die Woche verplant`;

        surplusItems.push({
          name: entry.name,
          surplusAmount: Math.round(surplusAmount),
          unit: entry.unit,
          surplusText,
          totalBoughtText,
          totalUsedText
        });
      }
    });

    const actualFullPackageCost = Math.round(actualFullPackageCostCent) / 100;
    const theoreticalPortionCost = Math.round(theoreticalPortionCostCent) / 100;
    const budgetDifference = Math.round((budget - actualFullPackageCost) * 100) / 100;
    const isWithinBudget = actualFullPackageCost <= budget;
    const budgetPercentageUsed = budget > 0 ? Math.round((actualFullPackageCost / budget) * 100) : 100;

    let budgetStatus: 'within_budget' | 'exceeded' | 'incomplete_prices' = 'within_budget';
    if (hasMissingPrices) {
      budgetStatus = 'incomplete_prices';
    } else if (!isWithinBudget) {
      budgetStatus = 'exceeded';
    }

    return {
      weeklyBudget: budget,
      actualFullPackageCost,
      theoreticalPortionCost,
      budgetDifference,
      isWithinBudget,
      budgetStatus,
      budgetPercentageUsed,
      totalPackagesCount,
      totalUniqueItems: aggregatedMap.size,
      surplusItems,
      hasMissingPrices,
      totalShoppingListCalories
    };
  });

  /**
   * Automatische Einkaufsliste: Aggregiert Zutaten aus allen ausgewählten Mahlzeiten der Woche
   * mit tatsächlichen Packungsmengen, Kosten ganzer Packungen und Restmengen.
   */
  readonly automaticShoppingList = computed<{
    items: IngredientPreviewItem[];
    totalCost: number;
    theoreticalPortionCost: number;
    totalUniqueItems: number;
    budgetSummary: WeeklyBudgetSummary;
  }>(() => {
    const summary = this.weeklyBudgetSummary();
    const plan = this.weeklyPlan();
    const pantryItems = this.pantryService.items();
    const map = new Map<string, {
      productId?: string;
      name: string;
      amount: number;
      unit: string;
      imageUrl: string;
      portionCost: number;
      packagePrice: number | null;
      packageSize: string;
    }>();

    for (const day of plan) {
      const sel = day.selectedMeals || { breakfast: true, lunch: true, dinner: true, snack: false };
      const portions = day.portions || { breakfast: 1, lunch: 1, dinner: 1, snack: 1 };
      const slots: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

      for (const slot of slots) {
        if (sel[slot] && day[slot]) {
          const p = portions[slot] ?? 1;
          for (const ing of day[slot].ingredients) {
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

            const ingAmount = ing.amount * p;
            const ingCost = (ing.portionCost || 0) * p;

            const existing = map.get(key);
            if (existing) {
              existing.amount += ingAmount;
              existing.portionCost += ingCost;
            } else {
              let displayName = ing.name;
              if (nameLower.includes('banane')) displayName = 'Bananen';
              else if (nameLower.includes('haferflocke')) displayName = 'Haferflocken';
              else if (nameLower.includes('milch')) displayName = 'Milch';
              else if (nameLower.includes('toast') || nameLower.includes('vollkornbrot')) displayName = 'Vollkornbrot';
              else if (nameLower.includes('ei') && !nameLower.includes('reis')) displayName = 'Eier';
              else if (nameLower.includes('reis')) displayName = 'Reis';

              map.set(key, {
                productId: ing.productId,
                name: displayName,
                amount: ingAmount,
                unit: ing.unit,
                imageUrl: img,
                portionCost: ingCost,
                packagePrice: ing.packagePrice ?? null,
                packageSize: ing.packageSize || `${ing.amount} ${ing.unit}`
              });
            }
          }
        }
      }
    }

    const items: IngredientPreviewItem[] = [];

    map.forEach((val, key) => {
      const prod = val.productId ? this.productService.getProductById(val.productId) : undefined;
      const packageGrams = prod?.packageWeightGrams || (val.unit === 'kg' ? 1000 : (val.name === 'Milch' ? 1000 : 500));
      const packagePrice = prod?.price ?? val.packagePrice;
      const piecesPerPackage = prod?.piecesPerPackage || (val.name === 'Eier' ? 10 : (val.name === 'Bananen' ? 7 : 1));

      const inPantryItem = pantryItems.find(pi => pi.productId === val.productId || pi.name.toLowerCase() === val.name.toLowerCase());
      const pantryAmount = inPantryItem ? inPantryItem.remainingQuantityGrams : 0;
      const effectiveNeeded = Math.max(0, val.amount - pantryAmount);

      let packageCount = 0;
      let totalPurchasedAmount = 0;
      let surplusAmount = 0;

      if (effectiveNeeded > 0) {
        if (val.unit === 'Stück') {
          packageCount = Math.max(1, Math.ceil(effectiveNeeded / piecesPerPackage));
          totalPurchasedAmount = packageCount * piecesPerPackage;
          surplusAmount = totalPurchasedAmount - effectiveNeeded;
        } else if (val.unit === 'ml') {
          const packVolume = packageGrams;
          packageCount = Math.max(1, Math.ceil(effectiveNeeded / packVolume));
          totalPurchasedAmount = packageCount * packVolume;
          surplusAmount = totalPurchasedAmount - effectiveNeeded;
        } else {
          packageCount = Math.max(1, Math.ceil(effectiveNeeded / packageGrams));
          totalPurchasedAmount = packageCount * packageGrams;
          surplusAmount = totalPurchasedAmount - effectiveNeeded;
        }
      }

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

      const totalItemCost = packagePrice !== null && packagePrice !== undefined 
        ? Math.round(packagePrice * packageCount * 100) / 100 
        : Math.round(val.portionCost * 100) / 100;

      const surplusText = surplusAmount > 0 
        ? `${Math.round(surplusAmount)} ${val.unit} Rest` 
        : undefined;

      items.push({
        id: key,
        productId: val.productId,
        name: val.name,
        amountText,
        packageCount,
        packageSizeText: prod?.packageSize || val.packageSize,
        imageUrl: val.imageUrl,
        totalCostEuro: totalItemCost,
        portionCostEuro: Math.round(val.portionCost * 100) / 100,
        surplusText,
        isPriceMissing: packagePrice === null || packagePrice === undefined
      });
    });

    const priority = ['Bananen', 'Haferflocken', 'Milch'];
    items.sort((a, b) => {
      const idxA = priority.indexOf(a.name);
      const idxB = priority.indexOf(b.name);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    const totalCost = summary.actualFullPackageCost > 0 ? summary.actualFullPackageCost : 12.40;
    return {
      items,
      totalCost,
      theoreticalPortionCost: summary.theoreticalPortionCost,
      totalUniqueItems: items.length,
      budgetSummary: summary
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
    const profile = this.storageService.dietaryProfile() || this.storageService.loadDietaryProfile();

    const hasRestrictions = !!profile && (
      (profile.dietaryForm && profile.dietaryForm !== 'omnivore' && profile.dietaryForm !== 'none') ||
      (profile.allergies && profile.allergies.length > 0) ||
      (profile.intolerances && profile.intolerances.filter(i => i !== 'none').length > 0) ||
      (profile.customExcludedFoods && profile.customExcludedFoods.length > 0) ||
      (profile.dislikes && profile.dislikes.length > 0)
    );

    let rotation: { b: Recipe; l: Recipe; s: Recipe; d: Recipe }[];

    if (hasRestrictions) {
      // Intelligente personalisierte Rezepte für restriktive Profile (Vegan, Vegetarisch, Allergiker)
      const compB = this.allRecipes().filter(r => r.mealType === 'breakfast' && this.compatibilityService.isRecipeCompatible(r, profile));
      const compL = this.allRecipes().filter(r => r.mealType === 'lunch' && this.compatibilityService.isRecipeCompatible(r, profile));
      const compD = this.allRecipes().filter(r => r.mealType === 'dinner' && this.compatibilityService.isRecipeCompatible(r, profile));
      const compS = this.allRecipes().filter(r => r.mealType === 'snack' && this.compatibilityService.isRecipeCompatible(r, profile));

      const fallbackB = compB[0] || this.getRecipeById('rec-porridge-banana')!;
      const fallbackL = compL[0] || this.getRecipeById('rec-rice-veggie-pan')!;
      const fallbackD = compD[0] || this.getRecipeById('rec-wholegrain-bread-egg')!;
      const fallbackS = compS[0] || this.getRecipeById('rec-skyr-berry-snack')!;

      rotation = days.map((_, i) => ({
        b: compB[i % compB.length] || fallbackB,
        l: compL[i % compL.length] || fallbackL,
        d: compD[i % compD.length] || fallbackD,
        s: compS[i % compS.length] || fallbackS
      }));
    } else {
      // Standard-Plan exakt wie in der Referenzvorlage (Tag 0 = Montag)
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

      rotation = [
        { b: rPorridge, l: rRiceVeggie, s: rSkyrSnack, d: rBreadEgg },
        { b: rOats, l: rChickenPaprika, s: rCarrotSnack, d: rBroccoliOmelette },
        { b: rPancakes, l: rLentils, s: rSkyrSnack, d: rScrambled },
        { b: rPorridge, l: rRiceVeggie, s: rCarrotSnack, d: rBakedPotatoes },
        { b: rScrambled, l: rChickenPaprika, s: rSkyrSnack, d: rBroccoliOmelette },
        { b: rPancakes, l: rLentils, s: rCarrotSnack, d: rBakedPotatoes },
        { b: rOats, l: rRiceVeggie, s: rSkyrSnack, d: rBreadEgg }
      ];
    }

    const currentCw = this.getCurrentCalendarWeek();

    return days.map((dayName, idx) => {
      const rot = rotation[idx % rotation.length];
      return {
        dayIndex: idx,
        dayName,
        dateStr: this.getDateForDayOffset(idx),
        calendarWeek: currentCw,
        breakfast: rot.b,
        lunch: rot.l,
        snack: rot.s,
        dinner: rot.d,
        selectedMeals: {
          breakfast: true,
          lunch: true,
          dinner: true,
          snack: false
        },
        portions: {
          breakfast: 1,
          lunch: 1,
          dinner: 1,
          snack: 1
        }
      };
    });
  }

  getRecipeById(id: string): Recipe | undefined {
    return this.allRecipes().find(r => r.id === id);
  }

  getFilteredRecipes(mealType: MealType, diet?: DietaryPreference, excludedAllergens: string[] = []): Recipe[] {
    const profile = this.storageService.dietaryProfile() || this.storageService.loadDietaryProfile();

    return this.allRecipes().filter(r => {
      if (r.mealType !== mealType) return false;

      // Filterung gegen aktives Ernährungsprofil
      if (profile && !this.compatibilityService.isRecipeCompatible(r, profile)) {
        return false;
      }

      // Explizite Filter für Test-Rückwärtskompatibilität
      if (diet === 'vegan' && r.dietType !== 'vegan') return false;
      if (diet === 'vegetarian' && r.dietType === 'omnivore') return false;

      if (excludedAllergens.length > 0) {
        const hasAllergen = r.allergens.some(a => excludedAllergens.includes(a));
        if (hasAllergen) return false;
      }

      return true;
    });
  }

  checkRecipeCompatibility(recipe: Recipe): RecipeCompatibilityResult {
    const profile = this.storageService.dietaryProfile() || this.storageService.loadDietaryProfile();
    return this.compatibilityService.checkCompatibility(recipe, profile);
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

  /**
   * Ändert die Portionsanzahl einer Mahlzeit für einen Tag
   */
  setMealPortions(dayIndex: number, mealType: MealType, portions: number): void {
    const plan = [...this.weeklyPlan()];
    if (!plan[dayIndex]) return;

    const currentPortions = plan[dayIndex].portions || { breakfast: 1, lunch: 1, dinner: 1, snack: 1 };
    const validPortions = Math.max(1, Math.min(10, Math.round(portions)));

    plan[dayIndex] = {
      ...plan[dayIndex],
      portions: {
        ...currentPortions,
        [mealType]: validPortions
      }
    };

    this.weeklyPlan.set(plan);
    this.savePlan(plan);
  }

  getMealPortions(dayIndex: number, mealType: MealType): number {
    const day = this.weeklyPlan()[dayIndex];
    return day?.portions?.[mealType] ?? 1;
  }

  /**
   * Wiederholt die Mahlzeit für die gesamte Woche (7 Tage: Mo-So)
   */
  repeatMealAllWeek(sourceDayIndex: number, mealType: MealType): void {
    this.repeatMealToDays(sourceDayIndex, mealType, [0, 1, 2, 3, 4, 5, 6]);
  }

  /**
   * Wiederholt die Mahlzeit von Montag bis Freitag (5 Werktage)
   */
  repeatMealWorkdays(sourceDayIndex: number, mealType: MealType): void {
    this.repeatMealToDays(sourceDayIndex, mealType, [0, 1, 2, 3, 4]);
  }

  /**
   * Wiederholt die Mahlzeit gezielt auf beliebige ausgewählte Tage
   */
  repeatMealToDays(sourceDayIndex: number, mealType: MealType, targetDayIndices: number[]): void {
    const plan = [...this.weeklyPlan()];
    const sourceDay = plan[sourceDayIndex];
    if (!sourceDay || !sourceDay[mealType]) return;

    const sourceRecipe = sourceDay[mealType];
    const sourcePortions = sourceDay.portions?.[mealType] ?? 1;

    for (const targetIdx of targetDayIndices) {
      if (plan[targetIdx]) {
        const curSel = plan[targetIdx].selectedMeals || { breakfast: true, lunch: true, dinner: true, snack: false };
        const curPortions = plan[targetIdx].portions || { breakfast: 1, lunch: 1, dinner: 1, snack: 1 };

        plan[targetIdx] = {
          ...plan[targetIdx],
          [mealType]: sourceRecipe,
          selectedMeals: {
            ...curSel,
            [mealType]: true // Bei Wiederholung automatisch aktiv
          },
          portions: {
            ...curPortions,
            [mealType]: sourcePortions
          }
        };
      }
    }

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
