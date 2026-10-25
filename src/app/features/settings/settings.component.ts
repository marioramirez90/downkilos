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

  // Modals & Dialoge
  readonly showResetDialog = signal<boolean>(false);
  readonly showAppSettingsModal = signal<boolean>(false);
  readonly showPrivacyModal = signal<boolean>(false);
  readonly showSupportModal = signal<boolean>(false);
  readonly showAboutModal = signal<boolean>(false);
  readonly showRateModal = signal<boolean>(false);

  readonly isResetting = signal<boolean>(false);
  readonly resetErrorMessage = signal<string | null>(null);
  readonly toastMessage = signal<string | null>(null);

  // App-Version (aus package.json / Config)
  readonly appVersion = '1.0.0';

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

  openEditProfile(): void {
    this.router.navigate(['/settings/profile']);
  }

  openEditGoal(): void {
    this.router.navigate(['/settings/goals']);
  }

  openDietaryProfile(): void {
    this.router.navigate(['/dietary-profile'], { queryParams: { returnUrl: '/settings' } });
  }

  openAppSettings(): void {
    this.showAppSettingsModal.set(true);
  }

  openPrivacy(): void {
    this.showPrivacyModal.set(true);
  }

  openSupport(): void {
    this.showSupportModal.set(true);
  }

  openRate(): void {
    this.showRateModal.set(true);
  }

  openAbout(): void {
    this.showAboutModal.set(true);
  }

  goToPrivacy(): void {
    this.showPrivacyModal.set(false);
    this.router.navigate(['/settings/privacy']);
  }

  goToImprint(): void {
    this.showAboutModal.set(false);
    this.router.navigate(['/settings/imprint']);
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
      this.router.navigate(['/']);
    } else {
      this.resetErrorMessage.set('Das Zurücksetzen ist fehlgeschlagen. Bitte versuche es erneut.');
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 2800);
  }
}
