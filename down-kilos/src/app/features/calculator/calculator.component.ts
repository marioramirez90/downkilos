import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StorageService } from '../../core/services/storage.service';
import { CalorieCalculatorService } from '../../core/services/calorie-calculator.service';
import { CalorieCalculationResult } from '../../core/models/calorie-calculation.model';
import { UserProfile } from '../../core/models/user-profile.model';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col min-h-full px-5 pt-4 pb-6 bg-[#FFFFFF]">
      <!-- Header -->
      <div class="flex items-center gap-3 pb-2">
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
          Mein Kalorienbedarf
        </h1>
      </div>

      <!-- Segmented Tabs: Übersicht / Details -->
      <div class="flex p-1 bg-[#F1F5F2] rounded-2xl my-3 max-w-[280px] select-none">
        <button
          type="button"
          (click)="activeTab.set('overview')"
          class="flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
          [ngClass]="activeTab() === 'overview'
            ? 'bg-[#278F39] text-white shadow-soft-sm'
            : 'text-[#627264] hover:text-[#103A2A]'"
        >
          Übersicht
        </button>
        <button
          type="button"
          (click)="activeTab.set('details')"
          class="flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
          [ngClass]="activeTab() === 'details'
            ? 'bg-[#278F39] text-white shadow-soft-sm'
            : 'text-[#627264] hover:text-[#103A2A]'"
        >
          Details
        </button>
      </div>

      @if (calc(); as res) {
        @if (activeTab() === 'overview') {
          <!-- TAB 1: ÜBERSICHT (Matching Screen 3 from Reference) -->
          <div class="space-y-4 animate-fade-in flex-1">
            <!-- Calorie Circle Gauge -->
            <div class="relative flex flex-col items-center justify-center py-2">
              <div class="relative w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center">
                <!-- SVG Progress Ring -->
                <svg class="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                  <!-- Background Track -->
                  <circle
                    cx="80"
                    cy="80"
                    r="68"
                    stroke="#E3EBE4"
                    stroke-width="12"
                    fill="transparent"
                  />
                  <!-- Active Gradient / Green Progress -->
                  <circle
                    cx="80"
                    cy="80"
                    r="68"
                    stroke="#278F39"
                    stroke-width="12"
                    stroke-linecap="round"
                    fill="transparent"
                    [attr.stroke-dasharray]="427"
                    [attr.stroke-dashoffset]="getStrokeOffset(res)"
                    class="transition-all duration-1000 ease-out"
                  />
                </svg>

                <!-- Center Text -->
                <div class="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
                  <span class="text-3xl sm:text-4xl font-extrabold text-[#103A2A] tracking-tight leading-none">
                    {{ res.dailyTargetKcal | number }}
                  </span>
                  <span class="text-xs sm:text-sm font-semibold text-[#55695C] mt-0.5">
                    kcal
                  </span>
                  <span class="text-[11px] font-medium text-[#7A8E80] mt-1.5">
                    Tagesziel
                  </span>
                </div>
              </div>
            </div>

            <!-- Two Side-by-side Metric Cards -->
            <div class="grid grid-cols-2 gap-3">
              <!-- Card 1: Erhaltungsbedarf -->
              <div class="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E3EBE4] shadow-soft-sm flex flex-col justify-between">
                <div>
                  <span class="text-base sm:text-lg font-extrabold text-[#103A2A] block leading-tight">
                    {{ res.tdee | number }} kcal
                  </span>
                  <span class="text-xs font-semibold text-[#17241D] block mt-1">
                    Erhaltungsbedarf
                  </span>
                </div>
                <span class="text-[10px] text-[#7A8E80] mt-1 block">
                  (um dein Gewicht zu halten)
                </span>
              </div>

              <!-- Card 2: Kaloriendefizit -->
              <div class="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E3EBE4] shadow-soft-sm flex flex-col justify-between">
                <div>
                  <div class="flex items-center gap-1">
                    <span class="text-base sm:text-lg font-extrabold text-[#103A2A] leading-tight">
                      -{{ res.deficit }} kcal
                    </span>
                    <span class="text-sm">🔥</span>
                  </div>
                  <span class="text-xs font-semibold text-[#17241D] block mt-1">
                    Kaloriendefizit
                  </span>
                </div>
                <span class="text-[10px] text-[#7A8E80] mt-1 block">
                  (pro Tag)
                </span>
              </div>
            </div>

            <!-- Green Info Box -->
            <div class="p-3.5 rounded-2xl bg-[#E5F5E8] border border-[#CDE9D2] flex items-start gap-2.5">
              <span class="text-base text-[#278F39] flex-shrink-0 mt-0.5">ℹ️</span>
              <p class="text-xs text-[#103A2A] font-medium leading-relaxed">
                Mit {{ res.dailyTargetKcal | number }} kcal pro Tag erreichst du dein Ziel auf gesunde und nachhaltige Weise.
              </p>
            </div>

            <!-- Forecast Section -->
            <div class="space-y-2 pt-1">
              <h3 class="text-xs font-bold text-[#103A2A] tracking-tight">
                Dein voraussichtlicher Fortschritt
              </h3>
              <div class="grid grid-cols-2 gap-3">
                <div class="p-3 rounded-2xl bg-[#F6F8F6] border border-[#E3EBE4] text-center">
                  <span class="text-sm sm:text-base font-extrabold text-[#103A2A] block">
                    -{{ res.forecast.weeklyLossKg | number:'1.1-1' }} kg
                  </span>
                  <span class="text-[11px] text-[#627264] mt-0.5 block">
                    pro Woche
                  </span>
                </div>

                <div class="p-3 rounded-2xl bg-[#F6F8F6] border border-[#E3EBE4] text-center">
                  <span class="text-sm sm:text-base font-extrabold text-[#103A2A] block">
                    -{{ res.forecast.monthlyLossMinKg }} bis {{ res.forecast.monthlyLossMaxKg }} kg
                  </span>
                  <span class="text-[11px] text-[#627264] mt-0.5 block">
                    pro Monat
                  </span>
                </div>
              </div>
            </div>
          </div>
        } @else {
          <!-- TAB 2: DETAILS (Macros & Medical Safety Protection) -->
          <div class="space-y-4 animate-fade-in flex-1">
            <!-- Macronutrients Distribution -->
            <div class="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E3EBE4] shadow-soft-sm space-y-3">
              <h3 class="text-xs font-bold text-[#103A2A] uppercase tracking-wider">
                Optimale Nährstoffverteilung (Schätzwerte)
              </h3>

              <!-- Protein -->
              <div class="space-y-1">
                <div class="flex justify-between text-xs">
                  <span class="font-semibold text-[#103A2A]">Eiweiß</span>
                  <span class="text-[#627264] font-medium">
                    {{ res.macros.proteinGrams }} g ({{ res.macros.proteinPercentage }}%)
                  </span>
                </div>
                <div class="w-full h-2 rounded-full bg-[#F1F5F2] overflow-hidden">
                  <div class="h-full bg-[#278F39] rounded-full" [style.width.%]="res.macros.proteinPercentage"></div>
                </div>
              </div>

              <!-- Carbs -->
              <div class="space-y-1">
                <div class="flex justify-between text-xs">
                  <span class="font-semibold text-[#103A2A]">Kohlenhydrate</span>
                  <span class="text-[#627264] font-medium">
                    {{ res.macros.carbsGrams }} g ({{ res.macros.carbsPercentage }}%)
                  </span>
                </div>
                <div class="w-full h-2 rounded-full bg-[#F1F5F2] overflow-hidden">
                  <div class="h-full bg-[#EAB308] rounded-full" [style.width.%]="res.macros.carbsPercentage"></div>
                </div>
              </div>

              <!-- Fat -->
              <div class="space-y-1">
                <div class="flex justify-between text-xs">
                  <span class="font-semibold text-[#103A2A]">Fette</span>
                  <span class="text-[#627264] font-medium">
                    {{ res.macros.fatGrams }} g ({{ res.macros.fatPercentage }}%)
                  </span>
                </div>
                <div class="w-full h-2 rounded-full bg-[#F1F5F2] overflow-hidden">
                  <div class="h-full bg-[#3B82F6] rounded-full" [style.width.%]="res.macros.fatPercentage"></div>
                </div>
              </div>
            </div>

            <!-- Metabolism Breakdown -->
            <div class="p-4 rounded-2xl bg-[#F6F8F6] border border-[#E3EBE4] space-y-2 text-xs">
              <h3 class="font-bold text-[#103A2A]">Stoffwechselanalyse</h3>
              <div class="flex justify-between text-[#55695C] pt-1">
                <span>Ruheenergieverbrauch (BMR):</span>
                <span class="font-bold text-[#103A2A]">{{ res.bmr | number }} kcal</span>
              </div>
              <div class="flex justify-between text-[#55695C]">
                <span>Gesamtenergieverbrauch (TDEE):</span>
                <span class="font-bold text-[#103A2A]">{{ res.tdee | number }} kcal</span>
              </div>
              <div class="flex justify-between text-[#55695C]">
                <span>Angewandte Formel:</span>
                <span class="font-medium text-[#103A2A]">Mifflin-St. Jeor</span>
              </div>
            </div>

            <!-- Health & Safety Advisory -->
            <div class="p-3.5 rounded-2xl bg-[#FEF9C3] border border-[#FDE047] text-[11px] text-[#713F12] leading-relaxed">
              <strong>Gesundheitshinweis:</strong>
              Diese Werte sind Schätzwerte für gesunde Erwachsene. Besondere Situationen wie Schwangerschaft, Stillzeit oder medizinische Vorerkrankungen erfordern ärztliche Absprache.
            </div>
          </div>
        }

        <!-- Bottom CTA Button -->
        <div class="pt-4 mt-auto">
          <button
            type="button"
            (click)="goToRetailers()"
            class="w-full py-4 px-6 rounded-2xl bg-[#278F39] hover:bg-[#217A30] active:scale-[0.98] text-white font-bold text-base shadow-button flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Weiter zur Marktauswahl</span>
            <span class="text-lg">→</span>
          </button>
        </div>
      }
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
export class CalculatorComponent implements OnInit {
  private router = inject(Router);
  private storageService = inject(StorageService);
  private calorieService = inject(CalorieCalculatorService);

  activeTab = signal<'overview' | 'details'>('overview');
  calc = signal<CalorieCalculationResult | null>(null);

  async ngOnInit() {
    let profile = await this.storageService.loadProfile();
    if (!profile) {
      // Default fallback profile matching Lisa Müller from reference
      profile = {
        id: 'guest_profile',
        name: 'Lisa Müller',
        birthDate: '1990-05-14',
        gender: 'female',
        currentWeight: 78,
        height: 168,
        activityLevel: 'sedentary',
        goal: 'lose_weight',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    const result = this.calorieService.calculate(profile);
    this.calc.set(result);
  }

  getStrokeOffset(res: CalorieCalculationResult): number {
    const totalCircumference = 427; // 2 * PI * 68 ≈ 427.25
    if (!res || !res.tdee) return totalCircumference * 0.2;
    // Percentage ratio of target vs maintenance
    const ratio = Math.min(1, Math.max(0.1, res.dailyTargetKcal / res.tdee));
    return totalCircumference * (1 - ratio);
  }

  goBack() {
    this.router.navigate(['/onboarding']);
  }

  goToRetailers() {
    this.router.navigate(['/retailers']);
  }
}
