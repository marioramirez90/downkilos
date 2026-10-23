import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StorageService } from '../../core/services/storage.service';
import { CalorieCalculatorService } from '../../core/services/calorie-calculator.service';
import { CalorieCalculationResult } from '../../core/models/calorie-calculation.model';
import { UserProfile } from '../../core/models/user-profile.model';
import { HamburgerButtonComponent } from '../../shared/components/hamburger-button/hamburger-button.component';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule, HamburgerButtonComponent],
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.scss'
})
export class CalculatorComponent implements OnInit {
  private router = inject(Router);
  private storageService = inject(StorageService);
  private calorieService = inject(CalorieCalculatorService);

  readonly activeTab = signal<'overview' | 'details'>('overview');

  // Reaktives Profil aus dem Storage
  readonly profile = computed<UserProfile>(() => {
    const stored = this.storageService.profile();
    if (stored) return stored;
    // Lisa Müller Fallback falls noch kein Profil existiert
    return {
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
  });

  // Automatische Neuberechnung bei jeder Profiländerung
  readonly calc = computed<CalorieCalculationResult>(() => {
    return this.calorieService.calculate(this.profile());
  });

  readonly userFirstName = computed<string>(() => {
    const name = this.profile().name || 'Lisa';
    return name.trim().split(' ')[0];
  });

  readonly formattedTargetKcal = computed<string>(() => {
    return Math.round(this.calc().dailyTargetKcal).toLocaleString('de-DE');
  });

  readonly formattedTdee = computed<string>(() => {
    return Math.round(this.calc().tdee).toLocaleString('de-DE');
  });

  readonly formattedBmr = computed<string>(() => {
    return Math.round(this.calc().bmr).toLocaleString('de-DE');
  });

  readonly calorieRatio = computed<number>(() => {
    const res = this.calc();
    if (!res || !res.tdee) return 0.75;
    return Math.min(1, Math.max(0.1, res.dailyTargetKcal / res.tdee));
  });

  readonly calorieDashOffset = computed<number>(() => {
    const circumference = 478; // 2 * PI * 76 ≈ 477.52
    return Math.round(circumference * (1 - this.calorieRatio()));
  });

  async ngOnInit(): Promise<void> {
    await this.storageService.loadProfile();
  }

  goBack(): void {
    this.router.navigate(['/onboarding']);
  }

  goToRetailers(): void {
    this.router.navigate(['/retailers']);
  }
}
