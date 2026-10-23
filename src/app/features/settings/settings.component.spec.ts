import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { SettingsComponent } from './settings.component';
import { StorageService } from '../../core/services/storage.service';
import { CalorieCalculatorService } from '../../core/services/calorie-calculator.service';
import { UserProfile } from '../../core/models/user-profile.model';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let router: Router;
  let storageService: StorageService;

  const mockProfile: UserProfile = {
    id: 'guest_profile',
    name: 'Mario Ramirez',
    birthDate: '1990-05-14',
    gender: 'male',
    currentWeight: 82,
    height: 180,
    targetWeight: 75,
    activityLevel: 'moderate',
    goal: 'lose_weight',
    createdAt: '',
    updatedAt: ''
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        provideRouter([]),
        StorageService,
        CalorieCalculatorService
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    storageService = TestBed.inject(StorageService);
    vi.spyOn(storageService, 'loadProfile').mockResolvedValue(mockProfile);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    await component.ngOnInit();
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('1. should create the settings component', () => {
    expect(component).toBeTruthy();
  });

  it('2. should display profile details (Vorname, Gewicht, Größe, Ziel)', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Mario');
    expect(el.textContent).toContain('82 kg');
    expect(el.textContent).toContain('180 cm');
    expect(el.textContent).toContain('Mein Profil und Ziel');
    expect(component.userFirstName()).toBe('Mario');
  });

  it('3. should display calorie metrics (Tagesziel, Erhaltungsbedarf, Defizit)', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Tages-Kalorienziel');
    expect(component.targetCalories()).toBeGreaterThan(1200);
    expect(component.maintenanceCalories()).toBeGreaterThan(component.targetCalories());
    expect(component.calorieDeficit()).toBeGreaterThan(0);
  });

  it('4. should navigate to /onboarding when clicking Profil bearbeiten', () => {
    component.openEditProfile();
    expect(router.navigate).toHaveBeenCalledWith(['/onboarding']);
  });

  it('5. should navigate to /calculator when clicking Kalorienziel bearbeiten', () => {
    component.openEditGoal();
    expect(router.navigate).toHaveBeenCalledWith(['/calculator']);
  });

  it('6. should open confirmation modal when clicking Alle meine Daten zurücksetzen', () => {
    expect(component.showResetDialog()).toBe(false);

    component.confirmResetModal();
    fixture.detectChanges();

    expect(component.showResetDialog()).toBe(true);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Down Kilos zurücksetzen?');
    expect(el.textContent).toContain('Alle Daten löschen');
  });

  it('7. should close modal when clicking Abbrechen', () => {
    component.confirmResetModal();
    expect(component.showResetDialog()).toBe(true);

    component.cancelReset();
    expect(component.showResetDialog()).toBe(false);
  });

  it('8. should call storageService.resetAllData and navigate to / on confirm', async () => {
    const resetSpy = vi.spyOn(storageService, 'resetAllData').mockResolvedValue(true);

    await component.executeReset();

    expect(resetSpy).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('9. should navigate back to /dashboard when clicking back arrow', () => {
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
