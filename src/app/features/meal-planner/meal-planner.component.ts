import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MealPlannerService } from '../../core/services/meal-planner.service';
import { ShoppingListService } from '../../core/services/shopping-list.service';
import { MealType, Recipe } from '../../core/models/recipe.model';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-meal-planner',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BottomNavComponent],
  templateUrl: './meal-planner.component.html',
  styleUrl: './meal-planner.component.scss'
})
export class MealPlannerComponent {
  private router = inject(Router);
  readonly plannerService = inject(MealPlannerService);
  private shoppingListService = inject(ShoppingListService);

  readonly swappingMealType = signal<MealType | null>(null);
  readonly showBudgetModal = signal<boolean>(false);
  readonly customBudget = signal<number>(50);
  readonly toastMessage = signal<string | null>(null);

  readonly budgetOptions = [30, 40, 50, 60, 75, 100];

  selectDay(dayIndex: number): void {
    this.plannerService.setDayIndex(dayIndex);
  }

  checkCompatibility(recipe: Recipe) {
    return this.plannerService.checkRecipeCompatibility(recipe);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goToSettings(): void {
    this.router.navigate(['/settings']);
  }

  goToShoppingList(): void {
    this.syncAllSelectedToShoppingList();
    this.router.navigate(['/shopping-list']);
  }

  isMealSelected(type: MealType): boolean {
    return this.plannerService.isMealSelected(this.plannerService.currentDayIndex(), type);
  }

  toggleMeal(type: MealType, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    const dayIdx = this.plannerService.currentDayIndex();
    this.plannerService.toggleMealSelected(dayIdx, type);

    const nowSelected = this.plannerService.isMealSelected(dayIdx, type);
    const mealLabel = this.getMealTypeLabel(type);
    if (nowSelected) {
      this.showToast(`${mealLabel} für ${this.plannerService.currentDayPlan().dayName} ausgewählt!`);
    } else {
      this.showToast(`${mealLabel} entfernt.`);
    }
  }

  openSwapModal(type: MealType, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.swappingMealType.set(type);
  }

  closeSwapModal(): void {
    this.swappingMealType.set(null);
  }

  confirmSwap(newRecipe: Recipe): void {
    const type = this.swappingMealType();
    if (type) {
      this.plannerService.swapMeal(this.plannerService.currentDayIndex(), type, newRecipe);
      this.closeSwapModal();
      this.showToast(`"${newRecipe.title}" eingeplant!`);
    }
  }

  availableAlternatives(): Recipe[] {
    const type = this.swappingMealType();
    if (!type) return [];
    return this.plannerService.getFilteredRecipes(type);
  }

  getMealTypeLabel(type: MealType): string {
    switch (type) {
      case 'breakfast': return 'Frühstück';
      case 'lunch': return 'Mittagessen';
      case 'dinner': return 'Abendessen';
      case 'snack': return 'Snack';
      default: return type;
    }
  }

  openBudgetModal(): void {
    this.customBudget.set(this.plannerService.weeklyBudget());
    this.showBudgetModal.set(true);
  }

  closeBudgetModal(): void {
    this.showBudgetModal.set(false);
  }

  selectBudget(amount: number): void {
    this.plannerService.setWeeklyBudget(amount);
    this.closeBudgetModal();
    this.showToast(`Wochenbudget auf ${amount} € aktualisiert.`);
  }

  saveCustomBudget(): void {
    const amount = Math.max(10, Math.round(this.customBudget()));
    this.plannerService.setWeeklyBudget(amount);
    this.closeBudgetModal();
    this.showToast(`Wochenbudget auf ${amount} € gesetzt.`);
  }

  syncAllSelectedToShoppingList(): void {
    const plan = this.plannerService.weeklyPlan();
    for (const day of plan) {
      const sel = day.selectedMeals || { breakfast: true, lunch: true, dinner: true, snack: false };
      if (sel.breakfast && day.breakfast) this.shoppingListService.addRecipeIngredients(day.breakfast, 1);
      if (sel.lunch && day.lunch) this.shoppingListService.addRecipeIngredients(day.lunch, 1);
      if (sel.dinner && day.dinner) this.shoppingListService.addRecipeIngredients(day.dinner, 1);
      if (sel.snack && day.snack) this.shoppingListService.addRecipeIngredients(day.snack, 1);
    }
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 2500);
  }
}
