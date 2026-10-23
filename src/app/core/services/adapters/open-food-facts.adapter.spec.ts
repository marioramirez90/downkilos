import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenFoodFactsAdapter } from './open-food-facts.adapter';

describe('OpenFoodFactsAdapter', () => {
  let adapter: OpenFoodFactsAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OpenFoodFactsAdapter]
    });
    adapter = TestBed.inject(OpenFoodFactsAdapter);
  });

  it('should be created', () => {
    expect(adapter).toBeTruthy();
  });

  it('should correctly map Open Food Facts product structure to ProductItem', () => {
    const rawOFF = {
      product_name_de: 'Bio Speisemöhren',
      brands: 'BioBio',
      quantity: '1 kg',
      image_front_url: 'https://images.openfoodfacts.org/images/products/431/150/171/2090/front_de.jpg',
      nutriments: {
        'energy-kcal_100g': 39,
        'proteins_100g': 1.0,
        'carbohydrates_100g': 6.8,
        'fat_100g': 0.2,
        'fiber_100g': 3.1
      },
      allergens_tags: [],
      ingredients_text_de: 'Bio-Speisemöhren'
    };

    const mapped = adapter.mapOFFToProduct('4311501712090', rawOFF as any);
    expect(mapped.ean).toBe('4311501712090');
    expect(mapped.name).toBe('Bio Speisemöhren');
    expect(mapped.brand).toBe('BioBio');
    expect(mapped.nutrition?.caloriesPer100g).toBe(39);
    expect(mapped.nutrition?.proteinPer100g).toBe(1.0);
    expect(mapped.retailerScope).toContain('ohne Hund');
    expect(mapped.dataQualityStatus).toBe('verified');
  });

  it('should handle missing barcode gracefully', async () => {
    const res = await adapter.fetchProductByBarcode('');
    expect(res).toBeNull();
  });
});
