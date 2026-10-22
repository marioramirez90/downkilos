import { Injectable } from '@angular/core';
import { ActivityLevel, BiologicalGender, UserProfile } from '../models/user-profile.model';
import { CalorieCalculationResult, MacroNutrients, WeightForecast } from '../models/calorie-calculation.model';

@Injectable({
  providedIn: 'root'
})
export class CalorieCalculatorService {
  /**
   * Absolute minimal health boundaries to prevent dangerous crash diets.
   */
  readonly MIN_SAFE_KCAL_FEMALE = 1200;
  readonly MIN_SAFE_KCAL_MALE = 1500;
  readonly DEFAULT_DEFICIT = 300; // Moderate, healthy deficit

  /**
   * Activity Multipliers (PAL - Physical Activity Level)
   */
  readonly ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
    sedentary: 1.2,      // Sitzender Alltag
    light: 1.375,        // 1-3x Sport/Woche
    moderate: 1.55,      // 3-5x Sport/Woche
    very_active: 1.725   // 5+x Sport/Woche
  };

  /**
   * Calculates age in full years from an ISO birthdate string (YYYY-MM-DD).
   */
  calculateAge(birthDateStr: string): number {
    if (!birthDateStr) return 30; // fallback adult age
    const birth = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return Math.max(16, Math.min(120, age));
  }

  /**
   * Basal Metabolic Rate (BMR / Ruheenergieverbrauch) using the Mifflin-St. Jeor equation:
   * Men:   BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) + 5
   * Women: BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) - 161
   */
  calculateBmr(weightKg: number, heightCm: number, ageYears: number, gender: BiologicalGender = 'female'): number {
    const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
    if (gender === 'male') {
      return Math.round(base + 5);
    } else if (gender === 'female') {
      return Math.round(base - 161);
    } else {
      // gender neutral average
      return Math.round(base - 78);
    }
  }

  /**
   * Calculates total daily energy expenditure (TDEE / Erhaltungsbedarf).
   */
  calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
    const multiplier = this.ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
    return Math.round(bmr * multiplier);
  }

  /**
   * Macronutrient split oriented around healthy, balanced weight loss:
   * Protein: ~1.8g per kg body weight (high satiety & muscle preservation)
   * Fat: ~25-30% of total daily energy
   * Carbs: Remaining calories
   */
  calculateMacros(targetKcal: number, weightKg: number): MacroNutrients {
    // Protein: 1.6g to 2.0g per kg (capped at max 35% of calories)
    const rawProteinGrams = Math.round(weightKg * 1.8);
    const proteinKcal = rawProteinGrams * 4;
    const proteinGrams = proteinKcal > targetKcal * 0.35
      ? Math.round((targetKcal * 0.30) / 4)
      : rawProteinGrams;
    const finalProteinKcal = proteinGrams * 4;
    const proteinPercentage = Math.round((finalProteinKcal / targetKcal) * 100);

    // Fat: 28% of total calories (9 kcal/g)
    const fatKcal = Math.round(targetKcal * 0.28);
    const fatGrams = Math.round(fatKcal / 9);
    const fatPercentage = Math.round((fatKcal / targetKcal) * 100);

    // Carbohydrates: remainder
    const carbsKcal = Math.max(0, targetKcal - finalProteinKcal - fatKcal);
    const carbsGrams = Math.round(carbsKcal / 4);
    const carbsPercentage = 100 - proteinPercentage - fatPercentage;

    return {
      proteinGrams,
      proteinKcal: finalProteinKcal,
      proteinPercentage,
      carbsGrams,
      carbsKcal,
      carbsPercentage,
      fatGrams,
      fatKcal,
      fatPercentage
    };
  }

  /**
   * Projected weight progress based on daily caloric deficit.
   * 1 kg body fat ≈ 7.000 kcal.
   */
  calculateForecast(deficitKcal: number): WeightForecast {
    if (deficitKcal <= 0) {
      return {
        weeklyLossKg: 0,
        monthlyLossMinKg: 0,
        monthlyLossMaxKg: 0
      };
    }

    // Weekly loss: (deficit * 7) / 7000
    const weeklyLossKg = Math.round(((deficitKcal * 7) / 7000) * 10) / 10;
    // Monthly loss range: weeklyLoss * 4 to weeklyLoss * 4.5
    const monthlyLossMin = Math.round(weeklyLossKg * 4 * 10) / 10;
    const monthlyLossMax = Math.round(weeklyLossKg * 5 * 10) / 10;

    return {
      weeklyLossKg: weeklyLossKg > 0 ? weeklyLossKg : 0.5,
      monthlyLossMinKg: monthlyLossMin >= 1 ? monthlyLossMin : 2,
      monthlyLossMaxKg: monthlyLossMax >= 2 ? monthlyLossMax : 4
    };
  }

  /**
   * Comprehensive calculation pipeline for a user profile.
   */
  calculate(profile: UserProfile): CalorieCalculationResult {
    const age = this.calculateAge(profile.birthDate);
    const gender = profile.gender || 'female';
    const weight = Math.max(35, profile.currentWeight);
    const height = Math.max(100, profile.height);

    // 1. Calculate BMR
    const bmr = this.calculateBmr(weight, height, age, gender);

    // 2. Calculate TDEE (Erhaltungsbedarf)
    const tdee = this.calculateTdee(bmr, profile.activityLevel);

    // 3. Determine Deficit based on Goal
    let deficit = 0;
    if (profile.goal === 'lose_weight') {
      deficit = this.DEFAULT_DEFICIT; // 300 kcal moderate deficit
    } else if (profile.goal === 'gain_weight') {
      deficit = -300; // Caloric surplus
    } else {
      deficit = 0; // Maintain
    }

    // 4. Calculate Daily Target with Health Guardrails
    let targetKcal = tdee - deficit;
    const safeMin = gender === 'male' ? this.MIN_SAFE_KCAL_MALE : this.MIN_SAFE_KCAL_FEMALE;
    let isUnderSafeMinimum = false;

    if (targetKcal < safeMin) {
      targetKcal = safeMin;
      deficit = tdee - targetKcal;
      isUnderSafeMinimum = true;
    }

    // 5. Calculate Macronutrients
    const macros = this.calculateMacros(targetKcal, weight);

    // 6. Forecast
    const forecast = this.calculateForecast(deficit);

    return {
      bmr,
      tdee,
      deficit,
      dailyTargetKcal: targetKcal,
      macros,
      forecast,
      isUnderSafeMinimum,
      safeMinimumKcal: safeMin,
      calculatedAge: age
    };
  }
}
