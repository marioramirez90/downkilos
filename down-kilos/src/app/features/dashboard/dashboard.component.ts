import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StorageService } from '../../core/services/storage.service';
import { CalorieCalculatorService } from '../../core/services/calorie-calculator.service';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { UserProfile } from '../../core/models/user-profile.model';
import { RetailerPreference } from '../../core/models/retailer.model';
import { CalorieCalculationResult } from '../../core/models/calorie-calculation.model';

import { HamburgerButtonComponent } from '../../shared/components/hamburger-button/hamburger-button.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BottomNavComponent, HamburgerButtonComponent],
  template: `
    <div class="flex flex-col h-full bg-[#FFFFFF] overflow-hidden">
      <!-- Main Scrollable Dashboard Content -->
      <div class="flex-1 px-5 pt-4 pb-4 space-y-4 min-h-0 overflow-y-auto">
        <!-- Top Greeting Header -->
        <div class="flex items-center justify-between pb-1">
          <div>
            <h1 class="text-2xl sm:text-[26px] font-extrabold text-[#103A2A] tracking-tight">
              Hallo, {{ userFirstName() }}!
            </h1>
            <p class="text-xs text-[#55695C] mt-0.5 font-medium">
              Heute • {{ todayDateFormatted() }}
            </p>
          </div>
          <!-- Top Right Actions: Hamburger Menu + Profile -->
          <div class="flex items-center gap-1.5">
            <app-hamburger-button></app-hamburger-button>
            <button
              type="button"
              (click)="goToProfileEdit()"
              class="w-10 h-10 rounded-full bg-[#F1F5F2] hover:bg-[#E5F5E8] flex items-center justify-center text-[#103A2A] transition-colors"
              title="Profil bearbeiten"
            >
              <svg class="w-5 h-5 text-[#278F39]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Calorie Ring & Macros Card (Matching Screen 7) -->
        <div class="p-4 rounded-3xl bg-[#FFFFFF] border border-[#E3EBE4] shadow-soft-sm space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-[#103A2A] uppercase tracking-wider">
              Tagesbedarf
            </span>
            <span class="text-xs font-semibold text-[#278F39]">
              {{ remainingKcal() }} kcal übrig
            </span>
          </div>

          <div class="flex items-center gap-4">
            <!-- Calorie Circular Progress Ring -->
            <div class="relative w-32 h-32 sm:w-36 sm:h-36 flex-shrink-0 flex items-center justify-center">
              <svg class="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="#E3EBE4"
                  stroke-width="10"
                  fill="transparent"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="#278F39"
                  stroke-width="10"
                  stroke-linecap="round"
                  fill="transparent"
                  [attr.stroke-dasharray]="314"
                  [attr.stroke-dashoffset]="calorieDashOffset()"
                  class="transition-all duration-1000 ease-out"
                />
              </svg>
              <!-- Center Text inside ring -->
              <div class="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
                <span class="text-xl sm:text-2xl font-black text-[#103A2A] leading-none">
                  {{ eatenKcal() | number }}
                </span>
                <span class="text-[10px] sm:text-[11px] font-semibold text-[#627264] mt-0.5">
                  von {{ targetKcal() | number }} kcal
                </span>
              </div>
            </div>

            <!-- Daily Macro Progress Bars -->
            <div class="flex-1 space-y-2.5">
              <!-- Eiweiß -->
              <div class="space-y-1">
                <div class="flex justify-between text-[11px]">
                  <span class="font-bold text-[#103A2A]">Eiweiß</span>
                  <span class="text-[#627264] font-semibold">{{ eatenProtein() }} / {{ targetProtein() }} g</span>
                </div>
                <div class="w-full h-1.5 rounded-full bg-[#F1F5F2] overflow-hidden">
                  <div class="h-full bg-[#278F39] rounded-full" [style.width.%]="macroRatio(eatenProtein(), targetProtein())"></div>
                </div>
              </div>

              <!-- Kohlenhydrate -->
              <div class="space-y-1">
                <div class="flex justify-between text-[11px]">
                  <span class="font-bold text-[#103A2A]">Kohlenhydrate</span>
                  <span class="text-[#627264] font-semibold">{{ eatenCarbs() }} / {{ targetCarbs() }} g</span>
                </div>
                <div class="w-full h-1.5 rounded-full bg-[#F1F5F2] overflow-hidden">
                  <div class="h-full bg-[#EAB308] rounded-full" [style.width.%]="macroRatio(eatenCarbs(), targetCarbs())"></div>
                </div>
              </div>

              <!-- Fett -->
              <div class="space-y-1">
                <div class="flex justify-between text-[11px]">
                  <span class="font-bold text-[#103A2A]">Fett</span>
                  <span class="text-[#627264] font-semibold">{{ eatenFat() }} / {{ targetFat() }} g</span>
                </div>
                <div class="w-full h-1.5 rounded-full bg-[#F1F5F2] overflow-hidden">
                  <div class="h-full bg-[#F97316] rounded-full" [style.width.%]="macroRatio(eatenFat(), targetFat())"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Two Status Summary Chips -->
        <div class="grid grid-cols-2 gap-3">
          <div class="p-3 rounded-2xl bg-[#F6F8F6] border border-[#E3EBE4] flex items-center gap-2.5">
            <span class="text-lg">⚖️</span>
            <div class="flex flex-col">
              <span class="text-xs font-extrabold text-[#103A2A]">-2,3 kg</span>
              <span class="text-[10px] text-[#627264]">seit 4 Wochen</span>
            </div>
          </div>

          <div class="p-3 rounded-2xl bg-[#F6F8F6] border border-[#E3EBE4] flex items-center gap-2.5">
            <span class="text-lg">🔥</span>
            <div class="flex flex-col">
              <span class="text-xs font-extrabold text-[#103A2A]">12 Tage</span>
              <span class="text-[10px] text-[#627264]">in Folge aktiv</span>
            </div>
          </div>
        </div>

        <!-- Main Action Buttons -->
        <div class="space-y-2.5 pt-1">
          <!-- Button: Mahlzeiten planen -->
          <button
            type="button"
            (click)="goToMealPlanner()"
            class="w-full py-4 px-6 rounded-2xl bg-[#278F39] hover:bg-[#217A30] active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-button flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Mahlzeiten planen</span>
            <span class="text-lg">→</span>
          </button>

          <!-- Button: Einkaufsliste öffnen -->
          <button
            type="button"
            (click)="goToShoppingList()"
            class="w-full py-3.5 px-6 rounded-2xl bg-[#FFFFFF] border-2 border-[#E3EBE4] hover:bg-[#F6F8F6] active:scale-[0.98] text-[#103A2A] font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>🛒</span>
            <span>Einkaufsliste öffnen</span>
          </button>
        </div>

        <!-- Target Weight Progress Card -->
        <div class="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E3EBE4] shadow-soft-sm space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-[#103A2A]">
              Mein Ziel: {{ goalLabel() }}
            </span>
            <button
              type="button"
              (click)="goToProfileEdit()"
              class="text-xs font-bold text-[#278F39] hover:underline cursor-pointer"
            >
              Ändern
            </button>
          </div>
          <!-- Bar -->
          <div class="w-full h-2 rounded-full bg-[#E5F5E8] overflow-hidden">
            <div class="h-full bg-[#278F39] rounded-full w-[65%]"></div>
          </div>
          <div class="flex justify-between text-xs">
            <span class="font-bold text-[#103A2A]">{{ currentWeight() }} kg <span class="font-normal text-[#627264]">aktuell</span></span>
            <span class="font-bold text-[#103A2A]">{{ targetWeight() }} kg <span class="font-normal text-[#627264]">Zielgewicht</span></span>
          </div>
        </div>

        <!-- Netto Market Card & Weekly Budget Card -->
        <div class="grid grid-cols-2 gap-3">
          <!-- Netto Card -->
          <div
            (click)="goToRetailers()"
            class="p-3.5 rounded-2xl bg-[#FFFDE6] border border-[#FDE047] shadow-soft-sm cursor-pointer hover:bg-[#FFFACD] transition-colors"
          >
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-black text-[#ED1C24] italic">Netto</span>
              <span class="text-[9px] uppercase font-bold text-[#713F12]">Mein Markt</span>
            </div>
            <p class="text-xs font-bold text-[#103A2A] mt-1.5 truncate">
              {{ retailerLocation() }}
            </p>
            <span class="text-[10px] text-[#278F39] font-semibold mt-1 block">
              Angebote aktiv →
            </span>
          </div>

          <!-- Budget Card -->
          <div
            (click)="goToRetailers()"
            class="p-3.5 rounded-2xl bg-[#F6F8F6] border border-[#E3EBE4] shadow-soft-sm cursor-pointer hover:bg-[#EEF2EE] transition-colors"
          >
            <span class="text-[9px] uppercase font-bold text-[#627264]">
              Wochenbudget
            </span>
            <p class="text-base font-extrabold text-[#103A2A] mt-1">
              {{ weeklyBudget() }} €
            </p>
            <span class="text-[10px] text-[#55695C] block">
              ca. 14,65 € verplant
            </span>
          </div>
        </div>
      </div>

      <!-- Persistent 5-Icon Bottom Navigation -->
      <app-bottom-nav></app-bottom-nav>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private storageService = inject(StorageService);
  private calorieService = inject(CalorieCalculatorService);

  profile = signal<UserProfile | null>(null);
  retailerPref = signal<RetailerPreference | null>(null);
  calculation = signal<CalorieCalculationResult | null>(null);

  // Calorie & Macro Mock consumption for demonstration
  eatenKcal = signal<number>(1250);
  eatenProtein = signal<number>(78);
  eatenCarbs = signal<number>(120);
  eatenFat = signal<number>(42);

  async ngOnInit() {
    let p = await this.storageService.loadProfile();
    if (!p) {
      p = {
        id: 'guest_profile',
        name: 'Lisa Müller',
        birthDate: '1990-05-14',
        gender: 'female',
        currentWeight: 78,
        height: 168,
        targetWeight: 70,
        activityLevel: 'sedentary',
        goal: 'lose_weight',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    this.profile.set(p);

    const pref = await this.storageService.loadRetailerPreference();
    if (pref) {
      this.retailerPref.set(pref);
    }

    const calc = this.calorieService.calculate(p);
    this.calculation.set(calc);
  }

  userFirstName(): string {
    const p = this.profile();
    if (!p || !p.name) return 'Lisa';
    return p.name.split(' ')[0];
  }

  todayDateFormatted(): string {
    const today = new Date();
    return today.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }

  targetKcal(): number {
    return this.calculation()?.dailyTargetKcal || 2000;
  }

  remainingKcal(): number {
    return Math.max(0, this.targetKcal() - this.eatenKcal());
  }

  calorieDashOffset(): number {
    const circumference = 314; // 2 * PI * 50 ≈ 314
    const ratio = Math.min(1, Math.max(0, this.eatenKcal() / this.targetKcal()));
    return circumference * (1 - ratio);
  }

  targetProtein(): number {
    return this.calculation()?.macros.proteinGrams || 150;
  }

  targetCarbs(): number {
    return this.calculation()?.macros.carbsGrams || 250;
  }

  targetFat(): number {
    return this.calculation()?.macros.fatGrams || 70;
  }

  macroRatio(eaten: number, target: number): number {
    if (!target) return 0;
    return Math.min(100, Math.round((eaten / target) * 100));
  }

  goalLabel(): string {
    const g = this.profile()?.goal;
    if (g === 'lose_weight') return 'Gewicht reduzieren';
    if (g === 'gain_weight') return 'Muskelaufbau';
    return 'Gewicht halten';
  }

  currentWeight(): number {
    return this.profile()?.currentWeight || 78;
  }

  targetWeight(): number {
    return this.profile()?.targetWeight || 70;
  }

  retailerLocation(): string {
    const pref = this.retailerPref();
    if (!pref) return 'Netto Berlin – Mitte';
    return `${pref.city || 'Berlin'}`;
  }

  weeklyBudget(): number {
    return this.retailerPref()?.weeklyBudget || 40;
  }

  goToMealPlanner() {
    this.router.navigate(['/meal-planner']);
  }

  goToShoppingList() {
    this.router.navigate(['/shopping-list']);
  }

  goToProfileEdit() {
    this.router.navigate(['/onboarding']);
  }

  goToRetailers() {
    this.router.navigate(['/retailers']);
  }
}
