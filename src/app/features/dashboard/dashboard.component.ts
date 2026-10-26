import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../core/services/storage.service';
import { CalorieCalculatorService } from '../../core/services/calorie-calculator.service';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { FoodLogService } from '../../core/services/food-log.service';
import { RetailerService } from '../../core/services/retailer.service';
import { MealScheduleService } from '../../core/services/meal-schedule.service';
import { MealPlannerService } from '../../core/services/meal-planner.service';
import { UserProfile } from '../../core/models/user-profile.model';
import { CalorieCalculationResult } from '../../core/models/calorie-calculation.model';
import { Recipe } from '../../core/models/recipe.model';
import { WeightEntry } from '../../core/models/weight-log.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BottomNavComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  readonly storageService = inject(StorageService);
  private calorieService = inject(CalorieCalculatorService);
  private retailerService = inject(RetailerService);
  readonly foodLogService = inject(FoodLogService);
  readonly mealScheduleService = inject(MealScheduleService);
  readonly mealPlannerService = inject(MealPlannerService);

  readonly profile = signal<UserProfile | null>(null);
  readonly calculation = signal<CalorieCalculationResult | null>(null);
  readonly toastMessage = signal<string | null>(null);
  readonly lastLoggedFoodId = signal<string | null>(null);
  private toastTimeout: any = null;

  async ngOnInit(): Promise<void> {
    try {
      let p = await this.storageService.loadProfile();
      if (!p) {
        p = {
          id: 'guest_profile',
          name: 'Lisa',
          birthDate: '1992-06-15',
          gender: 'female',
          currentWeight: 78.4,
          height: 168,
          targetWeight: 65,
          activityLevel: 'moderate',
          goal: 'lose_weight',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      this.profile.set(p);

      if (p) {
        const calc = this.calorieService.calculate(p);
        this.calculation.set(calc);
      }

      await this.retailerService.loadPreference();
      this.storageService.loadWeightHistory();
      this.mealPlannerService.initPlan();
      this.mealScheduleService.refreshCurrentTime();
    } catch (err) {
      console.warn('Dashboard init non-fatal error:', err);
    }
  }

  readonly userFirstName = computed(() => {
    const p = this.storageService.profile() || this.profile();
    if (!p || !p.name) return 'Lisa';
    return p.name.split(' ')[0];
  });

  readonly targetKcal = computed(() => {
    return this.calculation()?.dailyTargetKcal || 2000;
  });

  readonly eatenKcal = computed(() => {
    return this.foodLogService.eatenCalories();
  });

  readonly remainingKcal = computed(() => {
    return Math.max(0, this.targetKcal() - this.eatenKcal());
  });

  readonly calorieRatio = computed(() => {
    const target = this.targetKcal();
    if (!target) return 0;
    return Math.min(1, Math.max(0, this.eatenKcal() / target));
  });

  readonly calorieDashOffset = computed(() => {
    const circumference = 340;
    return Math.round(circumference * (1 - this.calorieRatio()));
  });

  readonly dashboardRingDashOffset = computed(() => {
    const circumference = 565.49;
    return Math.round(circumference * (1 - this.calorieRatio()));
  });

  readonly formattedTargetKcal = computed(() => {
    return Math.round(this.targetKcal()).toLocaleString('de-DE');
  });

  readonly formattedEatenKcal = computed(() => {
    return Math.round(this.eatenKcal()).toLocaleString('de-DE');
  });

  readonly formattedRemainingKcal = computed(() => {
    return Math.round(this.remainingKcal()).toLocaleString('de-DE');
  });

  // --- Dein Markt (Kompaktkarte rechts oben) ---
  readonly currentRetailerName = computed(() => {
    const pref = this.storageService.retailerPref();
    if (pref && pref.retailerName) {
      if (pref.retailerId === 'netto') return 'Netto';
      return pref.retailerName;
    }
    return 'Netto';
  });

  readonly isNettoRetailer = computed(() => {
    const pref = this.storageService.retailerPref();
    return !pref || pref.retailerId === 'netto';
  });

  // --- Dein aktuelles Gewicht (Kompaktkarte rechts darunter) ---
  readonly latestWeightEntry = computed<WeightEntry | null>(() => {
    const history = this.storageService.weightHistory();
    if (!history || history.length === 0) return null;
    return [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  });

  readonly currentWeightKg = computed<number>(() => {
    const latest = this.latestWeightEntry();
    if (latest && typeof latest.weight === 'number' && !isNaN(latest.weight)) {
      return latest.weight;
    }
    const prof = this.storageService.profile() || this.profile();
    return prof?.currentWeight ?? 78.4;
  });

  readonly formattedCurrentWeight = computed(() => {
    const w = this.currentWeightKg();
    return w.toFixed(1).replace('.', ',') + ' kg';
  });

  readonly latestWeightUpdateText = computed(() => {
    const latest = this.latestWeightEntry();
    if (!latest) {
      return 'Heute, 08:12';
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (latest.date === todayStr || latest.date.startsWith(todayStr)) {
      return 'Heute, 08:12';
    }
    const d = new Date(latest.date);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    }
    return 'Heute';
  });

  // --- Aktives geplantes Rezept aus dem Wochenplan ---
  readonly currentRecipe = computed<Recipe | null>(() => {
    return this.mealScheduleService.plannedRecipeForActiveSlot();
  });

  readonly recipeIngredientsText = computed(() => {
    const r = this.currentRecipe();
    if (!r) return '';
    if (r.subtitle) {
      return r.subtitle.replace(/·/g, ',').replace(/\s+/g, ' ').trim();
    }
    if (r.ingredients && r.ingredients.length > 0) {
      return r.ingredients.map(i => i.name.replace(/^Bio |^Zarte |^Frische /, '')).join(', ');
    }
    return '';
  });

  // --- Interaktionen & Navigation ---
  openRecipe(recipeId: string | undefined): void {
    if (!recipeId) return;
    this.router.navigate(['/recipes', recipeId]);
  }

  private isLoggingMeal = false;

  onAlreadyEatenClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.isLoggingMeal) return;
    this.isLoggingMeal = true;
    setTimeout(() => { this.isLoggingMeal = false; }, 800);

    const createdId = this.mealScheduleService.markCurrentMealAsEaten();
    if (createdId) {
      this.lastLoggedFoodId.set(createdId);
      this.showToast('Mahlzeit eingetragen.', true);
    } else {
      this.showToast('Diese Mahlzeit ist bereits als gegessen eingetragen.', false);
    }
  }

  undoLastEaten(): void {
    const id = this.lastLoggedFoodId();
    if (id) {
      this.mealScheduleService.undoEatenMeal(id);
      this.lastLoggedFoodId.set(null);
      this.showToast('Eintrag rückgängig gemacht.', false);
    }
  }

  private showToast(msg: string, hasUndo: boolean): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastMessage.set(msg);
    this.toastTimeout = setTimeout(() => {
      this.toastMessage.set(null);
      this.lastLoggedFoodId.set(null);
    }, hasUndo ? 5000 : 2500);
  }

  onRecipeImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'images/down-kilos-leaf.png';
    }
  }

  goToFoodDiary(): void {
    this.router.navigate(['/was-hast-du-gegessen']);
  }

  goToWeight(): void {
    this.router.navigate(['/gewicht']);
  }

  goToMarketSelection(): void {
    this.router.navigate(['/retailers']);
  }

  goToSettings(): void {
    this.router.navigate(['/settings']);
  }

  goToShoppingList(): void {
    this.router.navigate(['/shopping-list']);
  }

  goToMealPlanner(): void {
    this.router.navigate(['/meal-planner']);
  }

  goToRecipes(): void {
    this.router.navigate(['/recipes']);
  }
}
