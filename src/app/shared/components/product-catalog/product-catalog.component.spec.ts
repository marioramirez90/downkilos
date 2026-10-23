import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProductCatalogComponent } from './product-catalog.component';
import { ProductService } from '../../../core/services/product.service';
import { ShoppingListService } from '../../../core/services/shopping-list.service';

describe('ProductCatalogComponent', () => {
  let component: ProductCatalogComponent;
  let fixture: ComponentFixture<ProductCatalogComponent>;
  let productService: ProductService;
  let shoppingService: ShoppingListService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ProductCatalogComponent]
    }).compileComponents();

    productService = TestBed.inject(ProductService);
    shoppingService = TestBed.inject(ShoppingListService);
    fixture = TestBed.createComponent(ProductCatalogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the product catalog component', () => {
    expect(component).toBeTruthy();
  });

  it('should render products with prices and status badges', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Hähnchenbrustfilet');
    expect(el.textContent).toContain('Haferflocken');
    expect(el.textContent).toContain('Netto-Angebot');
  });

  it('should open product details modal when clicking on a product', () => {
    const prod = productService.getProductById('netto-chicken-400')!;
    component.openProductDetails(prod);
    fixture.detectChanges();

    expect(component.selectedProductDetails()).toBe(prod);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Nährwerte je 100 g');
    expect(el.textContent).toContain('Schließen');
  });

  it('should add product to shopping list', () => {
    const prod = productService.getProductById('netto-chicken-400')!;
    component.addProductToShoppingList(prod);
    fixture.detectChanges();

    expect(component.addedToast()).toContain('Hähnchenbrustfilet');
    const onList = shoppingService.items().find(i => i.productId === prod.id);
    expect(onList).toBeDefined();
  });
});
