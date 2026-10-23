import { TestBed } from '@angular/core/testing';
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
    expect(chicken?.name).toBe('Hähnchenbrustfilet');
    expect(chicken?.retailer).toBe('netto');
    expect(chicken?.nutrition.proteinPer100g).toBeGreaterThan(20);
  });

  it('should filter products by search query and category', () => {
    const results = service.searchProducts('Haferflocken');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].name).toBe('Haferflocken');

    const dairyResults = service.searchProducts('', 'dairy');
    expect(dairyResults.every(p => p.category === 'dairy')).toBe(true);
  });

  it('should update and persist user-reported product price', () => {
    const chicken = service.getProductById('netto-chicken-400');
    expect(chicken?.price).toBe(2.99);

    service.updateUserPrice('netto-chicken-400', 3.29);
    const updated = service.getProductById('netto-chicken-400');
    expect(updated?.price).toBe(3.29);
    expect(updated?.priceStatus).toBe('user_reported');
  });

  it('should correctly handle missing prices as required by rules', () => {
    const item = service.getProductById('netto-specialty-item');
    expect(item).toBeDefined();
    expect(item?.price).toBeNull();
    expect(item?.priceStatus).toBe('missing');
  });
});
