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

export interface CartDurationPlan {
  totalCalories: number;
  dailyCalorieTarget: number;
  plannedDays: number;
  averageCaloriesPerDay: number;
  differencePerDay: number;
  status: 'optimal' | 'exceeds' | 'deficit' | 'too_low';
  feedbackMessage: string;
  recommendedDays: number;
  perishabilityTips: string[];
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

  /**
   * Berechnet, wie lange der Einkauf für ein Kalorienziel reicht (Down Kilos Master-Prompt V4.0)
   * und gibt eine fundierte, ernährungsphysiologisch neutrale Rückmeldung.
   */
  calculateCartDuration(
    totalCalories: number,
    dailyCalorieTarget: number,
    plannedDays: number
  ): CartDurationPlan {
    const safeDays = Math.max(1, Math.min(14, Math.round(plannedDays)));
    const safeTarget = Math.max(800, dailyCalorieTarget || 2000);
    const averageCaloriesPerDay = Math.round(totalCalories / safeDays);
    const differencePerDay = averageCaloriesPerDay - safeTarget;

    const recommendedDays = Math.max(1, Math.round(totalCalories / safeTarget));

    let status: 'optimal' | 'exceeds' | 'deficit' | 'too_low';
    let feedbackMessage: string;

    if (averageCaloriesPerDay < 1200) {
      status = 'too_low';
      feedbackMessage = `Achtung: Bei ${safeDays} Tagen beträgt der Durchschnitt nur ${averageCaloriesPerDay} kcal/Tag. Das liegt unter einer gesunden Mindestzufuhr von 1.200 kcal. Plane weniger Tage ein oder ergänze nahrhafte Grundlebensmittel.`;
    } else if (differencePerDay > 150) {
      status = 'exceeds';
      feedbackMessage = `Bei ${safeDays} Tagen liegt die geplante Zufuhr bei ${averageCaloriesPerDay} kcal/Tag (+${differencePerDay} kcal über deinem Tagesziel). Tipp: Verteile den Einkauf auf ${recommendedDays} Tage oder passe Portionsgrößen an.`;
    } else if (differencePerDay < -250) {
      status = 'deficit';
      feedbackMessage = `Bei ${safeDays} Tagen hast du durchschnittlich ${averageCaloriesPerDay} kcal/Tag (${Math.abs(differencePerDay)} kcal unter Tagesziel). Dies entspricht einem moderaten Kaloriendefizit.`;
    } else {
      status = 'optimal';
      feedbackMessage = `Perfekt ausgewogen! Dein Einkauf reicht ideal für ${safeDays} Tage und entspricht exakt deinem täglichen Kalorienziel von ${safeTarget} kcal.`;
    }

    const perishabilityTips = [
      'Frische Fleisch- und Geflügelprodukte (z.B. Hähnchen) an Tag 1 bis 2 verzehren oder einfrieren.',
      'Frisches Obst wie Bananen trocken und getrennt von Äpfeln lagern, um vorzeitige Reife zu vermeiden.',
      'Brot und Toast stets luftdicht verschließen oder portionsweise einfrieren.',
      'Konserven (z.B. Kidneybohnen) und Getreide (Haferflocken, Reis) sind monatelang haltbar.'
    ];

    return {
      totalCalories,
      dailyCalorieTarget: safeTarget,
      plannedDays: safeDays,
      averageCaloriesPerDay,
      differencePerDay,
      status,
      feedbackMessage,
      recommendedDays,
      perishabilityTips
    };
  }
}
