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
    expect(today.breakfast.title).toBe('Overnight Oats mit Beeren');
    expect(today.lunch.title).toBe('Hähnchen-Bowl mit Reis & Gemüse');
    expect(today.snack.title).toBe('Skyr mit Banane und Nüssen');
    expect(today.dinner.title).toBe('Linsen-Curry mit Vollkornreis');
  });

  it('should calculate daily total calories and costs accurately', () => {
    const totals = service.currentDayTotals();
    // 450 + 620 + 250 + 480 = 1800 kcal
    expect(totals.calories).toBe(1800);
    // 1.20 + 2.50 + 0.80 + 1.90 = 6.40 €
    expect(totals.cost).toBeCloseTo(6.40, 2);
  });

  it('should filter recipes by allergy exclusion', () => {
    const noGluten = service.getFilteredRecipes('breakfast', 'omnivore', ['Gluten']);
    expect(noGluten.every(r => !r.allergens.includes('Gluten'))).toBe(true);
  });

  it('should swap a meal and dynamically recalculate day totals', () => {
    const alts = service.getFilteredRecipes('breakfast');
    const newBreakfast = alts.find(r => r.id === 'rec-warm-porridge')!;

    service.swapMeal(0, 'breakfast', newBreakfast);
    expect(service.currentDayPlan().breakfast.id).toBe('rec-warm-porridge');

    // New calories: 360 + 620 + 250 + 480 = 1710 kcal
    expect(service.currentDayTotals().calories).toBe(1710);
  });
});
