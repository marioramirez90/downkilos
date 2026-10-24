import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { DiscoverComponent } from './discover.component';
import { ProductLookupService } from '../../core/services/product-lookup.service';

describe('DiscoverComponent', () => {
  let component: DiscoverComponent;
  let fixture: ComponentFixture<DiscoverComponent>;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [DiscoverComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(DiscoverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('1. should create', () => {
    expect(component).toBeTruthy();
  });

  it('2. should list products and allow category selection', () => {
    expect(component.filteredProducts().length).toBeGreaterThan(0);
    component.setCategoryFilter('dairy');
    const filtered = component.filteredProducts();
    expect(filtered.every(p => p.category === 'dairy')).toBe(true);
  });

  it('3. should filter low calorie products (< 40 kcal/100g)', () => {
    component.setCategoryFilter('low_cal');
    const filtered = component.filteredProducts();
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every(p => p.nutrition.caloriesPer100g <= 40)).toBe(true);
  });

  it('4. should calculate portion calories with edible yield', () => {
    // Bananen: 100g, 90 kcal/100g, 68% essbar
    const cal = component.calculateSelectedCalories(100, 90, 68);
    expect(cal).toBe(61); // 100 * 0.68 * 0.90 = 61.2 -> 61 kcal
  });

  it('5. should render products as single-column horizontal rows matching reference image', () => {
    const el = fixture.nativeElement as HTMLElement;
    const cards = el.querySelectorAll('.product-row-card');
    expect(cards.length).toBeGreaterThan(0);

    // Verify presence of reference items
    const text = el.textContent || '';
    expect(text).toContain('Banane');
    expect(text).toContain('Eier');
    expect(text).toContain('Toastbrot Vollkorn');

    // Verify 3 calorie columns in each card
    const firstCard = cards[0];
    const calCols = firstCard.querySelectorAll('.cal-col');
    expect(calCols.length).toBe(3);
  });

  it('6. should filter products via live search input', () => {
    component.searchQuery = 'Toast';
    fixture.detectChanges();

    const filtered = component.filteredProducts();
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.some(p => p.name.toLowerCase().includes('toast'))).toBe(true);
  });

  it('7. should add product to shopping list via plus button without logging as eaten', () => {
    const initialShoppingCount = component.shoppingListService.items().length;
    const initialEaten = component.foodLogService.dailySummary().eatenCalories;

    const firstProd = component.filteredProducts()[0];
    const mockEvent = new MouseEvent('click');
    component.addToCart(mockEvent, firstProd);
    fixture.detectChanges();

    // Shopping list increased
    expect(component.shoppingListService.items().length).toBeGreaterThan(initialShoppingCount);
    // Eaten calories did NOT change
    expect(component.foodLogService.dailySummary().eatenCalories).toBe(initialEaten);
  });

  it('8. should toggle favorite status and persist to localStorage', () => {
    const firstProd = component.filteredProducts()[0];
    expect(component.isFavorite(firstProd.id)).toBe(false);

    const mockEvent = new MouseEvent('click');
    component.toggleFavorite(mockEvent, firstProd.id);
    fixture.detectChanges();

    expect(component.isFavorite(firstProd.id)).toBe(true);

    // Toggle off
    component.toggleFavorite(mockEvent, firstProd.id);
    fixture.detectChanges();
    expect(component.isFavorite(firstProd.id)).toBe(false);
  });

  it('9. should open product detail modal when clicking card', () => {
    const firstProd = component.filteredProducts()[0];
    component.openProductDetail(firstProd);
    fixture.detectChanges();

    expect(component.selectedProductDetail()).toBe(firstProd);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.detail-modal')).toBeTruthy();
  });

  it('10. should render green camera button in search bar pill', () => {
    const el = fixture.nativeElement as HTMLElement;
    const cameraBtn = el.querySelector('#btn-open-barcode-scanner');
    expect(cameraBtn).toBeTruthy();
    expect(cameraBtn?.getAttribute('aria-label')).toBe('Barcode scannen');
  });

  it('11. should open barcode scanner modal on button click and close it', () => {
    expect(component.showBarcodeScanner()).toBe(false);

    component.openBarcodeScanner();
    fixture.detectChanges();

    expect(component.showBarcodeScanner()).toBe(true);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.scanner-modal')).toBeTruthy();

    component.closeBarcodeScanner();
    fixture.detectChanges();

    expect(component.showBarcodeScanner()).toBe(false);
  });

  it('12. should perform lookup on barcode scan and open product detail if found', async () => {
    const localProds = component.filteredProducts();
    const itemWithEan = localProds.find(p => !!p.ean);
    expect(itemWithEan).toBeDefined();

    if (itemWithEan?.ean) {
      component.openBarcodeScanner();
      await component.handleBarcodeFound(itemWithEan.ean);
      fixture.detectChanges();

      // Scanner modal closed, detail modal opened
      expect(component.showBarcodeScanner()).toBe(false);
      expect(component.selectedProductDetail()?.id).toBe(itemWithEan.id);
    }
  });

  it('13. should show "Produkt noch nicht gefunden" on unknown barcode', async () => {
    const productLookup = TestBed.inject(ProductLookupService);
    vi.spyOn(productLookup, 'lookupByBarcode').mockResolvedValue({
      found: false,
      source: 'none',
      product: null,
      errorMessage: 'Produkt noch nicht gefunden',
      rawEan: '0000000000000'
    });

    component.openBarcodeScanner();
    await component.handleBarcodeFound('0000000000000');
    fixture.detectChanges();

    expect(component.showBarcodeScanner()).toBe(true);
    expect(component.barcodeScanError()).toContain('Produkt noch nicht gefunden');
  });
});

