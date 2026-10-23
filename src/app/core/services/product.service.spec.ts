import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load Netto products catalog with verified items and nutrition', () => {
    const products = service.getAllProducts();
    expect(products.length).toBeGreaterThanOrEqual(10);

    const chicken = products.find(p => p.id === 'netto-chicken-400');
    expect(chicken).toBeDefined();
    expect(chicken?.name).toContain('Hähnchenbrustfilet');
    expect(chicken?.nutrition.proteinPer100g).toBeGreaterThan(20);
    expect(chicken?.retailerScope).toContain('ohne Hund');
  });

  it('should filter products by search query and category', () => {
    const results = service.searchProducts('Haferflocken');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].name).toContain('Haferflocken');

    const dairyResults = service.searchProducts('', 'dairy');
    expect(dairyResults.every(p => p.category === 'dairy')).toBe(true);
  });

  it('should update and persist user-reported product price and track price history', () => {
    const initialHistCount = service.priceHistory().length;
    service.updateUserPrice('netto-chicken-400', 3.29);
    
    const updated = service.getProductById('netto-chicken-400');
    expect(updated?.price).toBe(3.29);
    expect(updated?.priceStatus).toBe('user_reported');

    // Price history must be recorded and never overwrite without a trace
    expect(service.priceHistory().length).toBeGreaterThan(initialHistCount);
    expect(service.priceHistory()[0].price).toBe(3.29);
    expect(service.priceHistory()[0].priceStatus).toBe('user_reported');
  });

  it('should prevent duplicate products by EAN', () => {
    const existing = service.getAllProducts()[0];
    const duplicate = { ...existing, id: 'duplicate-id' };

    const res = service.addProduct(duplicate);
    expect(res.success).toBe(false);
    expect(res.message).toContain('existiert bereits');
  });

  it('should correctly handle missing prices as required by rules without inventing fantasy prices', () => {
    const item = service.getProductById('netto-specialty-item');
    expect(item).toBeDefined();
    expect(item?.price).toBeNull();
    expect(item?.priceStatus).toBe('unknown');
  });

  it('should import Netto JSON offers and record import log', () => {
    const initialLogsCount = service.importLogs().length;
    const jsonStr = JSON.stringify([
      {
        ean: '4311501999123',
        name: 'Bio Paprika rot',
        brand: 'BioBio',
        price: 1.49,
        validFrom: '2026-10-20',
        validUntil: '2026-10-25'
      }
    ]);

    const result = service.importOffersFromJson(jsonStr);
    expect(result.imported).toBe(1);
    expect(service.getProductByEan('4311501999123')).toBeDefined();
    expect(service.importLogs().length).toBeGreaterThan(initialLogsCount);
  });
});
