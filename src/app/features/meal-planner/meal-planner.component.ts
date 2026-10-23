import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MealPlannerService } from '../../core/services/meal-planner.service';
import { ShoppingListService } from '../../core/services/shopping-list.service';
import { MealType, Recipe } from '../../core/models/recipe.model';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { HamburgerButtonComponent } from '../../shared/components/hamburger-button/hamburger-button.component';

@Component({
  selector: 'app-meal-planner',
  standalone: true,
  imports: [CommonModule, RouterModule, BottomNavComponent, HamburgerButtonComponent],
  templateUrl: './meal-planner.component.html',
  styleUrl: './meal-planner.component.scss'
})
export class MealPlannerComponent {
  private router = inject(Router);
  plannerService = inject(MealPlannerService);
  private shoppingListService = inject(ShoppingListService);

  showPlanInfo = signal<boolean>(false);
  swappingMealType = signal<MealType | null>(null);
  addedToShoppingList = signal<boolean>(false);

  regeneratePlan() {
    this.plannerService.generateWeeklyPlan();
  }

  addDayToShoppingList() {
    const day = this.plannerService.currentDayPlan();
    if (!day) return;
    this.shoppingListService.addRecipeIngredients(day.breakfast, 1);
    this.shoppingListService.addRecipeIngredients(day.lunch, 1);
    this.shoppingListService.addRecipeIngredients(day.snack, 1);
    this.shoppingListService.addRecipeIngredients(day.dinner, 1);
    this.addedToShoppingList.set(true);
    setTimeout(() => this.addedToShoppingList.set(false), 3000);
  }

  viewRecipe(recipe: Recipe, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/recipes', recipe.id]);
  }

  openSwapModal(type: MealType) {
    this.swappingMealType.set(type);
  }

  closeSwapModal() {
    this.swappingMealType.set(null);
  }

  getMealTypeLabel(type: MealType): string {
    switch (type) {
      case 'breakfast': return 'Frühstück';
      case 'lunch': return 'Mittagessen';
      case 'snack': return 'Snack';
      case 'dinner': return 'Abendessen';
      default: return type;
    }
  }

  availableAlternatives(): Recipe[] {
    const type = this.swappingMealType();
    if (!type) return [];
    return this.plannerService.getFilteredRecipes(type);
  }

  confirmSwap(newRecipe: Recipe) {
    const type = this.swappingMealType();
    if (type) {
      this.plannerService.swapMeal(this.plannerService.currentDayIndex(), type, newRecipe);
      this.closeSwapModal();
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
