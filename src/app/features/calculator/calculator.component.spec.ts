import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CalculatorComponent } from './calculator.component';
import { StorageService } from '../../core/services/storage.service';
import { CalorieCalculatorService } from '../../core/services/calorie-calculator.service';
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

  it('should calculate and display calories correctly on overview tab', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Mein Kalorienbedarf');
    expect(el.textContent).toContain('Erhaltungsbedarf');
    expect(el.textContent).toContain('Kaloriendefizit');
    expect(component.calc()).not.toBeNull();
  });

  it('should switch between Übersicht and Details tabs', () => {
    component.activeTab.set('details');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Eiweiß');
    expect(el.textContent).toContain('Kohlenhydrate');
    expect(el.textContent).toContain('Fette');

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
});
