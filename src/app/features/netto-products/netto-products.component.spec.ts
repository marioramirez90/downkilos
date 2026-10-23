import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { NettoProductsComponent } from './netto-products.component';

describe('NettoProductsComponent', () => {
  let component: NettoProductsComponent;
  let fixture: ComponentFixture<NettoProductsComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [NettoProductsComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(NettoProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the netto products component', () => {
    expect(component).toBeTruthy();
  });

  it('should render Netto header and bottom nav', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Netto-Produkte');
    expect(el.textContent).toContain('Zur Einkaufsliste');
  });
});
