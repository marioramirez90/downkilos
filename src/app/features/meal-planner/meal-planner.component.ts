import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MealPlannerService } from '../../core/services/meal-planner.service';
import { ShoppingListService } from '../../core/services/shopping-list.service';
import { StorageService } from '../../core/services/storage.service';
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
  private storageService = inject(StorageService);

  readonly swappingMealType = signal<MealType | null>(null);
  readonly repeatingMealType = signal<MealType | null>(null);
  readonly selectedRepeatDays = signal<number[]>([0, 1, 2, 3, 4]);
  readonly showBudgetModal = signal<boolean>(false);
  readonly showCompleteModal = signal<boolean>(false);
  readonly customBudget = signal<number>(50);
  readonly toastMessage = signal<string | null>(null);

  readonly budgetOptions = [30, 40, 50, 60, 75, 100];

  readonly plannedMealsStats = computed(() => {
    const plan = this.plannerService.weeklyPlan();
    let mainMealsCount = 0;
    let snacksCount = 0;
    let totalCalories = 0;

    for (const day of plan) {
      const sel = day.selectedMeals || { breakfast: true, lunch: true, dinner: true, snack: false };
      const portions = day.portions || { breakfast: 1, lunch: 1, dinner: 1, snack: 1 };

      if (sel.breakfast && day.breakfast) {
        mainMealsCount++;
        totalCalories += day.breakfast.calories * (portions.breakfast || 1);
      }
      if (sel.lunch && day.lunch) {
        mainMealsCount++;
        totalCalories += day.lunch.calories * (portions.lunch || 1);
      }
      if (sel.dinner && day.dinner) {
        mainMealsCount++;
        totalCalories += day.dinner.calories * (portions.dinner || 1);
      }
      if (sel.snack && day.snack) {
        snacksCount++;
        totalCalories += day.snack.calories * (portions.snack || 1);
      }
    }

    const averageDailyCalories = Math.round(totalCalories / 7);

    return {
      mainMealsCount,
      totalMainMealsMax: 21,
      snacksCount,
      averageDailyCalories,
      dailyTarget: this.plannerService.dailyCalorieTarget()
    };
  });

  readonly weekDaysList = [
    { index: 0, short: 'Mo', name: 'Montag' },
    { index: 1, short: 'Di', name: 'Dienstag' },
    { index: 2, short: 'Mi', name: 'Mittwoch' },
    { index: 3, short: 'Do', name: 'Donnerstag' },
    { index: 4, short: 'Fr', name: 'Freitag' },
    { index: 5, short: 'Sa', name: 'Samstag' },
    { index: 6, short: 'So', name: 'Sonntag' },
  ];

  selectDay(dayIndex: number): void {
    this.plannerService.setDayIndex(dayIndex);
  }

  getPortions(type: MealType): number {
    return this.plannerService.getMealPortions(this.plannerService.currentDayIndex(), type);
  }

  changePortions(type: MealType, delta: number, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    const current = this.getPortions(type);
    const next = Math.max(1, Math.min(8, current + delta));
    this.plannerService.setMealPortions(this.plannerService.currentDayIndex(), type, next);
  }

  getCurrentMealRecipe(type: MealType): Recipe | undefined {
    const day = this.plannerService.currentDayPlan();
    return day ? day[type] : undefined;
  }

  openRepeatModal(type: MealType, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.repeatingMealType.set(type);
    this.selectedRepeatDays.set([0, 1, 2, 3, 4]);
  }

  closeRepeatModal(): void {
    this.repeatingMealType.set(null);
  }

  toggleRepeatDay(dayIndex: number): void {
    const list = [...this.selectedRepeatDays()];
    const idx = list.indexOf(dayIndex);
    if (idx !== -1) {
      list.splice(idx, 1);
    } else {
      list.push(dayIndex);
      list.sort((a, b) => a - b);
    }
    this.selectedRepeatDays.set(list);
  }

  isDaySelectedForRepeat(dayIndex: number): boolean {
    return this.selectedRepeatDays().includes(dayIndex);
  }

  repeatWorkdays(type: MealType): void {
    const dayIdx = this.plannerService.currentDayIndex();
    this.plannerService.repeatMealWorkdays(dayIdx, type);
    const recipe = this.getCurrentMealRecipe(type);
    this.closeRepeatModal();
    this.showToast(`"${recipe?.title || this.getMealTypeLabel(type)}" für Montag bis Freitag übernommen!`);
  }

  repeatAllWeek(type: MealType): void {
    const dayIdx = this.plannerService.currentDayIndex();
    this.plannerService.repeatMealAllWeek(dayIdx, type);
    const recipe = this.getCurrentMealRecipe(type);
    this.closeRepeatModal();
    this.showToast(`"${recipe?.title || this.getMealTypeLabel(type)}" für die ganze Woche (Mo–So) übernommen!`);
  }

  applyCustomRepeat(type: MealType): void {
    const targetDays = this.selectedRepeatDays();
    if (targetDays.length === 0) return;
    const dayIdx = this.plannerService.currentDayIndex();
    this.plannerService.repeatMealToDays(dayIdx, type, targetDays);
    const recipe = this.getCurrentMealRecipe(type);
    this.closeRepeatModal();
    this.showToast(`"${recipe?.title || this.getMealTypeLabel(type)}" auf ${targetDays.length} Tage angewendet!`);
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
    this.shoppingListService.syncWithWeeklyPlan(plan);
    this.showToast('Einkaufsliste mit Wochenplan synchronisiert!');
  }

  openCompleteModal(): void {
    this.showCompleteModal.set(true);
  }

  closeCompleteModal(): void {
    this.showCompleteModal.set(false);
  }

  completePlanAndProceed(): void {
    this.syncAllSelectedToShoppingList();
    this.storageService.setOnboardingCompleted(true);
    this.closeCompleteModal();
    this.router.navigate(['/loading'], { queryParams: { step: 'dashboard' } });
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
