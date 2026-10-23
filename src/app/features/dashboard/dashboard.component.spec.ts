import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { StorageService } from '../../core/services/storage.service';
import { ShoppingListService } from '../../core/services/shopping-list.service';
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

  it('should render Area A: Dein Kalorienziel für heute with eaten and remaining calories', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Dein Kalorienziel für heute');
    expect(el.textContent).toContain('Bereits gegessen');
    expect(el.textContent).toContain('Noch verfügbar');
    expect(component.targetKcal()).toBeGreaterThan(0);
  });

  it('should render Area B: Was möchtest du heute essen? with Netto products', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Was möchtest du heute essen?');
    expect(el.textContent).toContain('Entdecke Lebensmittel bei Netto');
    expect(component.featuredProducts().length).toBeGreaterThan(0);
  });

  it('should filter featured products when searching', () => {
    component.searchQuery.set('Toast');
    fixture.detectChanges();
    const filtered = component.filteredFeaturedProducts();
    expect(filtered.some(f => f.product.name.toLowerCase().includes('toast'))).toBe(true);
  });

  it('should navigate to /discover when clicking Alle Netto-Produkte entdecken', () => {
    component.goToAllProducts();
    expect(router.navigate).toHaveBeenCalledWith(['/discover']);
  });

  // TEST H / Test 10: Dashboard & Trennung von Einkaufen vs. Essen
  it('Test H – Dashboard: Hinzufügen zur Einkaufsliste darf die gegessenen Tageskalorien nicht verändern', () => {
    const initialEatenCalories = component.foodLogService.dailySummary().eatenCalories;
    const shoppingService = TestBed.inject(ShoppingListService);

    // Ein Produkt mit vielen Kalorien zur Einkaufsliste hinzufügen
    shoppingService.addCustomItem('1 kg Toastbrot & Bananen', 3.99, 'grains', '1 kg', 2500);

    // Gegessene Kalorien auf dem Dashboard / im Tageskonto dürfen sich NICHT verändert haben
    const eatenAfterShopping = component.foodLogService.dailySummary().eatenCalories;
    expect(eatenAfterShopping).toBe(initialEatenCalories);
  });
});
