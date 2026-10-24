import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ShoppingListService } from './shopping-list.service';

describe('ShoppingListService', () => {
  let service: ShoppingListService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShoppingListService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with an empty list, 0 cost and 0 calories for new users (Section 14 & 15)', () => {
    const items = service.items();
    expect(items.length).toBe(0);

    const summary = service.summary();
    expect(summary.totalItems).toBe(0);
    expect(summary.totalCost).toBe(0);
    expect(summary.totalCalories).toBe(0);
    expect(summary.checkedItems).toBe(0);
  });

  it('should generate shopping list items when generateListFromPlan is explicitly called', () => {
    service.generateListFromPlan();
    const items = service.items();
    expect(items.length).toBeGreaterThanOrEqual(8);

    const chicken = items.find(i => i.productId === 'netto-chicken-400');
    expect(chicken).toBeDefined();
    expect(chicken?.packagePrice).toBe(3.49);

    const oats = items.find(i => i.productId === 'netto-oats-500');
    expect(oats).toBeDefined();
    expect(oats?.packagePrice).toBe(0.79);
  });

  it('should calculate the total shopping sum and reflect estimated notices when older prices are present in plan', () => {
    service.generateListFromPlan();
    const summary = service.summary();
    expect(summary.totalCost).toBeGreaterThan(10);
    expect(summary.totalItems).toBeGreaterThanOrEqual(8);
    // Since some items in the catalog have status 'last_observed'
    expect(summary.hasOlderPrices).toBe(true);
    expect(summary.estimateNotice).toBeDefined();
  });

  it('should exclude items from totalCost when marked as present in pantry (Vorrat)', () => {
    service.generateListFromPlan();
    const initialCost = service.summary().totalCost;
    const chicken = service.items().find(i => i.productId === 'netto-chicken-400')!;

    service.toggleInPantry(chicken.id);
    const updatedSummary = service.summary();

    expect(updatedSummary.totalCost).toBe(Math.round((initialCost - (chicken.totalCost || 0)) * 100) / 100);
  });

  it('should apply budget buffer percentage', () => {
    service.generateListFromPlan();
    const baseCost = service.summary().totalCost;
    service.setBudgetBuffer(10); // +10%

    const summaryWithBuffer = service.summary();
    expect(summaryWithBuffer.budgetBufferPercent).toBe(10);
    expect(summaryWithBuffer.totalCostWithBuffer).toBe(Math.round((baseCost * 1.1) * 100) / 100);
  });

  it('should add custom items and update summary without generating dummy plan items', () => {
    service.addCustomItem('Bio Äpfel', 2.49, 'fruits_veg', '1 kg', 250);

    const items = service.items();
    expect(items.length).toBe(1);
    expect(items[0].name).toBe('Bio Äpfel');
    expect(items[0].totalCost).toBe(2.49);
    expect(service.summary().totalCost).toBe(2.49);
    expect(service.summary().totalCalories).toBe(250);
  });

  it('should remove items correctly', () => {
    service.addCustomItem('Bio Bananen', 1.99);
    expect(service.items().length).toBe(1);

    service.removeItem(service.items()[0].id);
    expect(service.items().length).toBe(0);
    expect(service.summary().totalCost).toBe(0);
  });
});
