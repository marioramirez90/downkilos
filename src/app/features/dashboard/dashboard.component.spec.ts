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

  it('1. should personalize the greeting with first name from profile (Hallo Lisa!)', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Hallo Lisa!');
    expect(component.userFirstName()).toBe('Lisa');
  });

  it('2. should load daily calorie target from user profile calculation', () => {
    expect(component.targetKcal()).toBeGreaterThan(1200);
  });

  it('3. should calculate calorie ring progress and dashoffset correctly', () => {
    expect(component.calorieDashOffset()).toBeGreaterThanOrEqual(0);
    expect(component.calorieDashOffset()).toBeLessThanOrEqual(340);
  });

  it('4. should render Bereites gegessen and calculate eaten calories correctly', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Bereits gegessen');
    expect(component.eatenKcal()).toBe(component.foodLogService.eatenCalories());
  });

  it('5. should render Noch verfügbar and calculate remaining calories correctly', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Noch verfügbar');
    expect(component.remainingKcal()).toBe(Math.max(0, component.targetKcal() - component.eatenKcal()));
  });

  it('6. should display Dein Markt with Netto Marken-Discount', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Dein Markt');
    expect(el.textContent).toContain('Netto');
    expect(el.textContent).toContain('Marken-Discount');
  });

  it('7. should render Bei Netto entdecken with real product cards (Banane, Eier, Skyr, Toast)', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Bei Netto entdecken');
    expect(el.textContent).toContain('Alle Produkte ›');
    expect(component.featuredProducts().length).toBeGreaterThanOrEqual(4);
    const names = component.featuredProducts().map(p => p.name);
    expect(names).toContain('Banane');
    expect(names).toContain('Eier');
    expect(names).toContain('Skyr Natur');
    expect(names).toContain('Toastbrot Vollkorn');
  });

  it('8. should add product to shopping list on plus click without altering eaten calories', () => {
    const initialEaten = component.eatenKcal();
    const shoppingService = TestBed.inject(ShoppingListService);
    const firstProduct = component.featuredProducts()[0].product;

    const dummyEvent = new MouseEvent('click');
    component.addToCart(firstProduct, dummyEvent);

    expect(shoppingService.items().some(i => i.productId === firstProduct.id)).toBe(true);
    expect(component.eatenKcal()).toBe(initialEaten);
    expect(component.toastMessage()).toContain(firstProduct.name);
  });

  it('9. should handle search submit and navigate to /discover', () => {
    component.searchQuery.set('Toast');
    component.onSearchSubmit();
    expect(router.navigate).toHaveBeenCalledWith(['/discover'], { queryParams: { q: 'Toast' } });
  });

  it('10. should navigate to /shopping-list when clicking Einkaufsliste öffnen', () => {
    component.goToShoppingList();
    expect(router.navigate).toHaveBeenCalledWith(['/shopping-list']);
  });

  it('11. should navigate to /recipes when clicking Rezepte entdecken', () => {
    component.goToRecipes();
    expect(router.navigate).toHaveBeenCalledWith(['/recipes']);
  });

  it('12. should navigate to /retailers when clicking market card or Ändern', () => {
    component.goToMarketSelection();
    expect(router.navigate).toHaveBeenCalledWith(['/retailers']);
  });

  it('13. should navigate to /onboarding when clicking settings gear', () => {
    component.goToSettings();
    expect(router.navigate).toHaveBeenCalledWith(['/onboarding']);
  });
});
