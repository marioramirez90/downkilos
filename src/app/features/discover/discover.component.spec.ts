import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DiscoverComponent } from './discover.component';

describe('DiscoverComponent', () => {
  let component: DiscoverComponent;
  let fixture: ComponentFixture<DiscoverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiscoverComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(DiscoverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should list products and allow category selection', () => {
    expect(component.filteredProducts().length).toBeGreaterThan(0);
    component.setCategoryFilter('dairy');
    const filtered = component.filteredProducts();
    expect(filtered.every(p => p.category === 'dairy')).toBe(true);
  });

  it('should filter low calorie products (< 40 kcal/100g)', () => {
    component.setCategoryFilter('low_cal');
    const filtered = component.filteredProducts();
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every(p => p.nutrition.caloriesPer100g <= 40)).toBe(true);
  });

  it('should calculate portion calories with edible yield', () => {
    // Bananen: 100g, 90 kcal/100g, 68% essbar
    const cal = component.calculateSelectedCalories(100, 90, 68);
    expect(cal).toBe(61); // 100 * 0.68 * 0.90 = 61.2 -> 61 kcal
  });
});
