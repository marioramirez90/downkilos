import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { LoadingComponent } from './loading.component';
import { StorageService } from '../../core/services/storage.service';
import { CalorieCalculatorService } from '../../core/services/calorie-calculator.service';
import { ProductService } from '../../core/services/product.service';
import { RetailerService } from '../../core/services/retailer.service';
import { UserProfile } from '../../core/models/user-profile.model';

describe('LoadingComponent', () => {
  let component: LoadingComponent;
  let fixture: ComponentFixture<LoadingComponent>;
  let router: Router;
  let storageService: StorageService;

  const testProfile: UserProfile = {
    id: 'guest_profile',
    name: 'Mario',
    birthDate: '1990-05-14',
    gender: 'male',
    height: 180,
    currentWeight: 82,
    activityLevel: 'moderate',
    goal: 'lose_weight',
    createdAt: '',
    updatedAt: ''
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoadingComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'quick' ? 'true' : null)
              }
            }
          }
        },
        StorageService,
        CalorieCalculatorService,
        ProductService,
        RetailerService
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    storageService = TestBed.inject(StorageService);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.spyOn(storageService, 'loadProfile').mockResolvedValue(testProfile);

    fixture = TestBed.createComponent(LoadingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the loading component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the animated SVG ring and leaf icon', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.leaf-icon')).toBeTruthy();
    expect(el.querySelector('.ring-spinner-svg')).toBeTruthy();
    expect(el.querySelector('.loader-arcs-spinning-group')).toBeTruthy();
  });

  it('should execute dashboard preparation and navigate to /dashboard in default mode', async () => {
    vi.useFakeTimers();
    try {
      const setCompletedSpy = vi.spyOn(storageService, 'setOnboardingCompleted');
      await component.startExecution();
      vi.runAllTimers();

      expect(setCompletedSpy).toHaveBeenCalledWith(true);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should execute calorie calculation and navigate to /calculator when step=calculate', async () => {
    vi.useFakeTimers();
    try {
      component.mode.set('calculate');
      component.title.set('Wir berechnen dein persönliches Kalorienziel …');
      component.subtitle.set('Dein Ziel wird individuell aus deinen Angaben ermittelt.');

      await component.startExecution();
      vi.runAllTimers();

      expect(router.navigate).toHaveBeenCalledWith(['/calculator']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should display error box if preparation throws error', async () => {
    vi.mocked(storageService.loadProfile).mockRejectedValue(new Error('DB failure'));
    await component.startExecution();
    fixture.detectChanges();

    expect(component.hasError()).toBe(true);
    expect(component.errorMessage()).toContain('Die Vorbereitung konnte nicht abgeschlossen werden');
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.error-box')).toBeTruthy();
  });
});
