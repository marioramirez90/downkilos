import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductLookupService } from './product-lookup.service';
import { ProductService } from './product.service';
import { OpenFoodFactsAdapter } from './adapters/open-food-facts.adapter';
import { ProductItem } from '../models/product.model';

describe('ProductLookupService', () => {
  let service: ProductLookupService;
  let productService: ProductService;
  let offAdapter: OpenFoodFactsAdapter;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductLookupService);
    productService = TestBed.inject(ProductService);
    offAdapter = TestBed.inject(OpenFoodFactsAdapter);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should normalize barcodes properly', () => {
    expect(service.normalizeBarcode(' 4311501-444455 ')).toBe('4311501444455');
    expect(service.normalizeBarcode('')).toBe('');
  });

  it('should reject invalid barcode lengths', async () => {
    const result = await service.lookupByBarcode('1234');
    expect(result.found).toBe(false);
    expect(result.errorMessage).toContain('Ungültiger Barcode');
    expect(result.source).toBe('none');
  });

  it('should find product in local catalog (Step 1)', async () => {
    const localProducts = productService.products();
    const itemWithEan = localProducts.find(p => !!p.ean && p.ean.length >= 8);
    expect(itemWithEan).toBeDefined();

    if (itemWithEan && itemWithEan.ean) {
      const result = await service.lookupByBarcode(itemWithEan.ean);
      expect(result.found).toBe(true);
      expect(result.source).toBe('local_catalog');
      expect(result.product).toBeDefined();
      expect(result.product?.id).toBe(itemWithEan.id);
    }
  });

  it('should query Open Food Facts when not found locally (Step 2)', async () => {
    const mockOffData: Partial<ProductItem> = {
      ean: '4008400401123',
      name: 'Kinder Riegel',
      brand: 'Ferrero',
      packageSize: '210g (10x21g)',
      packageWeightGrams: 210,
      imageUrl: 'https://images.openfoodfacts.org/images/products/400/840/040/1123/front_de.jpg',
      nutrition: {
        caloriesPer100g: 566,
        proteinPer100g: 8.7,
        carbsPer100g: 53.5,
        fatPer100g: 35.0,
        fiberPer100g: 1.0
      }
    };

    vi.spyOn(offAdapter, 'fetchProductByBarcode').mockResolvedValue(mockOffData);

    const result = await service.lookupByBarcode('4008400401123');
    expect(result.found).toBe(true);
    expect(result.source).toBe('open_food_facts');
    expect(result.product).toBeDefined();
    expect(result.product?.name).toBe('Kinder Riegel');
    expect(result.product?.brand).toBe('Ferrero');
    expect(result.product?.nutrition.caloriesPer100g).toBe(566);
    // Verified that price is null and unknown as per rules
    expect(result.product?.price).toBeNull();
    expect(result.product?.priceStatus).toBe('unknown');

    // Product should now be added to local catalog
    const added = productService.getProductByEan('4008400401123');
    expect(added).toBeDefined();
    expect(added?.name).toBe('Kinder Riegel');
  });

  it('should return "Produkt noch nicht gefunden" if both catalog and OFF fail (Step 3)', async () => {
    vi.spyOn(offAdapter, 'fetchProductByBarcode').mockResolvedValue(null);

    const result = await service.lookupByBarcode('9999999999999');
    expect(result.found).toBe(false);
    expect(result.source).toBe('none');
    expect(result.product).toBeNull();
    expect(result.errorMessage).toBe('Produkt noch nicht gefunden');
  });
});
