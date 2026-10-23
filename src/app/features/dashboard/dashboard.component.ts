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
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
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
