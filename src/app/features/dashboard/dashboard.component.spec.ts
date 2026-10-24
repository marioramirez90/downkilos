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

  it('11. should navigate to /gewicht when clicking Mein aktuelles Gewicht', () => {
    component.goToWeight();
    expect(router.navigate).toHaveBeenCalledWith(['/gewicht']);
  });

  it('12. should navigate to /retailers when clicking market card or Ändern', () => {
    component.goToMarketSelection();
    expect(router.navigate).toHaveBeenCalledWith(['/retailers']);
  });

  it('13. should navigate to /settings when clicking settings gear', () => {
    component.goToSettings();
    expect(router.navigate).toHaveBeenCalledWith(['/settings']);
  });

  it('14. should navigate to /was-hast-du-gegessen when clicking Bereits gegessen', () => {
    component.goToFoodDiary();
    expect(router.navigate).toHaveBeenCalledWith(['/was-hast-du-gegessen']);
  });

  it('15. should add product to shopping list on plus click and show toast', () => {
    const shoppingService = TestBed.inject(ShoppingListService);
    const firstProduct = component.featuredProducts()[0].product;
    const dummyEvent = new MouseEvent('click');

    component.onProductPlusClick(firstProduct, dummyEvent);
    expect(shoppingService.items().some(i => i.productId === firstProduct.id)).toBe(true);
    expect(component.toastMessage()).toContain(firstProduct.name);
  });

  it('16. should log a Netto product into breakfast and update eaten calories reactively', () => {
    const initialEaten = component.eatenKcal();
    const firstProduct = component.featuredProducts()[0].product;

    component.foodLogService.logProduct(firstProduct, 'breakfast', undefined, 'eaten');

    expect(component.eatenKcal()).toBeGreaterThan(initialEaten);
    expect(component.foodLogService.getItemsForMeal('breakfast').length).toBe(1);
  });

  it('17. should log a manual food item and update eaten calories', () => {
    const initialEaten = component.eatenKcal();

    component.foodLogService.addManualItem(
      'Vollkornnudeln mit Tomatensauce',
      450,
      '1 Teller',
      'lunch',
      'eaten'
    );

    expect(component.eatenKcal()).toBe(initialEaten + 450);
    expect(component.foodLogService.getItemsForMeal('lunch').length).toBe(1);
  });

  it('18. should remove a logged food item and recalculate calories', () => {
    component.foodLogService.addManualItem('Apfel', 60, '1 Stück', 'snack', 'eaten');

    const items = component.foodLogService.getItemsForMeal('snack');
    expect(items.length).toBeGreaterThan(0);
    const addedId = items[0].id;
    const eatenWithApple = component.eatenKcal();

    component.deleteFoodItem(addedId);
    expect(component.eatenKcal()).toBe(eatenWithApple - 60);
  });
});
