import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { FoodDiaryComponent } from './food-diary.component';
import { FoodLogService } from '../../core/services/food-log.service';
import { StorageService } from '../../core/services/storage.service';
import { ProductService } from '../../core/services/product.service';

describe('FoodDiaryComponent', () => {
  let component: FoodDiaryComponent;
  let fixture: ComponentFixture<FoodDiaryComponent>;
  let router: Router;
  let foodLogService: FoodLogService;
  let productService: ProductService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [FoodDiaryComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    router = TestBed.inject(Router);
    foodLogService = TestBed.inject(FoodLogService);
    productService = TestBed.inject(ProductService);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(FoodDiaryComponent);
    component = fixture.componentInstance;
    await component.ngOnInit();
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the food diary component', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate back to dashboard', () => {
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should filter search results based on query', () => {
    component.searchQuery.set('Toast');
    const results = component.searchResults();
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(p => p.name.toLowerCase().includes('toast'))).toBe(true);
  });

  it('should select a product and generate portion options', () => {
    const products = productService.products();
    const egg = products.find(p => p.id === 'netto-eggs-10stk') || products[0];

    component.selectProduct(egg);
    expect(component.selectedProduct()).toBe(egg);
    expect(component.currentPortionOptions().length).toBeGreaterThan(0);
  });

  it('should log a selected product as eaten and update foodLogService', () => {
    const initialEaten = foodLogService.eatenCalories();
    const products = productService.products();
    const toast = products.find(p => p.id === 'netto-toast-500') || products[0];

    component.selectProduct(toast);
    component.logAsEaten();

    expect(foodLogService.eatenCalories()).toBeGreaterThan(initialEaten);
    expect(component.todayItems().length).toBeGreaterThan(0);
  });

  it('should log a manual food item and update daily total', () => {
    const initialEaten = foodLogService.eatenCalories();

    component.openManualEntry();
    component.manualName.set('Haferbrei mit Beeren');
    component.manualCalories.set(320);
    component.manualPortion.set('1 Schüssel');
    component.submitManualFood();

    expect(foodLogService.eatenCalories()).toBe(initialEaten + 320);
  });

  it('should delete a logged item from today log', () => {
    component.foodLogService.addManualItem('Banane', 95, '1 Stück', 'snack', 'eaten');
    const item = component.todayItems()[0];
    expect(item).toBeTruthy();

    component.deleteFoodItem(item.id);
    expect(component.todayItems().find(i => i.id === item.id)).toBeUndefined();
  });
});
