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

  it('should generate shopping list items from the planned meal ingredients with real Netto products', () => {
    const items = service.items();
    expect(items.length).toBeGreaterThanOrEqual(8);

    const chicken = items.find(i => i.productId === 'netto-chicken-400');
    expect(chicken).toBeDefined();
    expect(chicken?.packagePrice).toBe(3.49);

    const oats = items.find(i => i.productId === 'netto-oats-500');
    expect(oats).toBeDefined();
    expect(oats?.packagePrice).toBe(0.79);
  });

  it('should calculate the total shopping sum and reflect estimated notices when older prices are present', () => {
    const summary = service.summary();
    expect(summary.totalCost).toBeGreaterThan(10);
    expect(summary.totalItems).toBeGreaterThanOrEqual(8);
    // Since some items in the catalog have status 'last_observed'
    expect(summary.hasOlderPrices).toBe(true);
    expect(summary.estimateNotice).toBeDefined();
  });

  it('should exclude items from totalCost when marked as present in pantry (Vorrat)', () => {
    const initialCost = service.summary().totalCost;
    const chicken = service.items().find(i => i.productId === 'netto-chicken-400')!;

    service.toggleInPantry(chicken.id);
    const updatedSummary = service.summary();

    expect(updatedSummary.totalCost).toBe(Math.round((initialCost - (chicken.totalCost || 0)) * 100) / 100);
  });

  it('should apply budget buffer percentage', () => {
    const baseCost = service.summary().totalCost;
    service.setBudgetBuffer(10); // +10%

    const summaryWithBuffer = service.summary();
    expect(summaryWithBuffer.budgetBufferPercent).toBe(10);
    expect(summaryWithBuffer.totalCostWithBuffer).toBe(Math.round((baseCost * 1.1) * 100) / 100);
  });

  it('should toggle item checked state', () => {
    const first = service.items()[0];
    const initialStatus = first.isChecked;

    service.toggleItemChecked(first.id);
    const updated = service.items().find(i => i.id === first.id)!;
    expect(updated.isChecked).toBe(!initialStatus);
  });

  it('should add and remove custom items', () => {
    service.addCustomItem('Mineralwasser', 0.59);
    const added = service.items().find(i => i.name === 'Mineralwasser');
    expect(added).toBeDefined();
    expect(added?.totalCost).toBe(0.59);

    service.removeCustomItem(added!.id);
    const removed = service.items().find(i => i.name === 'Mineralwasser');
    expect(removed).toBeUndefined();
  });

  it('should calculate total calories of all purchased packages and update when package count changes', () => {
    const summary = service.summary();
    expect(summary.totalCalories).toBeGreaterThan(1000);

    const toast = service.items().find(i => i.productId === 'netto-toast-500');
    expect(toast).toBeDefined();
    expect(toast?.packageCalories).toBe(1250);
    expect(toast?.totalCalories).toBe(1250);
    const initialTotalCals = summary.totalCalories!;
    const initialCost = summary.totalCost;

    // Packungsanzahl um 1 erhöhen (+1 Toastbrot)
    service.updatePackageCount(toast!.id, 1);

    const updatedToast = service.items().find(i => i.id === toast!.id)!;
    expect(updatedToast.packageCount).toBe(2);
    expect(updatedToast.totalCalories).toBe(2500);
    expect(updatedToast.totalCost).toBe(2.98);

    const updatedSummary = service.summary();
    expect(updatedSummary.totalCalories).toBe(initialTotalCals + 1250);
    expect(updatedSummary.totalCost).toBe(Math.round((initialCost + 1.49) * 100) / 100);
  });
});
