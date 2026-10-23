import { Injectable } from '@angular/core';
import { NutritionInfo } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class NutritionService {
  calculateNutritionForAmount(nutritionPer100g: NutritionInfo, amountGrams: number): NutritionInfo {
    const factor = amountGrams / 100;
    return {
      caloriesPer100g: Math.round(nutritionPer100g.caloriesPer100g * factor),
      proteinPer100g: Math.round(nutritionPer100g.proteinPer100g * factor * 10) / 10,
      carbsPer100g: Math.round(nutritionPer100g.carbsPer100g * factor * 10) / 10,
      fatPer100g: Math.round(nutritionPer100g.fatPer100g * factor * 10) / 10,
      fiberPer100g: nutritionPer100g.fiberPer100g
        ? Math.round(nutritionPer100g.fiberPer100g * factor * 10) / 10
        : undefined
    };
  }

  sumNutrition(items: { nutrition: NutritionInfo; amountGrams: number }[]): {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    for (const item of items) {
      const calc = this.calculateNutritionForAmount(item.nutrition, item.amountGrams);
      totalCalories += calc.caloriesPer100g;
      totalProtein += calc.proteinPer100g;
      totalCarbs += calc.carbsPer100g;
      totalFat += calc.fatPer100g;
    }

    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10
    };
  }
}
