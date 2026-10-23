import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { PackageCalorieCalculatorService } from './package-calorie-calculator.service';
import { ProductItem } from '../models/product.model';

describe('PackageCalorieCalculatorService (Down Kilos 3.0 Tests)', () => {
  let service: PackageCalorieCalculatorService;

  beforeEach(() => {
    service = new PackageCalorieCalculatorService();
  });

  // TEST 1: Toastbrot (500 g, 250 kcal / 100 g -> 1.250 kcal ganze Packung)
  it('Test 1 – Toastbrot: berechnet 1.250 kcal für 500g Packung und 63 kcal für 1 Scheibe', () => {
    const toast: Partial<ProductItem> = {
      name: 'Butter Toastbrot',
      packageSize: '500 g',
      packageWeightGrams: 500,
      piecesPerPackage: 20,
      pieceWeightGrams: 25,
      pieceUnitName: 'Scheibe',
      edibleYieldPercent: 1.0,
      nutrition: {
        caloriesPer100g: 250,
        proteinPer100g: 8.5,
        carbsPer100g: 48.0,
        fatPer100g: 2.2
      }
    };

    const packageCalories = service.calculatePackageCalories(toast);
    expect(packageCalories).toBe(1250);

    const pieceInfo = service.calculatePieceCalories(toast);
    expect(pieceInfo).not.toBeNull();
    expect(pieceInfo?.calories).toBe(63); // 25g * 2.5 = 62.5 -> gerundet 63 kcal
    expect(pieceInfo?.unitName).toBe('Scheibe');
  });

  // TEST 2: Zwei Packungen verdoppeln Packungskalorien und Einkaufskosten
  it('Test 2 – Zwei Packungen: verdoppelt Packungskalorien und Einkaufskosten in Cent', () => {
    const packagePrice = 1.49;
    const packageCalories = 1250;

    const singleItemTotals = service.calculateItemTotals(packagePrice, 1, packageCalories);
    expect(singleItemTotals.totalCostCents).toBe(149);
    expect(singleItemTotals.totalCostEuro).toBe(1.49);
    expect(singleItemTotals.totalCalories).toBe(1250);

    const doubleItemTotals = service.calculateItemTotals(packagePrice, 2, packageCalories);
    expect(doubleItemTotals.totalCostCents).toBe(298);
    expect(doubleItemTotals.totalCostEuro).toBe(2.98);
    expect(doubleItemTotals.totalCalories).toBe(2500);
  });

  // TEST 3: Eier (10er Packung Klasse M, Schale ungenießbar)
  it('Test 3 – Eier: berechnet essbare Kalorien pro Ei, für 2 Eier und für die 10er Packung', () => {
    const eggs: Partial<ProductItem> = {
      name: 'Frische Eier aus Bodenhaltung Klasse M',
      packageSize: '10 Stück',
      packageWeightGrams: 530, // 10 Eier à 53g
      piecesPerPackage: 10,
      pieceWeightGrams: 53,
      pieceUnitName: 'Ei',
      edibleYieldPercent: 0.88, // 12% Eierschale nicht essbar!
      nutrition: {
        caloriesPer100g: 143,
        proteinPer100g: 12.8,
        carbsPer100g: 0.7,
        fatPer100g: 9.9
      }
    };

    // Essbares Gewicht der 10er Packung: 530g * 0.88 = 466.4g
    const edibleGrams = service.calculatePackageEdibleGrams(eggs);
    expect(edibleGrams).toBe(466.4);

    // Gesamte Packung: (466.4 * 143) / 100 = 666.95 -> 667 kcal
    const packageCalories = service.calculatePackageCalories(eggs);
    expect(packageCalories).toBe(667);

    // 1 Ei: (46.64g essbar * 143) / 100 = 66.69 -> 67 kcal
    const pieceInfo = service.calculatePieceCalories(eggs);
    expect(pieceInfo?.calories).toBe(67);
    expect(pieceInfo?.unitName).toBe('Ei');

    // Interaktive Auswahl von 2 Eiern: 2 * 67 = 134 kcal
    const twoEggsCalories = service.calculateCustomAmountCalories(eggs, 2, 'pieces');
    expect(twoEggsCalories).toBe(134);
  });

  // TEST 4: Bohnen / Dosen mit Abtropfgewicht
  it('Test 4 – Bohnen: berücksichtigt Abtropfgewicht 240g statt Brutto-Doseninhalt 400g', () => {
    const kidneyBeans: Partial<ProductItem> = {
      name: 'Bio Kidneybohnen',
      packageSize: '400 g Dose (240 g Abtropfgewicht)',
      packageWeightGrams: 400,
      drainedWeightGrams: 240, // Entscheidendes Abtropfgewicht!
      nutritionBasis: 'drained_weight',
      nutrition: {
        caloriesPer100g: 110, // gilt für abgetropfte Bohnen
        proteinPer100g: 8.5,
        carbsPer100g: 15.0,
        fatPer100g: 0.6
      }
    };

    const edibleGrams = service.calculatePackageEdibleGrams(kidneyBeans);
    expect(edibleGrams).toBe(240); // Genau das Abtropfgewicht, NICHT 400g!

    const packageCalories = service.calculatePackageCalories(kidneyBeans);
    // (240 * 110) / 100 = 264 kcal (nicht fälschlich 400 * 110 / 100 = 440 kcal!)
    expect(packageCalories).toBe(264);
  });

  // TEST 5: Einkaufswagen (Kombination mehrerer Produkte)
  it('Test 5 – Einkaufswagen: berechnet Gesamtkosten in Euro und Gesamtkalorien aller Packungen', () => {
    // Position 1: 1 Packung Toastbrot (1.49 €, 1.250 kcal)
    const item1 = service.calculateItemTotals(1.49, 1, 1250);
    // Position 2: 1 Zehnerpackung Eier (1.99 €, 667 kcal)
    const item2 = service.calculateItemTotals(1.99, 1, 667);
    // Position 3: 2 Dosen Kidneybohnen (2 * 0.89 € = 1.78 €, 2 * 264 = 528 kcal)
    const item3 = service.calculateItemTotals(0.89, 2, 264);

    const totalCents = (item1.totalCostCents || 0) + (item2.totalCostCents || 0) + (item3.totalCostCents || 0);
    const totalEuro = totalCents / 100;
    const totalCalories = (item1.totalCalories || 0) + (item2.totalCalories || 0) + (item3.totalCalories || 0);

    // 149 + 199 + 178 = 526 Cent = 5.26 €
    expect(totalCents).toBe(526);
    expect(totalEuro).toBe(5.26);
    // 1250 + 667 + 528 = 2445 kcal
    expect(totalCalories).toBe(2445);
  });

  // TEST 6: Fehlende Werte (niemals erfundene Zahlen, unvollständig gekennzeichnet)
  it('Test 6 – Fehlende Werte: erfindet keine Werte bei fehlendem Preis oder fehlenden Nährwerten', () => {
    const itemMissingPrice: Partial<ProductItem> = {
      name: 'Unbekanntes Produkt',
      packageWeightGrams: 200,
      price: null,
      nutrition: {
        caloriesPer100g: 100,
        proteinPer100g: 2,
        carbsPer100g: 10,
        fatPer100g: 1
      }
    };

    const calcMissingPrice = service.calculateItemTotals(itemMissingPrice.price ?? null, 1, 200);
    expect(calcMissingPrice.totalCostCents).toBeNull();
    expect(calcMissingPrice.totalCostEuro).toBeNull();
    expect(calcMissingPrice.totalCalories).toBe(200);

    const itemMissingNutrition: Partial<ProductItem> = {
      name: 'Produkt ohne Nährwerte',
      packageWeightGrams: 200,
      price: 2.49,
      nutrition: undefined
    };

    const calories = service.calculatePackageCalories(itemMissingNutrition);
    expect(calories).toBeNull();

    const calcMissingNutrition = service.calculateItemTotals(itemMissingNutrition.price ?? null, 1, calories);
    expect(calcMissingNutrition.totalCostEuro).toBe(2.49);
    expect(calcMissingNutrition.totalCalories).toBeNull();
  });
});
