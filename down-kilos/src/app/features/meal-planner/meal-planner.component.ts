import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MealPlannerService } from '../../core/services/meal-planner.service';
import { MealType, Recipe } from '../../core/models/recipe.model';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-meal-planner',
  standalone: true,
  imports: [CommonModule, BottomNavComponent],
  template: `
    <div class="flex flex-col h-full bg-[#FFFFFF] overflow-hidden">
      <!-- Main Scrollable Area -->
      <div class="flex-1 px-5 pt-4 pb-4 space-y-4 min-h-0 overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between pb-1">
          <div class="flex items-center gap-3">
            <button
              type="button"
              (click)="goBack()"
              class="w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-[#103A2A] hover:bg-[#F1F5F2] active:scale-95 transition-transform"
              aria-label="Zurück"
            >
              <svg class="w-6 h-6 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <h1 class="text-xl sm:text-2xl font-extrabold text-[#103A2A] tracking-tight">
              Dein Mahlzeitenplan
            </h1>
          </div>
          <!-- Info Icon button -->
          <button
            type="button"
            (click)="showPlanInfo.set(!showPlanInfo())"
            class="w-9 h-9 rounded-full bg-[#F1F5F2] hover:bg-[#E5F5E8] flex items-center justify-center text-[#278F39] transition-colors"
            title="Info zum Plan"
          >
            <span class="text-sm font-bold">ℹ️</span>
          </button>
        </div>

        <!-- Plan Info Box -->
        @if (showPlanInfo()) {
          <div class="p-3.5 rounded-2xl bg-[#E5F5E8] border border-[#CDE9D2] text-xs text-[#103A2A] leading-relaxed animate-fade-in flex justify-between items-start">
            <p>
              Dein Plan ist kalorien- und budgetoptimiert für Netto Marken-Discount. Du kannst jede Mahlzeit flexibel gegen passende Alternativen austauschen!
            </p>
            <button (click)="showPlanInfo.set(false)" class="text-xs font-bold text-[#278F39] ml-2">✕</button>
          </div>
        }

        <!-- Day Selector Tabs (Horizontal Pills) -->
        <div class="flex gap-2 overflow-x-auto pb-1 no-scrollbar select-none">
          @for (day of plannerService.weeklyPlan(); track day.dayIndex) {
            <button
              type="button"
              (click)="plannerService.setDayIndex(day.dayIndex)"
              class="py-2 px-4 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex-shrink-0"
              [ngClass]="plannerService.currentDayIndex() === day.dayIndex
                ? 'bg-[#278F39] text-white shadow-soft-sm'
                : 'bg-[#F1F5F2] text-[#627264] hover:bg-[#E2EDE5]'"
            >
              {{ day.dayName }}
            </button>
          }
        </div>

        <!-- 4 Meal Cards (Matching Screen 5) -->
        @if (plannerService.currentDayPlan(); as day) {
          <div class="space-y-3 pt-1">
            <!-- 1. Frühstück -->
            <div
              (click)="openSwapModal('breakfast')"
              class="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E3EBE4] shadow-soft-sm hover:shadow-soft flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] select-none"
            >
              <div class="flex-1 min-w-0">
                <span class="text-[11px] font-bold text-[#627264] uppercase tracking-wider block">
                  Frühstück
                </span>
                <h3 class="text-sm font-bold text-[#103A2A] truncate mt-0.5">
                  {{ day.breakfast.title }}
                </h3>
                <div class="flex items-center gap-1.5 text-xs text-[#55695C] font-semibold mt-1">
                  <span>🔥 {{ day.breakfast.calories }} kcal</span>
                  <span>•</span>
                  <span>{{ day.breakfast.pricePerPortion.toFixed(2).replace('.', ',') }} €</span>
                </div>
              </div>

              <!-- Dish Image -->
              <div class="w-16 h-16 rounded-2xl overflow-hidden bg-[#F6F8F6] flex-shrink-0 border border-[#E3EBE4] shadow-2xs">
                <img [src]="day.breakfast.imageUrl" [alt]="day.breakfast.title" class="w-full h-full object-cover" />
              </div>
            </div>

            <!-- 2. Mittagessen -->
            <div
              (click)="openSwapModal('lunch')"
              class="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E3EBE4] shadow-soft-sm hover:shadow-soft flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] select-none"
            >
              <div class="flex-1 min-w-0">
                <span class="text-[11px] font-bold text-[#627264] uppercase tracking-wider block">
                  Mittagessen
                </span>
                <h3 class="text-sm font-bold text-[#103A2A] truncate mt-0.5">
                  {{ day.lunch.title }}
                </h3>
                <div class="flex items-center gap-1.5 text-xs text-[#55695C] font-semibold mt-1">
                  <span>🔥 {{ day.lunch.calories }} kcal</span>
                  <span>•</span>
                  <span>{{ day.lunch.pricePerPortion.toFixed(2).replace('.', ',') }} €</span>
                </div>
              </div>

              <!-- Dish Image -->
              <div class="w-16 h-16 rounded-2xl overflow-hidden bg-[#F6F8F6] flex-shrink-0 border border-[#E3EBE4] shadow-2xs">
                <img [src]="day.lunch.imageUrl" [alt]="day.lunch.title" class="w-full h-full object-cover" />
              </div>
            </div>

            <!-- 3. Snack -->
            <div
              (click)="openSwapModal('snack')"
              class="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E3EBE4] shadow-soft-sm hover:shadow-soft flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] select-none"
            >
              <div class="flex-1 min-w-0">
                <span class="text-[11px] font-bold text-[#627264] uppercase tracking-wider block">
                  Snack
                </span>
                <h3 class="text-sm font-bold text-[#103A2A] truncate mt-0.5">
                  {{ day.snack.title }}
                </h3>
                <div class="flex items-center gap-1.5 text-xs text-[#55695C] font-semibold mt-1">
                  <span>🔥 {{ day.snack.calories }} kcal</span>
                  <span>•</span>
                  <span>{{ day.snack.pricePerPortion.toFixed(2).replace('.', ',') }} €</span>
                </div>
              </div>

              <!-- Dish Image -->
              <div class="w-16 h-16 rounded-2xl overflow-hidden bg-[#F6F8F6] flex-shrink-0 border border-[#E3EBE4] shadow-2xs">
                <img [src]="day.snack.imageUrl" [alt]="day.snack.title" class="w-full h-full object-cover" />
              </div>
            </div>

            <!-- 4. Abendessen -->
            <div
              (click)="openSwapModal('dinner')"
              class="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E3EBE4] shadow-soft-sm hover:shadow-soft flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] select-none"
            >
              <div class="flex-1 min-w-0">
                <span class="text-[11px] font-bold text-[#627264] uppercase tracking-wider block">
                  Abendessen
                </span>
                <h3 class="text-sm font-bold text-[#103A2A] truncate mt-0.5">
                  {{ day.dinner.title }}
                </h3>
                <div class="flex items-center gap-1.5 text-xs text-[#55695C] font-semibold mt-1">
                  <span>🔥 {{ day.dinner.calories }} kcal</span>
                  <span>•</span>
                  <span>{{ day.dinner.pricePerPortion.toFixed(2).replace('.', ',') }} €</span>
                </div>
              </div>

              <!-- Dish Image -->
              <div class="w-16 h-16 rounded-2xl overflow-hidden bg-[#F6F8F6] flex-shrink-0 border border-[#E3EBE4] shadow-2xs">
                <img [src]="day.dinner.imageUrl" [alt]="day.dinner.title" class="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        }

        <!-- Daily Totals Summary Row (Matching Screen 5) -->
        <div class="p-3.5 rounded-2xl bg-[#F6F8F6] border border-[#E3EBE4] flex items-center justify-between text-xs font-bold text-[#103A2A]">
          <div class="flex items-center gap-1.5">
            <span>🔥</span>
            <span>{{ plannerService.currentDayTotals().calories | number }} kcal gesamt</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span>🛒</span>
            <span>{{ plannerService.currentDayTotals().cost.toFixed(2).replace('.', ',') }} € Kosten (ca.)</span>
          </div>
        </div>

        <!-- Action Button: Plan anpassen -->
        <div class="pt-1">
          <button
            type="button"
            (click)="openSwapModal('lunch')"
            class="w-full py-4 px-6 rounded-2xl bg-[#278F39] hover:bg-[#217A30] active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-button flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Plan anpassen</span>
            <span class="text-lg">→</span>
          </button>
        </div>
      </div>

      <!-- Meal Swap Modal / Drawer -->
      @if (swappingMealType(); as mealType) {
        <div class="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div class="bg-white rounded-t-3xl sm:rounded-3xl p-5 w-full max-w-sm max-h-[80vh] flex flex-col space-y-3 shadow-xl border border-[#E3EBE4]">
            <div class="flex justify-between items-center pb-2 border-b border-[#E3EBE4]">
              <div>
                <h3 class="text-sm font-extrabold text-[#103A2A]">
                  {{ getMealTypeLabel(mealType) }} austauschen
                </h3>
                <p class="text-[11px] text-[#627264]">Wähle eine gesunde Alternative</p>
              </div>
              <button
                type="button"
                (click)="closeSwapModal()"
                class="text-[#627264] hover:text-[#103A2A] font-bold text-base cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <!-- Recipe options list -->
            <div class="overflow-y-auto space-y-2 py-2">
              @for (alt of availableAlternatives(); track alt.id) {
                <div
                  (click)="confirmSwap(alt)"
                  class="p-2.5 rounded-2xl border border-[#E3EBE4] hover:border-[#278F39] hover:bg-[#E5F5E8]/30 flex items-center justify-between gap-2.5 cursor-pointer transition-all"
                >
                  <img [src]="alt.imageUrl" [alt]="alt.title" class="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  <div class="flex-1 min-w-0">
                    <h4 class="text-xs font-bold text-[#103A2A] truncate">{{ alt.title }}</h4>
                    <span class="text-[10px] text-[#627264] block">
                      🔥 {{ alt.calories }} kcal • {{ alt.pricePerPortion.toFixed(2).replace('.', ',') }} € • {{ alt.prepTimeMinutes }} Min.
                    </span>
                  </div>
                  <span class="text-xs font-bold text-[#278F39]">Wählen →</span>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Bottom Navigation -->
      <app-bottom-nav></app-bottom-nav>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out forwards;
    }
  `]
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
