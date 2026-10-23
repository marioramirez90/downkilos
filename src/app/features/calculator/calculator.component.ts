import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StorageService } from '../../core/services/storage.service';
import { CalorieCalculatorService } from '../../core/services/calorie-calculator.service';
import { CalorieCalculationResult } from '../../core/models/calorie-calculation.model';
import { UserProfile } from '../../core/models/user-profile.model';

import { HamburgerButtonComponent } from '../../shared/components/hamburger-button/hamburger-button.component';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule, HamburgerButtonComponent, TranslatePipe],
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.scss'
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
