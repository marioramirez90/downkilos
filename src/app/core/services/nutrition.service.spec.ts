import { TestBed } from '@angular/core/testing';
import { NutritionService } from './nutrition.service';
import { NutritionInfo } from '../models/product.model';

describe('NutritionService', () => {
  let service: NutritionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NutritionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should calculate nutrition proportionally for gram amounts', () => {
    const chickenPer100g: NutritionInfo = {
      caloriesPer100g: 106,
      proteinPer100g: 23.5,
      carbsPer100g: 0,
      fatPer100g: 1.2
    };

    // 200g portion
    const result200g = service.calculateNutritionForAmount(chickenPer100g, 200);
    expect(result200g.caloriesPer100g).toBe(212);
    expect(result200g.proteinPer100g).toBe(47);
    expect(result200g.fatPer100g).toBe(2.4);
  });

  it('should sum multiple ingredient nutrition totals', () => {
    const items = [
      {
        nutrition: { caloriesPer100g: 372, proteinPer100g: 13.5, carbsPer100g: 58.7, fatPer100g: 7.0 },
        amountGrams: 50 // Oats: 186 kcal
      },
      {
        nutrition: { caloriesPer100g: 63, proteinPer100g: 11.0, carbsPer100g: 4.0, fatPer100g: 0.2 },
        amountGrams: 200 // Skyr: 126 kcal
      }
    ];

    const sum = service.sumNutrition(items);
    expect(sum.calories).toBe(312);
    expect(sum.protein).toBeCloseTo(28.8, 1);
  });
});
