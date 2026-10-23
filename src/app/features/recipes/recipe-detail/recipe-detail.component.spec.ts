import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RecipeDetailComponent } from './recipe-detail.component';

describe('RecipeDetailComponent', () => {
  let component: RecipeDetailComponent;
  let fixture: ComponentFixture<RecipeDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeDetailComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeDetailComponent);
    component = fixture.componentInstance;
    component.recipeId = 'rec-scrambled-eggs';
    fixture.detectChanges();
  });

  it('should create and load scrambled eggs recipe', () => {
    expect(component).toBeTruthy();
    expect(component.recipe()?.title).toContain('Cremiges Rührei mit Tomaten');
  });

  it('should calculate portion cost and full package cost separately', () => {
    const scaled = component.scaledData();
    expect(scaled).toBeTruthy();
    expect(scaled?.costBreakdown.portionCost).toBeGreaterThan(0);
    expect(scaled?.costBreakdown.fullPackageCost).toBeGreaterThan(scaled!.costBreakdown.portionCost);
  });
});
