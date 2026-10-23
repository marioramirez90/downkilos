import { Injectable } from '@angular/core';
import { ProductItem } from '../models/product.model';

export interface PieceCalorieInfo {
  calories: number;
  pieceWeightGrams: number;
  unitName: string;
  isEstimated?: boolean;
}

export interface ServingCalorieInfo {
  calories: number;
  servingGrams: number;
  servingUnit: string;
}

export interface ItemTotalsCalculation {
  totalCostCents: number | null;
  totalCostEuro: number | null;
  packageCalories: number | null;
  totalCalories: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class PackageCalorieCalculatorService {
  /**
   * Berechnet das tatsächlich essbare Nettogewicht der Packung in Gramm:
   * - Bei Konserven mit Abtropfgewicht (z.B. Kidneybohnen, Kichererbsen, Mais) gilt das Abtropfgewicht.
   * - Bei Lebensmitteln mit ungenießbaren Teilen (z.B. Eierschale 12%, Bananenschale 32%) wird der essbare Anteil angewandt.
   * - Bei Standardware (Skyr, Haferflocken, Fleisch) gilt das volle Packungsgewicht (100% essbar).
   */
  calculatePackageEdibleGrams(product: Partial<ProductItem>): number {
    if (!product) return 0;

    // 1. Konserven mit Abtropfgewicht (Abtropfgewicht hat Vorrang, wenn Nährwerte darauf basieren)
    if (product.drainedWeightGrams && product.drainedWeightGrams > 0) {
      return product.drainedWeightGrams;
    }

    const packageGrams = product.packageWeightGrams || 0;

    // 2. Essbarer Anteil bei Schalen/Knochen (z.B. 0.88 bei Eiern, 0.68 bei Bananen)
    if (product.edibleYieldPercent !== undefined && product.edibleYieldPercent !== null) {
      const yieldFactor = product.edibleYieldPercent > 1 
        ? product.edibleYieldPercent / 100 
        : product.edibleYieldPercent;
      return Math.round(packageGrams * yieldFactor * 10) / 10;
    }

    return packageGrams;
  }

  /**
   * Berechnet die Kalorien der VOLLSTÄNDIGEN essbaren Packungsmenge:
   * Formel: Kalorien pro 100 g × essbare Packungsmenge in g / 100.
   * Gibt `null` zurück, wenn Nährwertdaten fehlen (niemals erfundene Werte!).
   */
  calculatePackageCalories(product: Partial<ProductItem>): number | null {
    if (!product || !product.nutrition || product.nutrition.caloriesPer100g === undefined || product.nutrition.caloriesPer100g === null) {
      return null;
    }

    const edibleGrams = this.calculatePackageEdibleGrams(product);
    if (edibleGrams <= 0) return 0;

    return Math.round((edibleGrams * product.nutrition.caloriesPer100g) / 100);
  }

  /**
   * Berechnet die Kalorien eines einzelnen Stücks (z.B. 1 Scheibe Toast, 1 Ei):
   * Gibt `null` zurück, wenn Stückanzahl und Stückgewicht nicht belegt sind (keine Fantasiewerte!).
   */
  calculatePieceCalories(product: Partial<ProductItem>): PieceCalorieInfo | null {
    if (!product || !product.nutrition || product.nutrition.caloriesPer100g === undefined || product.nutrition.caloriesPer100g === null) {
      return null;
    }

    const unitName = product.pieceUnitName || 'Stück';

    // Fall A: Feste Stückanzahl in der Packung bekannt (z.B. 20 Scheiben Toast, 10 Eier)
    if (product.piecesPerPackage && product.piecesPerPackage > 0) {
      const totalEdibleGrams = this.calculatePackageEdibleGrams(product);
      const pieceEdibleGrams = totalEdibleGrams / product.piecesPerPackage;
      const calories = Math.round((pieceEdibleGrams * product.nutrition.caloriesPer100g) / 100);
      const pieceWeightGrams = product.pieceWeightGrams || Math.round((product.packageWeightGrams || 0) / product.piecesPerPackage);

      return {
        calories,
        pieceWeightGrams,
        unitName,
        isEstimated: false
      };
    }

    // Fall B: Einzelnes Stückgewicht bekannt (z.B. Apfel ~ 140g brutto)
    if (product.pieceWeightGrams && product.pieceWeightGrams > 0) {
      const yieldFactor = (product.edibleYieldPercent !== undefined && product.edibleYieldPercent !== null)
        ? (product.edibleYieldPercent > 1 ? product.edibleYieldPercent / 100 : product.edibleYieldPercent)
        : 1.0;
      const pieceEdibleGrams = product.pieceWeightGrams * yieldFactor;
      const calories = Math.round((pieceEdibleGrams * product.nutrition.caloriesPer100g) / 100);

      return {
        calories,
        pieceWeightGrams: product.pieceWeightGrams,
        unitName,
        isEstimated: true
      };
    }

    return null;
  }

  /**
   * Berechnet Kalorien einer üblichen Standardportion (falls definiert)
   */
  calculateServingCalories(product: Partial<ProductItem>): ServingCalorieInfo | null {
    if (!product || !product.nutrition || product.nutrition.caloriesPer100g === undefined || product.nutrition.caloriesPer100g === null) {
      return null;
    }

    if (product.servingSizeGrams && product.servingSizeGrams > 0) {
      const yieldFactor = (product.edibleYieldPercent !== undefined && product.edibleYieldPercent !== null)
        ? (product.edibleYieldPercent > 1 ? product.edibleYieldPercent / 100 : product.edibleYieldPercent)
        : 1.0;
      const edibleGrams = product.servingSizeGrams * yieldFactor;
      const calories = Math.round((edibleGrams * product.nutrition.caloriesPer100g) / 100);

      return {
        calories,
        servingGrams: product.servingSizeGrams,
        servingUnit: product.servingUnit || '1 Portion'
      };
    }

    return null;
  }

  /**
   * Berechnet Kalorien für eine interaktiv gewählte Menge (Stück, Gramm oder ganze Packungen)
   */
  calculateCustomAmountCalories(
    product: Partial<ProductItem>,
    amount: number,
    mode: 'grams' | 'pieces' | 'packages'
  ): number | null {
    if (!product || !product.nutrition || product.nutrition.caloriesPer100g === undefined || product.nutrition.caloriesPer100g === null || amount <= 0) {
      return null;
    }

    if (mode === 'packages') {
      const packageCal = this.calculatePackageCalories(product);
      return packageCal !== null ? Math.round(packageCal * amount) : null;
    }

    if (mode === 'pieces') {
      const pieceInfo = this.calculatePieceCalories(product);
      if (pieceInfo) {
        return Math.round(pieceInfo.calories * amount);
      }
      return null;
    }

    // mode === 'grams'
    const yieldFactor = (product.edibleYieldPercent !== undefined && product.edibleYieldPercent !== null)
      ? (product.edibleYieldPercent > 1 ? product.edibleYieldPercent / 100 : product.edibleYieldPercent)
      : 1.0;
    const edibleGrams = amount * yieldFactor;
    return Math.round((edibleGrams * product.nutrition.caloriesPer100g) / 100);
  }

  /**
   * Berechnet Gesamtkosten (in Cent zur Vermeidung von Rundungsfehlern) und Gesamtkalorien
   * für eine Einkaufslisten-Position bei gegebener Packungsanzahl.
   */
  calculateItemTotals(
    packagePrice: number | null,
    packageCount: number,
    packageCalories: number | null
  ): ItemTotalsCalculation {
    const safeCount = Math.max(1, Math.round(packageCount));

    let totalCostCents: number | null = null;
    let totalCostEuro: number | null = null;

    if (packagePrice !== null && packagePrice !== undefined) {
      const priceInCents = Math.round(packagePrice * 100);
      totalCostCents = priceInCents * safeCount;
      totalCostEuro = totalCostCents / 100;
    }

    const totalCalories = packageCalories !== null && packageCalories !== undefined
      ? packageCalories * safeCount
      : null;

    return {
      totalCostCents,
      totalCostEuro,
      packageCalories,
      totalCalories
    };
  }
}
