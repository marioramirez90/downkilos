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

  it('should generate personalized vegan weekly plan when dietaryForm is vegan', () => {
    const storageService = TestBed.inject(MealPlannerService)['storageService'];
    storageService.saveDietaryProfile({
      dietaryForm: 'vegan',
      intolerances: [],
      allergies: [],
      customExcludedFoods: [],
      dislikes: []
    });

    service.generateWeeklyPlan();
    const plan = service.weeklyPlan();
    expect(plan.length).toBe(7);

    for (const day of plan) {
      expect(day.breakfast.dietType === 'vegan' || day.breakfast.dietaryForms?.includes('vegan')).toBe(true);
      expect(day.lunch.dietType === 'vegan' || day.lunch.dietaryForms?.includes('vegan')).toBe(true);
      expect(day.dinner.dietType === 'vegan' || day.dinner.dietaryForms?.includes('vegan')).toBe(true);
    }
  });

  it('should adjust meal portions and dynamically update currentDayTotals', () => {
    service.setDayIndex(0);
    const initialTotals = service.currentDayTotals();
    const initialPortions = service.getMealPortions(0, 'breakfast');
    expect(initialPortions).toBe(1);

    // Increase breakfast to 2 portions
    service.setMealPortions(0, 'breakfast', 2);
    expect(service.getMealPortions(0, 'breakfast')).toBe(2);

    const updatedTotals = service.currentDayTotals();
    const breakfastKcal = service.currentDayPlan().breakfast.calories;
    expect(updatedTotals.calories).toBe(initialTotals.calories + breakfastKcal);
  });

  it('should repeat meal from Monday to Friday (workdays)', () => {
    const mondayBreakfast = service.weeklyPlan()[0].breakfast;
    service.setMealPortions(0, 'breakfast', 2);

    service.repeatMealWorkdays(0, 'breakfast');

    const plan = service.weeklyPlan();
    for (let day = 0; day <= 4; day++) {
      expect(plan[day].breakfast.id).toBe(mondayBreakfast.id);
      expect(plan[day].portions?.breakfast).toBe(2);
      expect(plan[day].selectedMeals?.breakfast).toBe(true);
    }
  });

  it('should repeat meal for the entire week (all 7 days)', () => {
    const mondayDinner = service.weeklyPlan()[0].dinner;
    service.repeatMealAllWeek(0, 'dinner');

    const plan = service.weeklyPlan();
    for (let day = 0; day < 7; day++) {
      expect(plan[day].dinner.id).toBe(mondayDinner.id);
      expect(plan[day].selectedMeals?.dinner).toBe(true);
    }
  });

  it('should repeat meal to custom targeted days', () => {
    const mondayLunch = service.weeklyPlan()[0].lunch;
    service.repeatMealToDays(0, 'lunch', [2, 4, 6]); // Mittwoch, Freitag, Sonntag

    const plan = service.weeklyPlan();
    expect(plan[2].lunch.id).toBe(mondayLunch.id);
    expect(plan[4].lunch.id).toBe(mondayLunch.id);
    expect(plan[6].lunch.id).toBe(mondayLunch.id);
  });
});
