import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductCatalogComponent } from './product-catalog.component';
import { ProductService } from '../../../core/services/product.service';
import { PriceService } from '../../../core/services/price.service';

describe('ProductCatalogComponent', () => {
  let component: ProductCatalogComponent;
  let fixture: ComponentFixture<ProductCatalogComponent>;
  let productService: ProductService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ProductCatalogComponent]
    }).compileComponents();

    productService = TestBed.inject(ProductService);
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
    expect(el.textContent).toContain('Verifiziert');
  });

  it('should open price editor when clicking on price action', () => {
    const prod = productService.getProductById('netto-chicken-400')!;
    component.openPriceEditor(prod);
    fixture.detectChanges();

    expect(component.editingProduct()).toBe(prod);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Preis für Netto eintragen');
  });

  it('should save updated user price when confirmed in modal', () => {
    const prod = productService.getProductById('netto-chicken-400')!;
    component.openPriceEditor(prod);
    component.tempPriceInput = 3.49;
    component.saveNewPrice();
    fixture.detectChanges();

    const updated = productService.getProductById('netto-chicken-400');
    expect(updated?.price).toBe(3.49);
    expect(updated?.priceStatus).toBe('user_reported');
  });
});
