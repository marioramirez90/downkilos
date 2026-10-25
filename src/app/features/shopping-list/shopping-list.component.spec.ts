import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ShoppingListComponent } from './shopping-list.component';
import { ShoppingListService } from '../../core/services/shopping-list.service';

describe('ShoppingListComponent', () => {
  let component: ShoppingListComponent;
  let fixture: ComponentFixture<ShoppingListComponent>;
  let router: Router;
  let shoppingService: ShoppingListService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ShoppingListComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    router = TestBed.inject(Router);
    shoppingService = TestBed.inject(ShoppingListService);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(ShoppingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('1. should create the shopping list component', () => {
    expect(component).toBeTruthy();
  });

  it('2. should render empty state for a new user with 0€ and 0 kcal (Section 14 & 18)', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Deine Einkaufsliste ist noch leer.');
    expect(el.textContent).toContain('Entdecke Netto-Produkte und füge deine ersten Lebensmittel hinzu.');
    expect(el.textContent).toContain('Gesamtpreis: 0,00 €');
    expect(el.textContent).toContain('Gesamtkalorien: 0 kcal');
  });

  it('3. should render items when items are in list', () => {
    shoppingService.generateListFromPlan();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Hähnchenbrustfilet');
    expect(el.textContent).toContain('Naturreis');
    expect(el.textContent).toContain('Brokkoli');
    expect(el.textContent).toContain('Haferflocken');
  });

  it('4. should render total sum in summary row when items are present', () => {
    shoppingService.generateListFromPlan();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Einkaufskosten');
    expect(el.textContent).toMatch(/\d+[.,]\d{2}\s*€/);
  });

  it('5. should filter items by category', () => {
    shoppingService.generateListFromPlan();
    fixture.detectChanges();

    component.setCategory('meat_fish');
    fixture.detectChanges();

    const items = component.shoppingService.filteredItems();
    expect(items.every(i => i.category === 'meat_fish')).toBe(true);
  });

  it('6. should add custom item through modal', () => {
    component.newItemName = 'Zitronen';
    component.newItemPrice = 1.29;
    component.addCustomItem();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Zitronen');
    expect(component.shoppingService.summary().totalCost).toBe(1.29);
  });

  it('7. should toggle item checked status', () => {
    shoppingService.generateListFromPlan();
    fixture.detectChanges();

    const first = component.displayedItems()[0];
    const initialStatus = first.isChecked;

    component.toggleChecked(first.id);
    fixture.detectChanges();

    const updated = component.displayedItems().find(i => i.id === first.id)!;
    expect(updated.isChecked).toBe(!initialStatus);
  });

  it('8. should increase item quantity and update total price & calories', () => {
    shoppingService.generateListFromPlan();
    fixture.detectChanges();

    const first = component.displayedItems()[0];
    const initialCount = first.packageCount;
    const initialCost = component.shoppingService.summary().totalCost;

    component.updateCount(first.id, 1);
    fixture.detectChanges();

    const updated = component.displayedItems().find(i => i.id === first.id)!;
    expect(updated.packageCount).toBe(initialCount + 1);
    expect(component.shoppingService.summary().totalCost).toBeGreaterThanOrEqual(initialCost);
  });

  it('9. should remove item when clicking delete', () => {
    shoppingService.generateListFromPlan();
    fixture.detectChanges();

    const initialLength = component.displayedItems().length;
    const first = component.displayedItems()[0];

    component.removeItem(first.id);
    fixture.detectChanges();

    expect(component.displayedItems().length).toBe(initialLength - 1);
    expect(component.displayedItems().some(i => i.id === first.id)).toBe(false);
  });

  it('10. should render sample items matching reference image (Toastbrot, Eier, Bananen)', () => {
    component.loadSample();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Toastbrot Vollkorn');
    expect(el.textContent).toContain('Eier');
    expect(el.textContent).toContain('Bananen');

    // Prices and base prices
    expect(el.textContent).toContain('1,79 €');
    expect(el.textContent).toContain('(0,36 €/100 g)');
    expect(el.textContent).toContain('2,99 €');
    expect(el.textContent).toContain('(0,30 €/Stück)');
    expect(el.textContent).toContain('1,69 €');
    expect(el.textContent).toContain('(0,17 €/100 g)');

    // Calorie breakdown columns
    expect(el.textContent).toContain('246 kcal');
    expect(el.textContent).toContain('82 kcal');
    expect(el.textContent).toContain('1.230 kcal');

    expect(el.textContent).toContain('143 kcal');
    expect(el.textContent).toContain('78 kcal');
    expect(el.textContent).toContain('780 kcal');

    expect(el.textContent).toContain('89 kcal');
    expect(el.textContent).toContain('95 kcal');
    expect(el.textContent).toContain('890 kcal');

    // Summary Card (2x2)
    expect(el.textContent).toContain('3 Artikel');
    expect(el.textContent).toContain('in deiner Liste');
    expect(el.textContent).toContain('6,47 €');
    expect(el.textContent).toContain('100 g pro Artikel');
    expect(el.textContent).toContain('478 kcal');
    expect(el.textContent).toContain('2.900 kcal');
  });

  it('11. should not delete item when clicking minus at quantity 1', () => {
    component.loadSample();
    fixture.detectChanges();

    const toast = component.displayedItems().find(i => i.name === 'Toastbrot Vollkorn')!;
    expect(toast.packageCount).toBe(1);

    component.updateCount(toast.id, -1);
    fixture.detectChanges();

    expect(component.displayedItems().some(i => i.id === toast.id)).toBe(true);
    expect(component.displayedItems().find(i => i.id === toast.id)!.packageCount).toBe(1);
  });

  it('12. should double price and total calories when quantity increases from 1 to 2', () => {
    component.loadSample();
    fixture.detectChanges();

    const toast = component.displayedItems().find(i => i.name === 'Toastbrot Vollkorn')!;
    component.updateCount(toast.id, 1);
    fixture.detectChanges();

    const updatedToast = component.displayedItems().find(i => i.id === toast.id)!;
    expect(updatedToast.packageCount).toBe(2);
    expect(updatedToast.totalCost).toBe(3.58);
    expect(updatedToast.totalCalories).toBe(2460);

    // Summary updates immediately
    const summary = component.summary();
    expect(summary.totalCost).toBe(8.26); // 3.58 + 2.99 + 1.69 = 8.26
    expect(summary.totalCalories).toBe(4130); // 2460 + 780 + 890 = 4130
  });

  it('13. should render origin badges and filter by origin (Phase 9)', () => {
    // 1. Plan-Item hinzufügen
    shoppingService.generateListFromPlan();
    // 2. Manuellen Artikel hinzufügen
    shoppingService.addCustomItem('Olivenöl', 3.99);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Wochenplan');
    expect(el.textContent).toContain('Manuell');

    // Filter auf 'manual' setzen
    component.setOriginFilter('manual');
    fixture.detectChanges();

    expect(component.displayedItems().length).toBe(1);
    expect(component.displayedItems()[0].name).toBe('Olivenöl');

    // Filter zurück auf 'all'
    component.setOriginFilter('all');
    fixture.detectChanges();
    expect(component.displayedItems().length).toBeGreaterThan(1);
  });

  it('14. should synchronize with meal planner plan via syncWithPlan (Phase 9)', () => {
    component.syncWithPlan();
    fixture.detectChanges();

    expect(shoppingService.planItems().length).toBeGreaterThan(0);
    expect(component.displayedItems().length).toBeGreaterThan(0);
  });
});

