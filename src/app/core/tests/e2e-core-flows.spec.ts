import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { StorageService } from '../services/storage.service';
import { CalorieCalculatorService } from '../services/calorie-calculator.service';
import { FoodLogService } from '../services/food-log.service';
import { ShoppingListService } from '../services/shopping-list.service';
import { MealPlannerService } from '../services/meal-planner.service';
import { UserProfile } from '../models/user-profile.model';
import { ProductItem } from '../models/product.model';
import { DietaryProfile } from '../models/dietary-profile.model';

describe('E2E Core Flow Validation', () => {
  let storageService: StorageService;
  let calorieService: CalorieCalculatorService;
  let foodLogService: FoodLogService;
  let shoppingListService: ShoppingListService;
  let mealPlannerService: MealPlannerService;

  const mockProduct: ProductItem = {
    id: 'p_skyr',
    name: 'Bio Skyr Natur',
    brand: 'Gutes Land',
    category: 'dairy',
    packageSize: '500g Becher',
    packageWeightGrams: 500,
    price: 1.49,
    priceUnit: 'piece',
    priceStatus: 'verified',
    dataSource: 'verified_catalog',
    lastUpdated: '2026-10-23',
    dataQualityStatus: 'verified',
    allergens: ['Milch'],
    retailer: 'netto',
    imageUrl: 'images/products/skyr.jpg',
    imageLicense: 'commercial_verified',
    nutrition: {
      caloriesPer100g: 65,
      proteinPer100g: 11,
      carbsPer100g: 4,
      fatPer100g: 0.2
    }
  };

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        StorageService,
        CalorieCalculatorService,
        FoodLogService,
        ShoppingListService,
        MealPlannerService
      ]
    }).compileComponents();

    storageService = TestBed.inject(StorageService);
    calorieService = TestBed.inject(CalorieCalculatorService);
    foodLogService = TestBed.inject(FoodLogService);
    shoppingListService = TestBed.inject(ShoppingListService);
    mealPlannerService = TestBed.inject(MealPlannerService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('1. Step 1-3: Clean start without dummy profile & save valid profile', async () => {
    const initialProfile = await storageService.loadProfile();
    expect(initialProfile).toBeNull();

    const userProfile: UserProfile = {
      id: 'guest_profile',
      name: 'Mario',
      birthDate: '1990-05-14',
      gender: 'male',
      currentWeight: 82.0,
      height: 180,
      targetWeight: 75.0,
      activityLevel: 'moderate',
      goal: 'lose_weight',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await storageService.saveProfile(userProfile);
    await expect(storageService.hasProfile()).resolves.toBe(true);

    const saved = await storageService.loadProfile();
    expect(saved?.name).toBe('Mario');
    expect(saved?.currentWeight).toBe(82.0);
  });

  it('2. Step 4: Accurate personalized calorie calculation & deficit', async () => {
    const userProfile: UserProfile = {
      id: 'guest_profile',
      name: 'Mario',
      birthDate: '1990-05-14',
      gender: 'male',
      currentWeight: 82.0,
      height: 180,
      targetWeight: 75.0,
      activityLevel: 'moderate',
      goal: 'lose_weight',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = calorieService.calculate(userProfile);
    expect(result.bmr).toBeGreaterThan(1600);
    expect(result.tdee).toBeGreaterThan(result.bmr);
    expect(result.dailyTargetKcal).toBeLessThan(result.tdee);
    expect(result.deficit).toBeGreaterThan(0);
    expect(result.macros.proteinGrams).toBeGreaterThan(100);
  });

  it('3. Step 5: Retailer preference storage with Netto default', async () => {
    const pref = await storageService.loadRetailerPreference();
    expect(pref?.retailerId).toBe('netto');
    expect(pref?.weeklyBudget).toBe(40);
  });

  it('4. Step 7: Food diary starts at 0 kcal and logs foods interactively', () => {
    expect(foodLogService.eatenCalories()).toBe(0);

    foodLogService.logProduct(mockProduct, 'breakfast', 500, 'eaten');

    expect(foodLogService.eatenCalories()).toBe(325); // 5 * 65 = 325
    expect(foodLogService.dailySummary().eatenProtein).toBe(55); // 5 * 11 = 55
  });

  it('5. Step 8: Shopping list items, checkable states and totals', () => {
    shoppingListService.generateListFromPlan();

    const items = shoppingListService.items();
    expect(items.length).toBeGreaterThan(0);

    const summary = shoppingListService.summary();
    expect(summary.totalCost).toBeGreaterThan(0);
    expect(summary.totalCalories).toBeGreaterThan(0);

    const firstItem = items[0];
    const initialChecked = firstItem.isChecked;
    shoppingListService.toggleItemChecked(firstItem.id);

    const updatedItem = shoppingListService.items().find(i => i.id === firstItem.id);
    expect(updatedItem?.isChecked).toBe(!initialChecked);
  });

  it('6. Step 9: Complete guest reset wipes all user data and resets signals', async () => {
    await storageService.saveProfile({
      id: 'guest_profile',
      name: 'Mario',
      birthDate: '1990-05-14',
      gender: 'male',
      currentWeight: 82.0,
      height: 180,
      targetWeight: 75.0,
      activityLevel: 'moderate',
      goal: 'lose_weight',
      createdAt: '',
      updatedAt: ''
    });

    await storageService.addWeightEntry(82.0, '2026-10-01');
    expect(storageService.profile()).not.toBeNull();
    expect(storageService.weightHistory().length).toBeGreaterThan(0);

    const success = await storageService.resetAllData();
    expect(success).toBe(true);
    expect(storageService.profile()).toBeNull();
    expect(storageService.weightHistory().length).toBe(0);
    expect(localStorage.getItem('downkilos_user_profile')).toBeNull();
  });

  it('7. Step 10: Weekly weight tracking and sync with profile', async () => {
    const profile: UserProfile = {
      id: 'guest_profile',
      name: 'Mario',
      birthDate: '1990-05-14',
      gender: 'male',
      currentWeight: 82.0,
      height: 180,
      targetWeight: 75.0,
      activityLevel: 'moderate',
      goal: 'lose_weight',
      createdAt: '',
      updatedAt: ''
    };
    await storageService.saveProfile(profile);

    // Initial starting weight on 2026-10-01
    storageService.saveWeightHistory([{
      id: 'w_start',
      date: '2026-10-01',
      weight: 82.0,
      note: 'Start'
    }]);
    expect(storageService.weightHistory().length).toBe(1);

    // Week 2 check-in on 2026-10-08
    await storageService.addWeightEntry(80.5, '2026-10-08', 'Erste Woche geschafft');
    expect(storageService.weightHistory().length).toBe(2);

    // Profile updated to latest weight
    expect(storageService.profile()?.currentWeight).toBe(80.5);

    // Editing entry
    const week2 = storageService.weightHistory().find(e => e.date === '2026-10-08')!;
    await storageService.updateWeightEntry(week2.id, 80.2, '2026-10-08', 'Korrigiert');
    expect(storageService.profile()?.currentWeight).toBe(80.2);
  });

  it('8. Complete Master Prompt V3.0 Flow: Personal Data -> Calorie Goal -> Retailer & Budget -> Dietary Profile -> Meal Planner -> Shopping List Sync -> Onboarding Completed', async () => {
    // 1. Eingabe persönlicher Daten (/onboarding)
    const userProfile: UserProfile = {
      id: 'guest_profile',
      name: 'Mario',
      birthDate: '1990-05-14',
      gender: 'male',
      currentWeight: 82.0,
      height: 180,
      targetWeight: 75.0,
      activityLevel: 'moderate',
      goal: 'lose_weight',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await storageService.saveProfile(userProfile);

    // 2. Kalorienberechnung & persönliches Ziel (/calculator)
    const calculation = calorieService.calculate(userProfile);
    expect(calculation.dailyTargetKcal).toBeGreaterThanOrEqual(1500);

    // 3. Marktauswahl & Wochenbudget (/retailers)
    storageService.saveWeeklyBudget(50);
    expect(storageService.loadWeeklyBudget()).toBe(50);

    // 4. Ernährungsprofil erfassen (/dietary-profile)
    const dietaryProfile: DietaryProfile = {
      dietaryForm: 'vegetarian',
      intolerances: ['Laktose'],
      allergies: [],
      customExcludedFoods: [],
      dislikes: ['Koriander']
    };
    storageService.saveDietaryProfile(dietaryProfile);
    expect(storageService.dietaryProfile()?.dietaryForm).toBe('vegetarian');

    // 5. Intelligenter 7-Tage-Wochenplan wird passend zum Ernährungsprofil generiert (/meal-planner)
    mealPlannerService.generateWeeklyPlan();
    const plan = mealPlannerService.weeklyPlan();
    expect(plan.length).toBe(7);

    // Alle Rezepte beachten das vegetarische Profil
    for (const day of plan) {
      expect(day.breakfast.dietType).not.toBe('omnivore');
      expect(day.lunch.dietType).not.toBe('omnivore');
    }

    // 6. Portionen anpassen & Mahlzeit auf Werktage wiederholen
    mealPlannerService.setMealPortions(0, 'breakfast', 2);
    mealPlannerService.repeatMealWorkdays(0, 'breakfast');
    const updatedPlan = mealPlannerService.weeklyPlan();
    expect(updatedPlan[0].portions?.breakfast).toBe(2);
    expect(updatedPlan[4].portions?.breakfast).toBe(2);

    // 7. Automatische Packungs-, Mengen- und Budgetanalyse
    const budgetSummary = mealPlannerService.weeklyBudgetSummary();
    expect(budgetSummary.weeklyBudget).toBe(50);
    expect(budgetSummary.actualFullPackageCost).toBeGreaterThan(0);
    expect(budgetSummary.totalShoppingListCalories).toBeGreaterThan(0);
    expect(budgetSummary.surplusItems.length).toBeGreaterThan(0);

    // 8. Manuell einen zusätzlichen Artikel auf die Einkaufsliste setzen
    shoppingListService.addCustomItem('Olivenöl Extra Vergine', 4.99, 'pantry', '750 ml', 600);
    expect(shoppingListService.items().length).toBe(1);

    // 9. Einkaufsliste mit dem Wochenplan synchronisieren
    shoppingListService.syncWithWeeklyPlan(updatedPlan);
    expect(shoppingListService.items().length).toBeGreaterThan(1);
    // Manueller Artikel bleibt erhalten!
    expect(shoppingListService.items().some(i => i.name === 'Olivenöl Extra Vergine')).toBe(true);

    // 10. Wochenplan abschließen (/loading -> /dashboard)
    storageService.setOnboardingCompleted(true);
    expect(storageService.isOnboardingCompleted()).toBe(true);
  });
});
