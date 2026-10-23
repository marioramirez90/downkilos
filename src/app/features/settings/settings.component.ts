import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StorageService } from '../../core/services/storage.service';
import { CalorieCalculatorService } from '../../core/services/calorie-calculator.service';
import { UserProfile } from '../../core/models/user-profile.model';
import { CalorieCalculationResult } from '../../core/models/calorie-calculation.model';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, BottomNavComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  private router = inject(Router);
  private storageService = inject(StorageService);
  private calorieService = inject(CalorieCalculatorService);

  readonly profile = signal<UserProfile | null>(null);
  readonly calculation = signal<CalorieCalculationResult | null>(null);
  readonly showResetDialog = signal<boolean>(false);
  readonly isResetting = signal<boolean>(false);
  readonly resetErrorMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const p = await this.storageService.loadProfile();
    this.profile.set(p);

    if (p) {
      const calc = this.calorieService.calculate(p);
      this.calculation.set(calc);
    }
  }

  readonly userFirstName = computed(() => {
    return this.profile()?.name?.split(' ')[0] || 'Gast';
  });

  readonly formattedBirthDate = computed(() => {
    const bd = this.profile()?.birthDate;
    if (!bd) return '–';
    try {
      const d = new Date(bd);
      return d.toLocaleDateString('de-DE');
    } catch {
      return bd;
    }
  });

  readonly activityLabel = computed(() => {
    const act = this.profile()?.activityLevel;
    switch (act) {
      case 'sedentary': return 'Sitzend (Bürojob, wenig Bewegung)';
      case 'light': return 'Leicht aktiv (1–3 Tage/Woche Sport)';
      case 'moderate': return 'Moderat aktiv (3–5 Tage/Woche Sport)';
      case 'very_active': return 'Sehr aktiv (5+ Tage/Woche Sport)';
      default: return 'Moderat aktiv';
    }
  });

  readonly goalLabel = computed(() => {
    const g = this.profile()?.goal;
    switch (g) {
      case 'lose_weight': return 'Gewicht reduzieren (gesundes Abnehmen)';
      case 'maintain_weight': return 'Gewicht halten';
      case 'gain_weight': return 'Muskelaufbau / Zunehmen';
      default: return 'Gewicht reduzieren';
    }
  });

  readonly targetCalories = computed(() => {
    return this.calculation()?.dailyTargetKcal || 2000;
  });

  readonly maintenanceCalories = computed(() => {
    return this.calculation()?.tdee || 2400;
  });

  readonly calorieDeficit = computed(() => {
    return this.calculation()?.deficit || 400;
  });

  openEditProfile(): void {
    this.router.navigate(['/onboarding']);
  }

  openEditGoal(): void {
    this.router.navigate(['/calculator']);
  }

  confirmResetModal(): void {
    this.resetErrorMessage.set(null);
    this.showResetDialog.set(true);
  }

  cancelReset(): void {
    this.showResetDialog.set(false);
    this.resetErrorMessage.set(null);
  }

  async executeReset(): Promise<void> {
    this.isResetting.set(true);
    this.resetErrorMessage.set(null);

    const success = await this.storageService.resetAllData();
    this.isResetting.set(false);

    if (success) {
      this.showResetDialog.set(false);
      // Vollständiger Neustart zum Willkommensbildschirm
      this.router.navigate(['/']);
    } else {
      this.resetErrorMessage.set('Das Zurücksetzen ist fehlgeschlagen. Bitte versuche es erneut.');
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
