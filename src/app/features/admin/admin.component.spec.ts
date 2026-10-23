import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { AdminComponent } from './admin.component';
import { ProductService } from '../../core/services/product.service';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;
  let productService: ProductService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    productService = TestBed.inject(ProductService);
    fixture.detectChanges();
  });

  it('should create the admin component', () => {
    expect(component).toBeTruthy();
  });

  it('should be locked by default requiring PIN', () => {
    expect(component.isAuthenticated()).toBe(false);

    component.pinInput = 'wrong-pin';
    component.checkPin();
    expect(component.isAuthenticated()).toBe(false);
    expect(component.authError()).toBeTruthy();

    component.pinInput = '4200';
    component.checkPin();
    expect(component.isAuthenticated()).toBe(true);
    expect(component.authError()).toBeNull();
  });

  it('should allow switching tabs when authenticated', () => {
    component.isAuthenticated.set(true);
    expect(component.activeTab()).toBe('products');

    component.activeTab.set('import');
    expect(component.activeTab()).toBe('import');

    component.activeTab.set('history');
    expect(component.activeTab()).toBe('history');

    component.activeTab.set('logs');
    expect(component.activeTab()).toBe('logs');
  });

  it('should execute JSON offer import in admin console', () => {
    component.isAuthenticated.set(true);
    component.importFormat = 'json';
    component.importDataText = JSON.stringify([
      {
        ean: '4311501777888',
        name: 'Bio Kresse',
        brand: 'BioBio',
        price: 0.69,
        validFrom: '2026-10-20',
        validUntil: '2026-10-25'
      }
    ]);

    component.executeImport();
    expect(productService.getProductByEan('4311501777888')).toBeDefined();
    expect(component.notification()?.type).toBe('success');
  });
});
