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

  const testProfile: UserProfile = {
    id: 'guest_profile',
    name: 'Mario Rossi',
    birthDate: '1990-05-14',
    gender: 'male',
    currentWeight: 82,
    height: 180,
    activityLevel: 'moderate',
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
    storageService.profile.set(testProfile);
    vi.spyOn(storageService, 'loadProfile').mockResolvedValue(testProfile);
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
    expect(el.textContent).toContain('Hallo Mario!');
    expect(el.textContent).toContain('Hier ist dein persönlicher Kalorienbedarf');
    expect(el.textContent).toContain('Erhaltungsbedarf');
    expect(el.textContent).toContain('Tägliches Defizit');
    expect(el.textContent).toContain('Tagesziel');
    expect(el.textContent).toContain('Deine mögliche Entwicklung');
    expect(el.textContent).toContain('in 4 Wochen');
    expect(el.textContent).toContain('in 3 Monaten');
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
    expect(el.textContent).toContain('Tagesziel');
  });

  it('should navigate to /retailers on clicking CTA button', () => {
    component.goToRetailers();
    expect(router.navigate).toHaveBeenCalledWith(['/retailers']);
  });

  it('should navigate back to /onboarding on clicking back button', () => {
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/onboarding']);
  });

  it('should adapt explanation text and deficit when goal is maintain_weight', () => {
    storageService.profile.set({
      ...testProfile,
      goal: 'maintain_weight'
    });
    fixture.detectChanges();

    expect(component.deficitDisplay()).toBe('0');
    expect(component.deficitSubtitle()).toContain('Gewicht stabil halten');
    expect(component.explanationHeadline()).toContain('Erhaltungsbedarf');
  });

  it('should adapt explanation text when goal is gain_weight', () => {
    storageService.profile.set({
      ...testProfile,
      goal: 'gain_weight'
    });
    fixture.detectChanges();

    expect(component.deficitDisplay()).toContain('+');
    expect(component.deficitSubtitle()).toContain('Muskelaufbau');
    expect(component.explanationHeadline()).toContain('Kalorienüberschuss');
  });

  it('should redirect to /onboarding if no profile exists on init', async () => {
    vi.mocked(storageService.loadProfile).mockResolvedValueOnce(null);
    storageService.profile.set(null);
    await component.ngOnInit();
    expect(router.navigate).toHaveBeenCalledWith(['/onboarding']);
  });
});
