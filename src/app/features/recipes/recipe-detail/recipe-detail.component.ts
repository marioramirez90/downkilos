import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Recipe } from '../../../core/models/recipe.model';
import { RECIPES_DATA } from '../../../core/models/recipes.data';
import { RecipeCalculationService, ScaledRecipeResult } from '../../../core/services/recipe-calculation.service';
import { ShoppingListService } from '../../../core/services/shopping-list.service';
import { FoodLogService } from '../../../core/services/food-log.service';
import { PantryService } from '../../../core/services/pantry.service';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';
import { HamburgerButtonComponent } from '../../../shared/components/hamburger-button/hamburger-button.component';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BottomNavComponent, HamburgerButtonComponent],
  templateUrl: './recipe-detail.component.html',
  styleUrl: './recipe-detail.component.scss'
})
export class RecipeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private calculationService = inject(RecipeCalculationService);
  private shoppingListService = inject(ShoppingListService);
  private foodLogService = inject(FoodLogService);
  private pantryService = inject(PantryService);

  @Input() recipeId?: string;

  recipe = signal<Recipe | null>(null);
  servings = signal<number>(1);
  addedToShoppingList = signal<boolean>(false);
  addedToFoodLog = signal<boolean>(false);

  // Skalierte Nährwerte und Preise berechnen
  scaledData = computed<ScaledRecipeResult | null>(() => {
    const r = this.recipe();
    if (!r) return null;
    return this.calculationService.scaleRecipe(r, this.servings());
  });

  // Relevante Pantry-Vorräte prüfen
  matchingPantryItems = computed(() => {
    const r = this.recipe();
    if (!r) return [];
    return this.pantryService.getMatchingPantryItemsForRecipe(r);
  });

  ngOnInit(): void {
    const id = this.recipeId || this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadRecipe(id);
    }
  }

  loadRecipe(id: string): void {
    const found = RECIPES_DATA.find(r => r.id === id);
    if (found) {
      this.recipe.set(found);
      this.servings.set(found.defaultServings || 1);
    }
  }

  setServings(count: number): void {
    if (count >= 1 && count <= 12) {
      this.servings.set(count);
    }
  }

  addServings(delta: number): void {
    const next = this.servings() + delta;
    if (next >= 1 && next <= 12) {
      this.servings.set(next);
    }
  }

  addIngredientsToShoppingList(): void {
    const r = this.recipe();
    if (!r) return;
    this.shoppingListService.addRecipeIngredients(r, this.servings());
    this.addedToShoppingList.set(true);
    setTimeout(() => this.addedToShoppingList.set(false), 3000);
  }

  addToDailyPlan(status: 'planned' | 'eaten' = 'planned'): void {
    const r = this.recipe();
    if (!r) return;
    const scaled = this.scaledData();
    if (!scaled) return;

    this.foodLogService.logRecipe(
      r,
      this.servings(),
      status,
      scaled.calories,
      scaled.protein,
      scaled.carbs,
      scaled.fat
    );
    this.addedToFoodLog.set(true);
    setTimeout(() => this.addedToFoodLog.set(false), 3000);
  }

  goBack(): void {
    this.router.navigate(['/recipes']);
  }
}
