import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ManualPriceAdapter } from './manual-price.adapter';
import { ProductItem } from '../../models/product.model';

describe('ManualPriceAdapter', () => {
  let adapter: ManualPriceAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ManualPriceAdapter]
    });
    adapter = TestBed.inject(ManualPriceAdapter);
  });

  it('should create manual price entry and retain price history', () => {
    const dummyProduct: ProductItem = {
      id: 'test-1',
      ean: '4311501234567',
      name: 'Test Artikel',
      brand: 'BioBio',
      category: 'fruits_veg',
      imageUrl: 'test.jpg',
      imageLicense: 'Test',
      retailer: 'netto_marken_discount',
      packageSize: '1 kg',
      packageWeightGrams: 1000,
      price: 1.29,
      priceUnit: '€',
      priceStatus: 'last_observed',
      dataSource: 'open_prices',
      lastUpdated: '2026-10-10',
      dataQualityStatus: 'verified',
      nutrition: { caloriesPer100g: 50, proteinPer100g: 1, carbsPer100g: 5, fatPer100g: 0.2 },
      allergens: []
    };

    const result = adapter.createManualPriceEntry(
      dummyProduct,
      1.49,
      'user_123',
      'Netto Filiale Hamburg',
      'Regalpreis am 22.10. abgelesen'
    );

    expect(result.updatedProduct.price).toBe(1.49);
    expect(result.updatedProduct.priceStatus).toBe('user_reported');
    expect(result.updatedProduct.regionBranch).toBe('Netto Filiale Hamburg');

    expect(result.historyEntry.productId).toBe('test-1');
    expect(result.historyEntry.price).toBe(1.49);
    expect(result.historyEntry.notes).toBe('Regalpreis am 22.10. abgelesen');
  });
});
