import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { DietaryProfileComponent } from './dietary-profile.component';
import { StorageService } from '../../core/services/storage.service';

describe('DietaryProfileComponent', () => {
  let component: DietaryProfileComponent;
  let fixture: ComponentFixture<DietaryProfileComponent>;
  let router: Router;
  let storageService: StorageService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [DietaryProfileComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    router = TestBed.inject(Router);
    storageService = TestBed.inject(StorageService);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(DietaryProfileComponent);
    component = fixture.componentInstance;
    await component.ngOnInit();
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('1. should create the dietary profile component', () => {
    expect(component).toBeTruthy();
  });

  it('2. should render header, subtitle and info callout card', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Deine Ernährung');
    expect(el.textContent).toContain('Damit deine Mahlzeiten zu dir passen');
    expect(el.textContent).toContain('Gib an, was du nicht verträgst');
  });

  it('3. should allow selecting and toggling dietary forms', () => {
    component.selectDietaryForm('vegetarian');
    expect(component.selectedDietaryForm()).toBe('vegetarian');

    component.selectDietaryForm('vegan');
    expect(component.selectedDietaryForm()).toBe('vegan');
  });

  it('4. should toggle intolerances and handle exclusive "none"', () => {
    component.toggleIntolerance('lactose');
    expect(component.isIntoleranceSelected('lactose')).toBe(true);

    component.toggleIntolerance('fructose');
    expect(component.isIntoleranceSelected('fructose')).toBe(true);

    // Selecting 'none' should clear specific intolerances
    component.toggleIntolerance('none');
    expect(component.isIntoleranceSelected('none')).toBe(true);
    expect(component.isIntoleranceSelected('lactose')).toBe(false);

    // Selecting specific intolerance should clear 'none'
    component.toggleIntolerance('gluten_sensitivity');
    expect(component.isIntoleranceSelected('gluten_sensitivity')).toBe(true);
    expect(component.isIntoleranceSelected('none')).toBe(false);
  });

  it('5. should toggle EU allergens and fruit allergens', () => {
    component.toggleAllergy('peanuts');
    expect(component.isAllergySelected('peanuts')).toBe(true);

    component.toggleAllergy('kiwi');
    expect(component.isAllergySelected('kiwi')).toBe(true);

    component.toggleAllergy('peanuts');
    expect(component.isAllergySelected('peanuts')).toBe(false);
  });

  it('6. should filter auto-suggestions when typing in search field', () => {
    component.excludeSearchQuery.set('Milch');
    fixture.detectChanges();

    const suggestions = component.filteredSuggestions();
    expect(suggestions.length).toBeGreaterThan(0);
    const terms = suggestions.map(s => s.term);
    expect(terms).toContain('Milch');
    expect(terms).toContain('Kuhmilch');
  });

  it('7. should add exclusion from suggestion and allow removing it', () => {
    component.selectSuggestion({
      term: 'Kuhmilch',
      category: 'Zutat',
      clarification: 'Spezifisch tierische Kuhmilch'
    });

    expect(component.customExcludedFoods()).toContain('Kuhmilch');

    component.removeExclusion('Kuhmilch');
    expect(component.customExcludedFoods()).not.toContain('Kuhmilch');
  });

  it('8. should toggle taste dislikes and allow custom dislike input', () => {
    component.toggleDislike('Pilze');
    expect(component.isDislikeSelected('Pilze')).toBe(true);

    component.customDislikeInput = 'Rosenkohl';
    component.addCustomDislike();
    expect(component.selectedDislikes()).toContain('Rosenkohl');
  });

  it('9. should save dietary profile to storage and navigate to /meal-planner', async () => {
    const saveSpy = vi.spyOn(storageService, 'saveDietaryProfile');

    component.selectDietaryForm('vegetarian');
    component.toggleIntolerance('lactose');
    component.toggleAllergy('nuts');
    component.customExcludedFoods.set(['Kuhmilch']);
    component.selectedDislikes.set(['Oliven']);

    await component.saveAndContinue();

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        dietaryForm: 'vegetarian',
        intolerances: ['lactose'],
        allergies: ['nuts'],
        customExcludedFoods: ['Kuhmilch'],
        dislikes: ['Oliven']
      })
    );
    expect(router.navigate).toHaveBeenCalledWith(['/meal-planner']);
  });

  it('10. should navigate back to /retailers on goBack when in onboarding', () => {
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/retailers']);
  });

  it('11. should navigate back to returnUrl when returnUrl signal is set', () => {
    component.returnUrl.set('/settings/profile');
    expect(component.isEditMode()).toBe(true);

    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/settings/profile']);
  });

  it('12. should save profile and navigate to returnUrl when returnUrl signal is set', async () => {
    component.returnUrl.set('/settings');
    const saveSpy = vi.spyOn(storageService, 'saveDietaryProfile');

    await component.saveAndContinue();
    expect(saveSpy).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/settings']);
  });
});
