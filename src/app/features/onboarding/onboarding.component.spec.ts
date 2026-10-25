import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { OnboardingComponent } from './onboarding.component';
import { StorageService } from '../../core/services/storage.service';

describe('OnboardingComponent', () => {
  let component: OnboardingComponent;
  let fixture: ComponentFixture<OnboardingComponent>;
  let router: Router;
  let storageService: StorageService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [OnboardingComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    router = TestBed.inject(Router);
    storageService = TestBed.inject(StorageService);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(OnboardingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the onboarding component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with completely empty values on first launch (no dummy data)', () => {
    expect(component.form.value.name).toBe('');
    expect(component.form.value.birthDate).toBe('');
    expect(component.form.value.gender).toBe('');
    expect(component.form.value.height).toBeNull();
    expect(component.form.value.currentWeight).toBeNull();
    expect(component.form.value.targetWeight).toBeNull();
    expect(component.form.value.activityLevel).toBe('');
    expect(component.form.valid).toBe(false);
  });

  it('should validate invalid weight, height, or empty name', () => {
    component.form.patchValue({
      name: '',
      currentWeight: 10,
      height: 50,
      birthDate: '1990-01-01',
      gender: 'female',
      activityLevel: 'sedentary'
    });
    expect(component.form.valid).toBe(false);
    expect(component.form.get('name')?.valid).toBe(false);
    expect(component.form.get('currentWeight')?.valid).toBe(false);
    expect(component.form.get('height')?.valid).toBe(false);
  });

  it('should become valid when all required fields are correctly filled', () => {
    component.form.patchValue({
      name: 'Mario',
      birthDate: '1990-05-14',
      gender: 'male',
      height: 180,
      currentWeight: 82,
      activityLevel: 'moderate',
      goal: 'lose_weight'
    });
    expect(component.form.valid).toBe(true);
  });

  it('should save profile and navigate to /calculator on submit', async () => {
    const saveSpy = vi.spyOn(storageService, 'saveProfile');
    component.form.patchValue({
      name: 'Anna',
      birthDate: '1995-03-20',
      gender: 'female',
      height: 170,
      currentWeight: 68,
      activityLevel: 'light',
      goal: 'lose_weight'
    });

    await component.onSubmit();
    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Anna',
        birthDate: '1995-03-20',
        gender: 'female',
        height: 170,
        currentWeight: 68,
        activityLevel: 'light',
        goal: 'lose_weight'
      })
    );
    expect(router.navigate).toHaveBeenCalledWith(['/loading'], { queryParams: { step: 'calculate' } });
  });

  it('should update activityLevel when selectActivity is called', () => {
    component.selectActivity('moderate');
    expect(component.form.value.activityLevel).toBe('moderate');
  });

  it('should update gender when setGender is called', () => {
    component.setGender('female');
    expect(component.form.value.gender).toBe('female');
  });

  it('should toggle allergy preferences', () => {
    component.toggleAllergy('Laktose');
    expect(component.isAllergySelected('Laktose')).toBe(true);

    component.toggleAllergy('Laktose');
    expect(component.isAllergySelected('Laktose')).toBe(false);
  });

  it('should navigate to /how-it-works when goBack is triggered', () => {
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/how-it-works']);
  });

  it('should display error message and not navigate when submitting invalid form', async () => {
    component.form.patchValue({ name: '' });
    await component.onSubmit();

    expect(component.formErrorMessage).toBeTruthy();
    expect(component.formErrorMessage).toContain('Bitte fülle alle Pflichtfelder');
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.isSubmitting).toBe(false);
  });

  it('should prevent double submission when already submitting', async () => {
    const saveSpy = vi.spyOn(storageService, 'saveProfile');
    component.form.patchValue({
      name: 'Mario',
      birthDate: '1990-05-14',
      gender: 'male',
      height: 180,
      currentWeight: 82,
      activityLevel: 'moderate',
      goal: 'lose_weight'
    });

    component.isSubmitting = true;
    await component.onSubmit();

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should restore draft values from StorageService if available', async () => {
    storageService.saveOnboardingDraft({
      name: 'Max',
      birthDate: '1988-12-01',
      height: 175
    });

    const newFixture = TestBed.createComponent(OnboardingComponent);
    const newComp = newFixture.componentInstance;
    await newComp.ngOnInit();

    expect(newComp.form.value.name).toBe('Max');
    expect(newComp.form.value.birthDate).toBe('1988-12-01');
    expect(newComp.form.value.height).toBe(175);
  });
});
