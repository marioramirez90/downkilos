import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MealPlannerService } from '../../core/services/meal-planner.service';
import { MealType, Recipe } from '../../core/models/recipe.model';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { HamburgerButtonComponent } from '../../shared/components/hamburger-button/hamburger-button.component';

@Component({
  selector: 'app-meal-planner',
  standalone: true,
  imports: [CommonModule, BottomNavComponent, HamburgerButtonComponent],
  templateUrl: './meal-planner.component.html',
  styleUrl: './meal-planner.component.scss'
})
export class MealPlannerComponent {
  private router = inject(Router);
  plannerService = inject(MealPlannerService);

  showPlanInfo = signal<boolean>(false);
  swappingMealType = signal<MealType | null>(null);

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
