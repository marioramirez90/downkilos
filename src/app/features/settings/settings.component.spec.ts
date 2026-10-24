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

  it('2. should display settings cards matching reference design', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Einstellungen');
    expect(el.textContent).toContain('Profil bearbeiten');
    expect(el.textContent).toContain('App-Einstellungen');
    expect(el.textContent).toContain('Datenschutz');
    expect(el.textContent).toContain('Hilfe & Support');
    expect(el.textContent).toContain('App bewerten');
    expect(el.textContent).toContain('Über Down Kilos');
    expect(el.textContent).toContain('Alle Daten zurücksetzen');
    expect(component.appVersion).toBe('1.0.0');
  });

  it('3. should navigate to /settings/profile when clicking Profil bearbeiten (NOT to onboarding)', () => {
    component.openEditProfile();
    expect(router.navigate).toHaveBeenCalledWith(['/settings/profile']);
  });

  it('4. should navigate to /settings/goals when calling openEditGoal', () => {
    component.openEditGoal();
    expect(router.navigate).toHaveBeenCalledWith(['/settings/goals']);
  });

  it('5. should open confirmation modal when clicking Alle Daten zurücksetzen', () => {
    expect(component.showResetDialog()).toBe(false);

    component.confirmResetModal();
    fixture.detectChanges();

    expect(component.showResetDialog()).toBe(true);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Alle Daten zurücksetzen?');
    expect(el.textContent).toContain('Ja, alles löschen');
  });

  it('6. should close modal when clicking Abbrechen', () => {
    component.confirmResetModal();
    expect(component.showResetDialog()).toBe(true);

    component.cancelReset();
    expect(component.showResetDialog()).toBe(false);
  });

  it('7. should call storageService.resetAllData and navigate to / on confirm', async () => {
    const resetSpy = vi.spyOn(storageService, 'resetAllData').mockResolvedValue(true);

    await component.executeReset();

    expect(resetSpy).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('8. should navigate back to /dashboard when clicking back arrow or brand link', () => {
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);

    component.goToDashboard();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('9. should open info modals for privacy, app settings, support, and about', () => {
    component.openPrivacy();
    expect(component.showPrivacyModal()).toBe(true);

    component.openAppSettings();
    expect(component.showAppSettingsModal()).toBe(true);

    component.openSupport();
    expect(component.showSupportModal()).toBe(true);

    component.openAbout();
    expect(component.showAboutModal()).toBe(true);
  });
});
