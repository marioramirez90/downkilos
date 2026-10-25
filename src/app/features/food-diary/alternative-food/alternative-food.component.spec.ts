import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { AlternativeFoodComponent } from './alternative-food.component';
import { FoodLogService } from '../../../core/services/food-log.service';
import { ProductService } from '../../../core/services/product.service';

describe('AlternativeFoodComponent (V5.1)', () => {
  let component: AlternativeFoodComponent;
  let fixture: ComponentFixture<AlternativeFoodComponent>;
  let router: Router;
  let foodLog: FoodLogService;
  let productService: ProductService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AlternativeFoodComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: {
              subscribe: (fn: any) => fn({ slot: 'breakfast', date: '2026-10-26' })
            }
          }
        }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    foodLog = TestBed.inject(FoodLogService);
    productService = TestBed.inject(ProductService);

    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    foodLog.clearTodayLog();

    fixture = TestBed.createComponent(AlternativeFoodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('1. should create the component and initialize for breakfast', () => {
    expect(component).toBeTruthy();
    expect(component.mealSlot()).toBe('breakfast');
    expect(component.mealLabel()).toBe('Frühstück');
  });

  it('2. should find Banane in search results', () => {
    component.searchQuery.set('Banane');
    fixture.detectChanges();

    const results = component.searchResults();
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.name.toLowerCase().includes('banan'))).toBe(true);
  });

  it('3. should add a Banane to selected items and compute calories', () => {
    component.searchQuery.set('Banane');
    const banana = component.searchResults().find(r => r.name.toLowerCase().includes('banan'));
    expect(banana).toBeTruthy();

    component.addProductToSelection(banana!);
    expect(component.selectedItems().length).toBe(1);
    expect(component.totalCalories()).toBeGreaterThan(50);
  });

  it('4. should allow multiple alternative items (e.g. Banane + Toast)', () => {
    component.searchQuery.set('Banane');
    const banana = component.searchResults().find(r => r.name.toLowerCase().includes('banan'));
    component.addProductToSelection(banana!);

    component.searchQuery.set('Toast');
    const toast = component.searchResults().find(r => r.name.toLowerCase().includes('toast'));
    if (toast) {
      component.addProductToSelection(toast);
      expect(component.selectedItems().length).toBe(2);
    }
  });

  it('5. should support manual food entry when item is not in catalog', () => {
    component.manualName.set('Hausgemachtes Rührei');
    component.manualCalories.set(180);
    component.manualPortion.set('2 Eier');

    component.addManualItemToSelection();

    expect(component.selectedItems().length).toBe(1);
    expect(component.selectedItems()[0].name).toBe('Hausgemachtes Rührei');
    expect(component.totalCalories()).toBe(180);
  });

  it('6. should confirm and log alternative items as eaten without adding planned recipe', () => {
    component.searchQuery.set('Banane');
    const banana = component.searchResults().find(r => r.name.toLowerCase().includes('banan'));
    component.addProductToSelection(banana!);
    const expectedCals = component.totalCalories();

    component.confirmAndLogAlternative();

    expect(foodLog.eatenCalories()).toBe(expectedCals);
    // Planned porridge (~420 kcal) was NOT added
    expect(foodLog.eatenCalories()).not.toBe(420);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
