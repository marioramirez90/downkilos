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

  it('should create the shopping list component', () => {
    expect(component).toBeTruthy();
  });

  it('should render items matching reference image (Hähnchenbrustfilet, Naturreis, etc.)', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Hähnchenbrustfilet');
    expect(el.textContent).toContain('Naturreis');
    expect(el.textContent).toContain('Brokkoli');
    expect(el.textContent).toContain('Haferflocken');
  });

  it('should render total sum in summary row', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Einkaufskosten');
    expect(el.textContent).toMatch(/\d+[.,]\d{2}\s*€/);
  });

  it('should filter items by category', () => {
    component.setCategory('meat_fish');
    fixture.detectChanges();

    const items = component.shoppingService.filteredItems();
    expect(items.every(i => i.category === 'meat_fish')).toBe(true);
  });

  it('should add custom item through modal', () => {
    component.newItemName = 'Zitronen';
    component.newItemPrice = 1.29;
    component.addCustomItem();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Zitronen');
  });

  it('should toggle item checked status', () => {
    const first = component.displayedItems()[0];
    const initialStatus = first.isChecked;

    component.toggleChecked(first.id);
    fixture.detectChanges();

    const updated = component.displayedItems().find(i => i.id === first.id)!;
    expect(updated.isChecked).toBe(!initialStatus);
  });

  it('should increase item quantity and update total price & calories', () => {
    const first = component.displayedItems()[0];
    const initialCount = first.packageCount;
    const initialCost = component.shoppingService.summary().totalCost;

    component.updateCount(first.id, 1);
    fixture.detectChanges();

    const updated = component.displayedItems().find(i => i.id === first.id)!;
    expect(updated.packageCount).toBe(initialCount + 1);
    expect(component.shoppingService.summary().totalCost).toBeGreaterThanOrEqual(initialCost);
  });

  it('should remove item when clicking delete', () => {
    const initialLength = component.displayedItems().length;
    const first = component.displayedItems()[0];

    component.removeItem(first.id);
    fixture.detectChanges();

    expect(component.displayedItems().length).toBe(initialLength - 1);
    expect(component.displayedItems().some(i => i.id === first.id)).toBe(false);
  });
});
