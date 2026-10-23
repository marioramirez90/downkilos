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

  it('should initialize with default values matching reference design (Lisa Müller, 78kg, 168cm)', () => {
    expect(component.form.value.name).toBe('Lisa Müller');
    expect(component.form.value.currentWeight).toBe(78);
    expect(component.form.value.height).toBe(168);
    expect(component.form.value.activityLevel).toBe('sedentary');
  });

  it('should validate invalid weight or empty name', () => {
    component.form.patchValue({ name: '', currentWeight: 10 });
    expect(component.form.valid).toBe(false);
    expect(component.form.get('name')?.valid).toBe(false);
    expect(component.form.get('currentWeight')?.valid).toBe(false);
  });

  it('should save profile and navigate to /retailers on submit', async () => {
    const saveSpy = vi.spyOn(storageService, 'saveProfile');
    await component.onSubmit();
    expect(saveSpy).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/retailers']);
  });

  it('should update activityLevel when selectActivity is called', () => {
    component.selectActivity('moderate');
    expect(component.form.value.activityLevel).toBe('moderate');
  });
});
