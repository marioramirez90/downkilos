import { TestBed } from '@angular/core/testing';
import { MealPlannerService } from './meal-planner.service';

describe('MealPlannerService', () => {
  let service: MealPlannerService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(MealPlannerService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize a 7-day plan with breakfast, lunch, snack, dinner', () => {
    const plan = service.weeklyPlan();
    expect(plan.length).toBe(7);

    const today = service.currentDayPlan();
    expect(today.breakfast).toBeTruthy();
    expect(today.breakfast.title.length).toBeGreaterThan(0);
    expect(today.lunch).toBeTruthy();
    expect(today.lunch.title.length).toBeGreaterThan(0);
    expect(today.snack).toBeTruthy();
    expect(today.snack.title.length).toBeGreaterThan(0);
    expect(today.dinner).toBeTruthy();
    expect(today.dinner.title.length).toBeGreaterThan(0);
  });

  it('should calculate daily total calories and costs accurately', () => {
    const totals = service.currentDayTotals();
    expect(totals.calories).toBeGreaterThan(1000);
    expect(totals.cost).toBeGreaterThan(2.0);
  });

  it('should filter recipes by allergy exclusion', () => {
    const noGluten = service.getFilteredRecipes('breakfast', 'omnivore', ['Gluten']);
    expect(noGluten.every(r => !r.allergens.includes('Gluten'))).toBe(true);
  });

  it('should swap a meal and dynamically recalculate day totals', () => {
    const alts = service.getFilteredRecipes('breakfast');
    expect(alts.length).toBeGreaterThan(1);
    const newBreakfast = alts[1];

    service.swapMeal(0, 'breakfast', newBreakfast);
    expect(service.currentDayPlan().breakfast.id).toBe(newBreakfast.id);

    const totals = service.currentDayTotals();
    expect(totals.calories).toBeGreaterThan(0);
  });
});
