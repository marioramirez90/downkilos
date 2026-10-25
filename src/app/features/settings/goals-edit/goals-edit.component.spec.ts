import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { GoalsEditComponent } from './goals-edit.component';
import { StorageService } from '../../../core/services/storage.service';
import { CalorieCalculatorService } from '../../../core/services/calorie-calculator.service';
import { UserProfile } from '../../../core/models/user-profile.model';

describe('GoalsEditComponent', () => {
  let component: GoalsEditComponent;
  let fixture: ComponentFixture<GoalsEditComponent>;
  let router: Router;
  let storageService: StorageService;

  const mockProfile: UserProfile = {
    id: 'guest_profile',
    name: 'Sabrina Müller',
    birthDate: '1990-05-14',
    gender: 'female',
    currentWeight: 78,
    height: 168,
    targetWeight: 68,
    activityLevel: 'light',
    goal: 'lose_weight',
    targetPaceWeeklyKg: 0.5,
    dietaryPreference: 'omnivore',
    allergies: [],
    createdAt: '',
    updatedAt: ''
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [GoalsEditComponent],
      providers: [
        provideRouter([]),
        StorageService,
        CalorieCalculatorService
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    storageService = TestBed.inject(StorageService);
    vi.spyOn(storageService, 'loadProfile').mockResolvedValue(mockProfile);
    vi.spyOn(storageService, 'saveProfile').mockResolvedValue();
    vi.spyOn(storageService, 'addWeightEntry').mockResolvedValue();
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(GoalsEditComponent);
    component = fixture.componentInstance;
    await component.ngOnInit();
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('1. should create the goals edit component', () => {
    expect(component).toBeTruthy();
  });

  it('2. should pre-populate existing body data and goals from profile', () => {
    expect(component.height()).toBe(168);
    expect(component.currentWeight()).toBe(78);
    expect(component.targetWeight()).toBe(68);
    expect(component.activityLevel()).toBe('light');
    expect(component.goal()).toBe('lose_weight');
    expect(component.targetPaceWeeklyKg()).toBe(0.5);
  });

  it('3. should calculate a realistic daily calorie target', () => {
    const cals = component.calculatedTargetCalories();
    expect(cals).toBeGreaterThan(1200);
    expect(cals).toBeLessThan(3500);
  });

  it('4. should log weight entry when current weight is updated', async () => {
    component.currentWeight.set(77);
    await component.saveChanges();

    expect(storageService.addWeightEntry).toHaveBeenCalledWith(
      77,
      undefined,
      'Aktualisiert in Einstellungen'
    );
    expect(storageService.saveProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        currentWeight: 77
      })
    );
  });

  it('5. should update dietary preferences and allergies correctly', async () => {
    component.isVegetarian.set(true);
    component.isLactoseFree.set(true);
    component.isGlutenFree.set(true);

    await component.saveChanges();

    expect(storageService.saveProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        dietaryPreference: 'vegetarian',
        allergies: expect.arrayContaining(['laktosefrei', 'glutenfrei'])
      })
    );
    expect(component.toastMessage()).toContain('erfolgreich');
  });

  it('6. should validate height and weight bounds', async () => {
    component.height.set(50);
    await component.saveChanges();
    expect(component.errorMessage()).toContain('Körpergröße');

    component.height.set(170);
    component.currentWeight.set(10);
    await component.saveChanges();
    expect(component.errorMessage()).toContain('Gewicht');
  });

  it('7. should navigate to /settings on goBack()', () => {
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/settings']);
  });

  it('8. should navigate to /dietary-profile with returnUrl /settings/goals on goToDietaryProfile()', () => {
    component.goToDietaryProfile();
    expect(router.navigate).toHaveBeenCalledWith(['/dietary-profile'], {
      queryParams: { returnUrl: '/settings/goals' }
    });
  });
});
