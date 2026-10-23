import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { LoadingComponent } from './loading.component';
import { StorageService } from '../../core/services/storage.service';
import { CalorieCalculatorService } from '../../core/services/calorie-calculator.service';
import { ProductService } from '../../core/services/product.service';

describe('LoadingComponent', () => {
  let component: LoadingComponent;
  let fixture: ComponentFixture<LoadingComponent>;
  let router: Router;
  let storageService: StorageService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoadingComponent],
      providers: [
        provideRouter([]),
        StorageService,
        CalorieCalculatorService,
        ProductService
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    storageService = TestBed.inject(StorageService);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(LoadingComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the loading component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the brand title and leaf icon', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Down Kilos');
    expect(el.querySelector('.leaf-icon')).toBeTruthy();
    expect(el.querySelector('.ring-spinner-svg')).toBeTruthy();
  });

  it('should complete preparation, set onboarding completed and navigate to /dashboard', async () => {
    vi.useFakeTimers();
    try {
      const setCompletedSpy = vi.spyOn(storageService, 'setOnboardingCompleted');
      await component.startPreparation();
      vi.advanceTimersByTime(1600);

      expect(setCompletedSpy).toHaveBeenCalledWith(true);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should display error box if preparation throws error', async () => {
    vi.spyOn(storageService, 'loadProfile').mockRejectedValue(new Error('DB failure'));
    await component.startPreparation();

    expect(component.hasError()).toBe(true);
    expect(component.errorMessage()).toContain('Die Vorbereitung konnte nicht abgeschlossen werden');
  });
});
