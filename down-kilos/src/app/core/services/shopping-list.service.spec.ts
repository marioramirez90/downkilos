import { TestBed } from '@angular/core/testing';
import { ShoppingListService } from './shopping-list.service';
import { MealPlannerService } from './meal-planner.service';
import { ProductService } from './product.service';

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

  it('should generate shopping list items from the planned meal ingredients', () => {
    const items = service.items();
    expect(items.length).toBeGreaterThanOrEqual(8);

    const chicken = items.find(i => i.name === 'Hähnchenbrustfilet');
    expect(chicken).toBeDefined();
    expect(chicken?.packagePrice).toBe(2.99);

    const oats = items.find(i => i.name === 'Haferflocken');
    expect(oats).toBeDefined();
    expect(oats?.packagePrice).toBe(0.89);
  });

  it('should calculate the total shopping sum', () => {
    const summary = service.summary();
    expect(summary.totalCost).toBeGreaterThan(10);
    expect(summary.totalItems).toBeGreaterThanOrEqual(8);
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
});
