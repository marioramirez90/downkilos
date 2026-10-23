import { Injectable, inject } from '@angular/core';
import { Recipe, RecipeIngredient, RecipeCostBreakdown } from '../models/recipe.model';
import { ProductService } from './product.service';

export interface ScaledRecipeResult {
  recipe: Recipe;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  costBreakdown: RecipeCostBreakdown;
  scaledIngredients: Array<RecipeIngredient & {
    scaledAmount: number;
    surplusGrams: number; // Übrigbleibende Restmenge aus den gekauften Packungen
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class RecipeCalculationService {
  private productService = inject(ProductService);

  /**
   * Berechnet exakt Nährwerte, Portionskosten und vollständige Netto-Einkaufskosten
   * für eine frei wählbare Portionsanzahl.
   */
  scaleRecipe(recipe: Recipe, targetServings: number = 1): ScaledRecipeResult {
    const safeServings = Math.max(1, Math.round(targetServings));
    const factor = safeServings / (recipe.defaultServings || 1);

    const calories = Math.round(recipe.calories * factor);
    const protein = Math.round(recipe.protein * factor * 10) / 10;
    const carbs = Math.round(recipe.carbs * factor * 10) / 10;
    const fat = Math.round(recipe.fat * factor * 10) / 10;

    let totalPortionCostCent = 0;
    let totalFullPackageCostCent = 0;
    let packagesCount = 0;

    const scaledIngredients = recipe.ingredients.map(ing => {
      const scaledAmount = Math.round(ing.amount * factor * 10) / 10;
      
      // Netto-Produkt zur Ermittlung des echten Packungspreises abrufen
      const product = ing.productId ? this.productService.getProductById(ing.productId) : undefined;
      const packageGrams = product?.packageWeightGrams || 500;
      const packagePrice = product?.price ?? ing.packagePrice ?? null;

      // 1. Rechnerischer Portionspreis der verbrauchten Menge
      let ingPortionCost = 0;
      if (packagePrice !== null && packageGrams > 0) {
        ingPortionCost = Math.round(((packagePrice / packageGrams) * scaledAmount) * 100) / 100;
      } else {
        ingPortionCost = Math.round((ing.portionCost * factor) * 100) / 100;
      }
      totalPortionCostCent += Math.round(ingPortionCost * 100);

      // 2. Tatsächlich zu kaufende ganze Packungen
      let packagesNeeded = 0;
      let surplusGrams = 0;
      if (packagePrice !== null && packageGrams > 0) {
        packagesNeeded = Math.ceil(scaledAmount / packageGrams);
        if (packagesNeeded > 0) {
          totalFullPackageCostCent += Math.round((packagePrice * packagesNeeded) * 100);
          packagesCount += packagesNeeded;
          surplusGrams = Math.round((packagesNeeded * packageGrams) - scaledAmount);
        }
      }

      return {
        ...ing,
        scaledAmount,
        portionCost: ingPortionCost,
        packageSize: product?.packageSize || ing.packageSize,
        packagePrice: packagePrice,
        packagesNeeded,
        surplusGrams
      };
    });

    const costBreakdown: RecipeCostBreakdown = {
      portionCost: Math.round(totalPortionCostCent) / 100,
      fullPackageCost: Math.round(totalFullPackageCostCent) / 100,
      packagesCount
    };

    return {
      recipe,
      servings: safeServings,
      calories,
      protein,
      carbs,
      fat,
      costBreakdown,
      scaledIngredients
    };
  }

  /**
   * Berechnet den essbaren Anteil eines Lebensmittels (z.B. Banane mit Schale).
   */
  calculateEdibleAmount(grossGrams: number, yieldPercent: number = 1.0): {
    grossGrams: number;
    edibleGrams: number;
    wasteGrams: number;
  } {
    const safeGross = Math.max(0, grossGrams);
    const safeYield = Math.min(1.0, Math.max(0.1, yieldPercent));
    const edibleGrams = Math.round(safeGross * safeYield);
    const wasteGrams = safeGross - edibleGrams;

    return {
      grossGrams: safeGross,
      edibleGrams,
      wasteGrams
    };
  }
}
