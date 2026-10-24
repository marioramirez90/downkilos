import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ProductValidatorService } from './product-validator.service';
import { classifyProductCategory, getProductServingDetail } from './product-classifier.util';
import { ProductItem } from '../models/product.model';

describe('ProductValidatorService & ProductClassifierUtil', () => {
  let service: ProductValidatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProductValidatorService]
    });
    service = TestBed.inject(ProductValidatorService);
  });

  describe('Category Classification (Bug 4)', () => {
    it('should classify Haferdrink as plant_drinks, NOT snacks', () => {
      const cat = classifyProductCategory({ name: 'Bio Haferdrink Natur 1L' });
      expect(cat).toBe('plant_drinks');
    });

    it('should classify Nudeln & Spaghetti as pasta_rice, NOT eggs', () => {
      const cat1 = classifyProductCategory({ name: 'Spaghetti No. 5 500g' });
      const cat2 = classifyProductCategory({ name: 'Penne Rigate Hartweizengrieß 500g' });
      expect(cat1).toBe('pasta_rice');
      expect(cat2).toBe('pasta_rice');
    });

    it('should NOT classify Weizenbrot or Fleisch as eggs just because of "ei"', () => {
      const catBread = classifyProductCategory({ name: 'Weizenmischbrot 500g' });
      const catMeat = classifyProductCategory({ name: 'Fleischkäse fein 200g' });
      expect(catBread).toBe('bakery');
      expect(catMeat).toBe('meat_sausage');
    });

    it('should classify genuine eggs as eggs', () => {
      const cat = classifyProductCategory({ name: '10 frische Eier Bodenhaltung' });
      expect(cat).toBe('eggs');
    });

    it('should classify Salami as meat_sausage', () => {
      const cat = classifyProductCategory({ name: 'Edelsalami geräuchert in Scheiben' });
      expect(cat).toBe('meat_sausage');
    });

    it('should classify Toastbrot as bakery', () => {
      const cat = classifyProductCategory({ name: 'Butter Toastbrot 500g' });
      expect(cat).toBe('bakery');
    });

    it('should classify Schokolade as snacks_sweets', () => {
      const cat = classifyProductCategory({ name: 'Alpenmilch Schokolade 100g' });
      expect(cat).toBe('snacks_sweets');
    });
  });

  describe('Serving Calculations (Bug 5)', () => {
    it('should compute 1 Scheibe for Toastbrot with mathematically calculated calories', () => {
      const toast: Partial<ProductItem> = {
        name: 'Vollkorn Toastbrot 500g',
        packageWeightGrams: 500,
        piecesPerPackage: 20,
        nutrition: { caloriesPer100g: 246, proteinPer100g: 8, carbsPer100g: 45, fatPer100g: 3 }
      };
      const detail = getProductServingDetail(toast);
      expect(detail.servingLabel).toBe('1 Scheibe');
      expect(detail.servingWeightGrams).toBe(25); // 500 / 20 = 25g
      expect(detail.servingCalories).toBe(62); // 25 * 246 / 100 = 61.5 -> 62 kcal
    });

    it('should compute 1 Scheibe for Salami with mathematically calculated calories', () => {
      const salami: Partial<ProductItem> = {
        name: 'Salami in Scheiben',
        packageWeightGrams: 100,
        piecesPerPackage: 10,
        nutrition: { caloriesPer100g: 380, proteinPer100g: 22, carbsPer100g: 1, fatPer100g: 32 }
      };
      const detail = getProductServingDetail(salami);
      expect(detail.servingLabel).toBe('1 Scheibe');
      expect(detail.servingWeightGrams).toBe(10);
      expect(detail.servingCalories).toBe(38);
    });

    it('should compute 1 Glas (250 ml) for milk with 250ml calories', () => {
      const milk: Partial<ProductItem> = {
        name: 'Frische Vollmilch 3,5% Fett 1L',
        packageSize: '1 L',
        nutrition: { caloriesPer100g: 64, proteinPer100g: 3.4, carbsPer100g: 4.8, fatPer100g: 3.5 }
      };
      const detail = getProductServingDetail(milk);
      expect(detail.servingLabel).toBe('1 Glas (250 ml)');
      expect(detail.servingCalories).toBe(160); // 250 * 64 / 100 = 160 kcal
    });

    it('should compute 1 Ei for fresh eggs', () => {
      const egg: Partial<ProductItem> = {
        name: '10 frische Eier',
        pieceUnitName: 'Ei',
        packageWeightGrams: 600,
        piecesPerPackage: 10,
        edibleYieldPercent: 88,
        nutrition: { caloriesPer100g: 140, proteinPer100g: 12, carbsPer100g: 1, fatPer100g: 10 }
      };
      const detail = getProductServingDetail(egg);
      expect(detail.servingLabel).toBe('1 Ei');
      expect(detail.servingCalories).toBeGreaterThan(0);
    });
  });

  describe('Automated Product Data Check (Section 6)', () => {
    it('should validate a complete and consistent product without errors', () => {
      const validProduct: Partial<ProductItem> = {
        id: 'test-toast-1',
        name: 'Netto Vollkorn Toastbrot 500g',
        brand: 'Netto',
        ean: '4012345678901',
        category: 'bakery',
        packageSize: '500 g',
        packageWeightGrams: 500,
        piecesPerPackage: 20,
        pieceUnitName: 'Scheibe',
        servingSizeGrams: 25,
        nutrition: {
          caloriesPer100g: 246,
          proteinPer100g: 8,
          carbsPer100g: 45,
          fatPer100g: 3
        },
        price: 1.49,
        priceStatus: 'last_observed',
        priceSource: 'netto_filiale_beobachtet',
        lastUpdated: '2026-10-20',
        imageUrl: 'https://images.openfoodfacts.net/images/products/401/234/567/8901/front_de.full.jpg'
      };

      const result = service.validateProduct(validProduct);
      expect(result.isValid).toBe(true);
      const errors = result.issues.filter(i => i.severity === 'error');
      expect(errors.length).toBe(0);
    });

    it('should flag products with missing name or invalid price/calories', () => {
      const invalidProduct: Partial<ProductItem> = {
        id: 'bad-product-1',
        name: '',
        brand: '',
        category: 'other',
        packageSize: '500g',
        packageWeightGrams: 0,
        nutrition: {
          caloriesPer100g: -50,
          proteinPer100g: 0,
          carbsPer100g: 0,
          fatPer100g: 0
        },
        price: -3.99,
        priceStatus: 'unknown',
        imageUrl: ''
      };

      const result = service.validateProduct(invalidProduct);
      expect(result.isValid).toBe(false);
      const errors = result.issues.filter(i => i.severity === 'error');
      expect(errors.some(e => e.field === 'name')).toBe(true);
      expect(errors.some(e => e.field === 'nutrition.caloriesPer100g')).toBe(true);
      expect(errors.some(e => e.field === 'price')).toBe(true);
    });
  });
});
