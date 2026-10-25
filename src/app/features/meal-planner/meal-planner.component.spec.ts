import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

  it('1. should create the meal planner component', () => {
    expect(component).toBeTruthy();
  });

  it('2. should render header with title Wochenplan and subtitle matching reference', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.page-title')?.textContent).toContain('Wochenplan');
    expect(el.querySelector('.page-subtitle')?.textContent).toContain('Wähle deine Mahlzeiten');
  });

  it('3. should render Wochenbudget and Tagesziel cards', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Wochenbudget');
    expect(el.textContent).toContain('Tagesziel');
    expect(el.textContent).toContain('50 €');
  });

  it('4. should render reference meals on Monday (Porridge mit Banane, Reispfanne mit Gemüse, Vollkornbrot mit Ei)', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Porridge mit Banane');
    expect(el.textContent).toContain('Reispfanne mit Gemüse');
    expect(el.textContent).toContain('Vollkornbrot mit Ei');
  });

  it('5. should toggle meal selection with Auswählen button', () => {
    expect(component.isMealSelected('breakfast')).toBe(true);

    component.toggleMeal('breakfast');
    fixture.detectChanges();

    expect(component.isMealSelected('breakfast')).toBe(false);

    component.toggleMeal('breakfast');
    fixture.detectChanges();

    expect(component.isMealSelected('breakfast')).toBe(true);
  });

  it('6. should render Automatische Einkaufsliste with preview chips', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Automatische Einkaufsliste');
    expect(el.textContent).toContain('Geschätzter Einkauf:');
    expect(el.querySelector('.ingredients-preview-row')).toBeTruthy();
  });

  it('7. should navigate between weekdays with arrows', () => {
    const initialDay = plannerService.currentDayPlan().dayName;
    expect(initialDay).toBe('Montag');

    plannerService.nextDay();
    fixture.detectChanges();

    expect(plannerService.currentDayPlan().dayName).toBe('Dienstag');

    plannerService.previousDay();
    fixture.detectChanges();

    expect(plannerService.currentDayPlan().dayName).toBe('Montag');
  });

  it('8. should open recipe alternatives modal and allow swapping', () => {
    component.openSwapModal('lunch');
    fixture.detectChanges();

    expect(component.swappingMealType()).toBe('lunch');
    const alts = component.availableAlternatives();
    expect(alts.length).toBeGreaterThan(0);

    const newChoice = alts[0];
    component.confirmSwap(newChoice);
    fixture.detectChanges();

    expect(component.swappingMealType()).toBeNull();
  });

  it('9. should open budget modal and allow setting a new weekly budget', () => {
    component.openBudgetModal();
    fixture.detectChanges();

    expect(component.showBudgetModal()).toBe(true);

    component.selectBudget(75);
    fixture.detectChanges();

    expect(component.showBudgetModal()).toBe(false);
    expect(plannerService.weeklyBudget()).toBe(75);
  });

  it('10. should render 7-day pill bar and switch days on pill click', () => {
    const el = fixture.nativeElement as HTMLElement;
    const dayPills = el.querySelectorAll('.day-pill-btn');
    expect(dayPills.length).toBe(7);

    // Click Wednesday (index 2)
    const wednesdayPill = el.querySelector('#day-pill-2') as HTMLElement;
    expect(wednesdayPill).toBeTruthy();
    wednesdayPill.click();
    fixture.detectChanges();

    expect(plannerService.currentDayIndex()).toBe(2);
    expect(plannerService.currentDayPlan().dayName).toBe('Mittwoch');
  });

  it('11. should render day progress summary with calories and target', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.day-progress-summary-card')).toBeTruthy();
    expect(el.textContent).toContain('Geplante Kalorien:');
    expect(el.textContent).toContain('Tageskosten:');
  });
});
