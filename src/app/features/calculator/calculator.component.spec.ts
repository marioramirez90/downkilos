import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CalculatorComponent } from './calculator.component';
import { StorageService } from '../../core/services/storage.service';
import { UserProfile } from '../../core/models/user-profile.model';

describe('CalculatorComponent', () => {
  let component: CalculatorComponent;
  let fixture: ComponentFixture<CalculatorComponent>;
  let router: Router;
  let storageService: StorageService;

  const mockProfile: UserProfile = {
    id: 'guest_profile',
    name: 'Lisa Müller',
    birthDate: '1990-05-14',
    gender: 'female',
    currentWeight: 78,
    height: 168,
    activityLevel: 'sedentary',
    goal: 'lose_weight',
    createdAt: '',
    updatedAt: ''
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [CalculatorComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    router = TestBed.inject(Router);
    storageService = TestBed.inject(StorageService);
    storageService.profile.set(mockProfile);
    vi.spyOn(storageService, 'loadProfile').mockResolvedValue(mockProfile);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(CalculatorComponent);
    component = fixture.componentInstance;
    await component.ngOnInit();
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the calculator component', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate and display calories correctly on overview tab with personal greeting', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Hallo Lisa!');
    expect(el.textContent).toContain('Wir haben deinen persönlichen Kalorienbedarf berechnet.');
    expect(el.textContent).toContain('Dein Erhaltungsbedarf');
    expect(el.textContent).toContain('Dein tägliches Defizit');
    expect(el.textContent).toContain('Deine mögliche Entwicklung');
    expect(el.textContent).toContain('Was bedeutet das für deinen Alltag?');
    expect(component.calc()).not.toBeNull();
    expect(component.formattedTargetKcal()).toBeTruthy();
  });

  it('should switch between Übersicht and Details tabs', () => {
    component.activeTab.set('details');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Optimale Nährstoffverteilung');
    expect(el.textContent).toContain('Eiweiß (Protein)');
    expect(el.textContent).toContain('Kohlenhydrate');
    expect(el.textContent).toContain('Gesunde Fette');

    component.activeTab.set('overview');
    fixture.detectChanges();
    expect(el.textContent).toContain('Tägliches Kalorienziel');
  });

  it('should navigate to /retailers on clicking CTA button', () => {
    component.goToRetailers();
    expect(router.navigate).toHaveBeenCalledWith(['/retailers']);
  });

  it('should navigate back to /onboarding on clicking back button', () => {
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/onboarding']);
  });

  it('should reactively update when profile changes', () => {
    storageService.profile.set({
      ...mockProfile,
      name: 'Michael Schmidt',
      currentWeight: 90
    });
    fixture.detectChanges();

    expect(component.userFirstName()).toBe('Michael');
    expect(component.calc().tdee).toBeGreaterThan(0);
  });
});
