import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ProfileEditComponent } from './profile-edit.component';
import { StorageService } from '../../../core/services/storage.service';
import { CalorieCalculatorService } from '../../../core/services/calorie-calculator.service';
import { UserProfile } from '../../../core/models/user-profile.model';

describe('ProfileEditComponent', () => {
  let component: ProfileEditComponent;
  let fixture: ComponentFixture<ProfileEditComponent>;
  let router: Router;
  let storageService: StorageService;

  const mockProfile: UserProfile = {
    id: 'guest_profile',
    name: 'Mario',
    email: 'mario@example.com',
    birthDate: '1990-05-14',
    gender: 'male',
    currentWeight: 80,
    height: 178,
    targetWeight: 72,
    activityLevel: 'moderate',
    goal: 'lose_weight',
    createdAt: '',
    updatedAt: ''
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ProfileEditComponent],
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
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(ProfileEditComponent);
    component = fixture.componentInstance;
    await component.ngOnInit();
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('1. should create the profile edit component', () => {
    expect(component).toBeTruthy();
  });

  it('2. should pre-populate existing profile data into form signals', () => {
    expect(component.name()).toBe('Mario');
    expect(component.email()).toBe('mario@example.com');
    expect(component.birthDate()).toBe('1990-05-14');
    expect(component.gender()).toBe('male');
  });

  it('3. should show error when name is empty', async () => {
    component.name.set('   ');
    await component.saveChanges();

    expect(component.errorMessage()).toBe('Bitte gib deinen Namen ein.');
    expect(storageService.saveProfile).not.toHaveBeenCalled();
  });

  it('4. should save updated profile to storageService and navigate to /settings', async () => {
    component.name.set('Roman');
    component.gender.set('male');
    await component.saveChanges();

    expect(storageService.saveProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Roman',
        gender: 'male'
      })
    );
    expect(component.toastMessage()).toContain('erfolgreich');
  });

  it('5. should navigate to /settings on goBack()', () => {
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/settings']);
  });

  it('6. should navigate to /settings/goals on goToGoals()', () => {
    component.goToGoals();
    expect(router.navigate).toHaveBeenCalledWith(['/settings/goals']);
  });
});
