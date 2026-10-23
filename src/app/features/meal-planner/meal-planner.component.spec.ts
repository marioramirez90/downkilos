import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MealPlannerComponent } from './meal-planner.component';
import { MealPlannerService } from '../../core/services/meal-planner.service';

describe('MealPlannerComponent', () => {
  let component: MealPlannerComponent;
  let fixture: ComponentFixture<MealPlannerComponent>;
  let router: Router;
  let plannerService: MealPlannerService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [MealPlannerComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    router = TestBed.inject(Router);
    plannerService = TestBed.inject(MealPlannerService);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(MealPlannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the meal planner component', () => {
    expect(component).toBeTruthy();
  });

  it('should render all 4 meals for today (Frühstück, Mittagessen, Snack, Abendessen)', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Frühstück');
    expect(el.textContent).toContain('Overnight Oats mit Beeren');
    expect(el.textContent).toContain('Mittagessen');
    expect(el.textContent).toContain('Hähnchen-Bowl mit Reis & Gemüse');
    expect(el.textContent).toContain('Snack');
    expect(el.textContent).toContain('Skyr mit Banane und Nüssen');
    expect(el.textContent).toContain('Abendessen');
    expect(el.textContent).toContain('Linsen-Curry mit Vollkornreis');
  });

  it('should render daily total calories and costs summary (1.800 kcal gesamt, 6,40 € Kosten)', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toMatch(/1[.,]800\s*kcal/);
    expect(el.textContent).toMatch(/6[.,]40\s*€/);
  });

  it('should open swap modal and swap meal on selection', () => {
    component.openSwapModal('breakfast');
    fixture.detectChanges();
    expect(component.swappingMealType()).toBe('breakfast');

    const alternatives = component.availableAlternatives();
    expect(alternatives.length).toBeGreaterThan(1);

    const newChoice = alternatives.find(r => r.id !== 'rec-overnight-oats')!;
    component.confirmSwap(newChoice);
    fixture.detectChanges();

    expect(component.swappingMealType()).toBeNull();
    expect(plannerService.currentDayPlan().breakfast.id).toBe(newChoice.id);
  });

  it('should switch between day tabs (Heute, Morgen, ...)', () => {
    plannerService.setDayIndex(1);
    fixture.detectChanges();
    expect(plannerService.currentDayIndex()).toBe(1);
  });
});
