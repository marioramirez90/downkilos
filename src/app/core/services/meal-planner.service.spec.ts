import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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

  it('should initialize a 7-day plan with Monday matching reference recipes', () => {
    const plan = service.weeklyPlan();
    expect(plan.length).toBe(7);

    const monday = plan[0];
    expect(monday.dayName).toBe('Montag');
    expect(monday.breakfast.title).toContain('Porridge mit Banane');
    expect(monday.lunch.title).toContain('Reispfanne mit Gemüse');
    expect(monday.dinner.title).toContain('Vollkornbrot mit Ei');
  });

  it('should manage weeklyBudget and dailyCalorieTarget', () => {
    expect(service.weeklyBudget()).toBe(50);
    expect(service.dailyCalorieTarget()).toBeGreaterThanOrEqual(1200);

    service.setWeeklyBudget(75);
    expect(service.weeklyBudget()).toBe(75);
  });

  it('should toggle meal selection state', () => {
    expect(service.isMealSelected(0, 'breakfast')).toBe(true);

    service.toggleMealSelected(0, 'breakfast');
    expect(service.isMealSelected(0, 'breakfast')).toBe(false);

    service.toggleMealSelected(0, 'breakfast');
    expect(service.isMealSelected(0, 'breakfast')).toBe(true);
  });

  it('should aggregate automatic shopping list preview items and cost', () => {
    const autoList = service.automaticShoppingList();
    expect(autoList.items.length).toBeGreaterThanOrEqual(3);
    expect(autoList.totalCost).toBeGreaterThan(0);

    const banana = autoList.items.find(i => i.name === 'Bananen');
    expect(banana).toBeDefined();

    const oats = autoList.items.find(i => i.name === 'Haferflocken');
    expect(oats).toBeDefined();
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

  it('should navigate between weekdays', () => {
    expect(service.currentDayIndex()).toBe(0);
    service.nextDay();
    expect(service.currentDayIndex()).toBe(1);
    expect(service.currentDayPlan().dayName).toBe('Dienstag');
    service.previousDay();
    expect(service.currentDayIndex()).toBe(0);
  });
});
