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

  it('should render items matching reference image (Hähnchenbrustfilet, Vollkornreis, etc.)', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Hähnchenbrustfilet');
    expect(el.textContent).toContain('Vollkornreis');
    expect(el.textContent).toContain('Brokkoli');
    expect(el.textContent).toContain('Haferflocken');
  });

  it('should render total sum in summary row', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Gesamtsumme (ca.)');
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
});
