import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { StorageService } from '../../core/services/storage.service';
import { CalorieCalculatorService } from '../../core/services/calorie-calculator.service';
import { UserProfile } from '../../core/models/user-profile.model';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let router: Router;
  let storageService: StorageService;

  const mockProfile: UserProfile = {
    id: 'guest_profile',
    name: 'Lisa Müller',
    birthDate: '1990-05-14',
    gender: 'female',
    currentWeight: 78,
    height: 168,
    targetWeight: 70,
    activityLevel: 'sedentary',
    goal: 'lose_weight',
    createdAt: '',
    updatedAt: ''
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    router = TestBed.inject(Router);
    storageService = TestBed.inject(StorageService);
    vi.spyOn(storageService, 'loadProfile').mockResolvedValue(mockProfile);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    await component.ngOnInit();
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the dashboard component', () => {
    expect(component).toBeTruthy();
  });

  it('should personalize the greeting with first name', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Hallo, Lisa!');
  });

  it('should render calorie ring, eaten and target calories', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toMatch(/1[.,]?487/);
    expect(el.textContent).toContain('Tagesbedarf');
    expect(el.textContent).toContain('kcal übrig');
  });

  it('should render macro progress bars for Eiweiß, Kohlenhydrate, Fett', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Eiweiß');
    expect(el.textContent).toContain('Kohlenhydrate');
    expect(el.textContent).toContain('Fett');
  });

  it('should navigate to meal planner when clicking Mahlzeiten planen', () => {
    component.goToMealPlanner();
    expect(router.navigate).toHaveBeenCalledWith(['/meal-planner']);
  });

  it('should navigate to shopping list when clicking Einkaufsliste öffnen', () => {
    component.goToShoppingList();
    expect(router.navigate).toHaveBeenCalledWith(['/shopping-list']);
  });
});
