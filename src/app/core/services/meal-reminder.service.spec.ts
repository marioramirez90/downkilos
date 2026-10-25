import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MealReminderService } from './meal-reminder.service';
import { StorageService } from './storage.service';
import { FoodLogService } from './food-log.service';
import { MealPlannerService } from './meal-planner.service';
import { LocalNotifications } from '@capacitor/local-notifications';

describe('MealReminderService (V5.1)', () => {
  let service: MealReminderService;
  let foodLog: FoodLogService;
  let mealPlanner: MealPlannerService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([])]
    });

    service = TestBed.inject(MealReminderService);
    foodLog = TestBed.inject(FoodLogService);
    mealPlanner = TestBed.inject(MealPlannerService);
    router = TestBed.inject(Router);

    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    foodLog.clearTodayLog();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('1. should initialize with disabled reminders by default until explicitly enabled', () => {
    expect(service.settings().enabled).toBe(false);
  });

  it('2. should request permission and enable reminders when updateSettings is called with enabled=true', async () => {
    vi.spyOn(service, 'requestPermission').mockResolvedValue(true);
    await service.updateSettings({ enabled: true });
    expect(service.settings().enabled).toBe(true);
  });

  it('3. should identify planned recipe for Monday breakfast', () => {
    const mondayStr = '2026-10-26'; // Monday
    const planned = service.getPlannedRecipe('breakfast', mondayStr);
    expect(planned).toBeTruthy();
    expect(planned?.title).toContain('Porridge');
  });

  it('4. should log planned meal exactly once when confirming "Ja, wie geplant"', async () => {
    const mondayStr = '2026-10-26';
    const planned = service.getPlannedRecipe('breakfast', mondayStr);
    expect(planned).toBeTruthy();
    const plannedCals = planned!.calories;

    const success = await service.confirmAsPlanned('breakfast', mondayStr);
    expect(success).toBe(true);
    expect(foodLog.eatenCalories()).toBe(plannedCals);

    // Second call should not double-count
    const repeatSuccess = await service.confirmAsPlanned('breakfast', mondayStr);
    expect(foodLog.eatenCalories()).toBe(plannedCals);
  });

  it('5. should open alternative food view when "Etwas anderes" is chosen', () => {
    service.openAlternativeFoodInput('breakfast', '2026-10-26');
    expect(router.navigate).toHaveBeenCalledWith(['/was-hast-du-gegessen/alternative'], {
      queryParams: { slot: 'breakfast', date: '2026-10-26' }
    });
  });

  it('6. should log alternative items (e.g. Banane) without counting planned recipe calories', () => {
    const bananaItem: any = {
      id: 'alt-banana-1',
      productId: 'netto-bananas-1kg',
      name: 'Bio Banane',
      mealType: 'breakfast',
      amountGrams: 115,
      displayQuantity: '1 Stück',
      calories: 95,
      protein: 1.2,
      carbs: 23,
      fat: 0.3,
      status: 'eaten',
      loggedAt: new Date().toISOString()
    };

    service.recordAlternativeItems('breakfast', [bananaItem], '2026-10-26');

    // Only banana calories should be counted, not Porridge (420 kcal)
    expect(foodLog.eatenCalories()).toBe(95);
    expect(service.isMealAlreadyLogged('breakfast', '2026-10-26')).toBe(true);
    expect(service.hasRespondedToday('breakfast', '2026-10-26')).toBe(true);
  });

  it('7. should record "Noch nichts gegessen" with 0 calories added', () => {
    service.recordNothingYet('breakfast', '2026-10-26');
    expect(foodLog.eatenCalories()).toBe(0);
    expect(service.hasRespondedToday('breakfast', '2026-10-26')).toBe(true);
  });

  it('8. should recognize already logged meals and avoid scheduling reminders for them', () => {
    foodLog.addManualItem('Frühstücksei', 80, '1 Ei', 'breakfast', 'eaten');
    expect(service.isMealAlreadyLogged('breakfast')).toBe(true);
  });

  it('9. should allow pausing reminders', async () => {
    await service.updateSettings({ enabled: true, paused: true });
    expect(service.settings().paused).toBe(true);
  });

  it('10. should allow customizing reminder times', async () => {
    await service.updateSettings({
      breakfastTime: '11:30',
      lunchTime: '16:30',
      dinnerTime: '20:30'
    });
    expect(service.settings().breakfastTime).toBe('11:30');
    expect(service.settings().lunchTime).toBe('16:30');
    expect(service.settings().dinnerTime).toBe('20:30');
  });
});
