import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { StorageService } from '../../core/services/storage.service';
import { UserProfile } from '../../core/models/user-profile.model';
import { MealScheduleService } from '../../core/services/meal-schedule.service';
import { MealPlannerService } from '../../core/services/meal-planner.service';

describe('DashboardComponent (V5.0)', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let router: Router;
  let storageService: StorageService;
  let mealScheduleService: MealScheduleService;
  let mealPlannerService: MealPlannerService;

  const mockProfile: UserProfile = {
    id: 'guest_profile',
    name: 'Lisa Müller',
    birthDate: '1990-05-14',
    gender: 'female',
    currentWeight: 78.4,
    height: 168,
    targetWeight: 70,
    activityLevel: 'sedentary',
    goal: 'lose_weight',
    createdAt: '',
    updatedAt: ''
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    router = TestBed.inject(Router);
    storageService = TestBed.inject(StorageService);
    mealScheduleService = TestBed.inject(MealScheduleService);
    mealPlannerService = TestBed.inject(MealPlannerService);

    vi.spyOn(storageService, 'loadProfile').mockResolvedValue(mockProfile);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    await component.ngOnInit();
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the dashboard component', () => {
    expect(component).toBeTruthy();
  });

  it('1. should personalize the greeting with first name from profile (Hallo Lisa!)', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Hallo Lisa!');
    expect(component.userFirstName()).toBe('Lisa');
  });

  it('2. should load daily calorie target from user profile calculation', () => {
    expect(component.targetKcal()).toBeGreaterThan(1200);
  });

  it('3. should calculate calorie ring progress and dashoffset correctly', () => {
    expect(component.calorieDashOffset()).toBeGreaterThanOrEqual(0);
    expect(component.calorieDashOffset()).toBeLessThanOrEqual(340);
  });

  it('4. should render Dein Markt with Netto', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Dein Markt');
    expect(el.textContent).toContain('Netto');
  });

  it('5. should display latest weight from history or profile (78,4 kg)', () => {
    expect(component.formattedCurrentWeight()).toBe('78,4 kg');
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('78,4 kg');
    expect(el.textContent).toContain('Dein aktuelles Gewicht');
  });

  it('6. should immediately update weight when a new weight entry is logged', async () => {
    await storageService.addWeightEntry(77.8, '2026-10-25');
    fixture.detectChanges();
    expect(component.formattedCurrentWeight()).toBe('77,8 kg');
  });

  it('7. should render Bereits gegessen and calculate eaten calories correctly', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Bereits gegessen');
    expect(component.eatenKcal()).toBe(component.foodLogService.eatenCalories());
  });

  it('8. should render Noch verfügbar and calculate remaining calories correctly', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Noch verfügbar');
    expect(component.remainingKcal()).toBe(Math.max(0, component.targetKcal() - component.eatenKcal()));
  });

  it('9. should show Monday breakfast at 09:00 on Monday', () => {
    // 2026-10-26 is a Monday
    const mondayMorning = new Date('2026-10-26T09:00:00');
    mealScheduleService.setCurrentTime(mondayMorning);
    fixture.detectChanges();

    expect(mealScheduleService.weekdayName()).toBe('Montag');
    expect(mealScheduleService.baseTimeSlot()).toBe('breakfast');
    expect(mealScheduleService.dynamicHeading()).toBe('Frühstück für Montag');
    expect(mealScheduleService.dynamicTimeRangeText()).toBe('06:00 – 12:00 Uhr');
  });

  it('10. should show Monday lunch at 13:00 on Monday', () => {
    const mondayNoon = new Date('2026-10-26T13:00:00');
    mealScheduleService.setCurrentTime(mondayNoon);
    fixture.detectChanges();

    expect(mealScheduleService.baseTimeSlot()).toBe('lunch');
    expect(mealScheduleService.dynamicHeading()).toBe('Mittagessen für Montag');
    expect(mealScheduleService.dynamicTimeRangeText()).toBe('12:00 – 17:00 Uhr');
  });

  it('11. should show Monday dinner at 19:00 on Monday', () => {
    const mondayEvening = new Date('2026-10-26T19:00:00');
    mealScheduleService.setCurrentTime(mondayEvening);
    fixture.detectChanges();

    expect(mealScheduleService.baseTimeSlot()).toBe('dinner');
    expect(mealScheduleService.dynamicHeading()).toBe('Abendessen für Montag');
    expect(mealScheduleService.dynamicTimeRangeText()).toBe('17:00 – 23:00 Uhr');
  });

  it('12. should load recipe from actual weekly plan for the current slot', () => {
    const mondayMorning = new Date('2026-10-26T09:00:00');
    mealScheduleService.setCurrentTime(mondayMorning);
    fixture.detectChanges();

    const recipe = component.currentRecipe();
    expect(recipe).toBeTruthy();
    expect(recipe?.mealType).toBe('breakfast');
  });

  it('13. should navigate to recipe details when clicking recipe image or title', () => {
    const recipe = component.currentRecipe();
    expect(recipe).toBeTruthy();
    component.openRecipe(recipe!.id);
    expect(router.navigate).toHaveBeenCalledWith(['/recipes', recipe!.id]);
  });

  it('14. should log recipe as eaten when clicking Schon gegessen', () => {
    const mondayMorning = new Date('2026-10-26T09:00:00');
    mealScheduleService.setCurrentTime(mondayMorning);
    component.foodLogService.clearTodayLog();
    fixture.detectChanges();

    const recipe = component.currentRecipe();
    expect(recipe).toBeTruthy();
    const recipeCals = recipe!.calories;

    const dummyEvent = new MouseEvent('click');
    component.onAlreadyEatenClick(dummyEvent);

    expect(component.foodLogService.eatenCalories()).toBe(recipeCals);
    expect(component.toastMessage()).toContain('Mahlzeit eingetragen');
  });

  it('15. should prevent duplicate logs on repeated clicks', () => {
    const mondayMorning = new Date('2026-10-26T09:00:00');
    mealScheduleService.setCurrentTime(mondayMorning);
    component.foodLogService.clearTodayLog();
    fixture.detectChanges();

    const dummyEvent = new MouseEvent('click');
    component.onAlreadyEatenClick(dummyEvent);
    const initialCount = component.foodLogService.loggedItems().length;

    // Second click should not duplicate
    component.onAlreadyEatenClick(dummyEvent);
    expect(component.foodLogService.loggedItems().length).toBe(initialCount);
  });

  it('16. should support Undo (Rückgängig) to remove logged meal', () => {
    const mondayMorning = new Date('2026-10-26T09:00:00');
    mealScheduleService.setCurrentTime(mondayMorning);
    component.foodLogService.clearTodayLog();
    fixture.detectChanges();

    const dummyEvent = new MouseEvent('click');
    component.onAlreadyEatenClick(dummyEvent);
    expect(component.foodLogService.eatenCalories()).toBeGreaterThan(0);

    component.undoLastEaten();
    expect(component.foodLogService.eatenCalories()).toBe(0);
    expect(component.toastMessage()).toContain('rückgängig');
  });

  it('17. should advance to next meal (lunch) after breakfast is logged as eaten', () => {
    const mondayMorning = new Date('2026-10-26T09:00:00');
    mealScheduleService.setCurrentTime(mondayMorning);
    component.foodLogService.clearTodayLog();
    fixture.detectChanges();

    expect(mealScheduleService.activeMealSlot()).toBe('breakfast');

    const dummyEvent = new MouseEvent('click');
    component.onAlreadyEatenClick(dummyEvent);
    fixture.detectChanges();

    expect(mealScheduleService.activeMealSlot()).toBe('lunch');
    expect(mealScheduleService.dynamicHeading()).toBe('Mittagessen für Montag');
  });

  it('18. should navigate to shopping list when clicking Einkaufsliste öffnen', () => {
    component.goToShoppingList();
    expect(router.navigate).toHaveBeenCalledWith(['/shopping-list']);
  });

  it('19. should navigate to meal planner when clicking Weitere Rezepte', () => {
    component.goToMealPlanner();
    expect(router.navigate).toHaveBeenCalledWith(['/meal-planner']);
  });

  it('20. should navigate to weight page when clicking weight card', () => {
    component.goToWeight();
    expect(router.navigate).toHaveBeenCalledWith(['/gewicht']);
  });

  it('21. should navigate to retailer selection when clicking market card', () => {
    component.goToMarketSelection();
    expect(router.navigate).toHaveBeenCalledWith(['/retailers']);
  });

  it('22. should navigate to settings when clicking gear button', () => {
    component.goToSettings();
    expect(router.navigate).toHaveBeenCalledWith(['/settings']);
  });
});
