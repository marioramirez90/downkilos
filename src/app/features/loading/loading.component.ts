import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from '../../core/services/storage.service';
import { CalorieCalculatorService } from '../../core/services/calorie-calculator.service';
import { ProductService } from '../../core/services/product.service';
import { RetailerService } from '../../core/services/retailer.service';

export type LoadingMode = 'calculate' | 'dashboard';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.scss'
})
export class LoadingComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private storageService = inject(StorageService);
  private calorieService = inject(CalorieCalculatorService);
  private productService = inject(ProductService);
  private retailerService = inject(RetailerService);

  readonly mode = signal<LoadingMode>('dashboard');
  readonly title = signal<string>('Dein Dashboard wird vorbereitet …');
  readonly subtitle = signal<string>('Wir laden dein Kalorienziel und deine Lebensmittelübersicht.');
  readonly hasError = signal<boolean>(false);
  readonly errorMessage = signal<string>('');

  // Target minimum duration: 1.2 seconds (1200 ms) for smooth and responsive onboarding experience
  private readonly MIN_ANIMATION_DURATION_MS = 1200;

  async ngOnInit(): Promise<void> {
    const stepParam = this.route.snapshot.queryParamMap.get('step');
    if (stepParam === 'calculate') {
      this.mode.set('calculate');
      this.title.set('Wir berechnen dein persönliches Kalorienziel …');
      this.subtitle.set('Dein Ziel wird individuell aus deinen Angaben ermittelt.');
    } else {
      this.mode.set('dashboard');
      this.title.set('Dein Dashboard wird vorbereitet …');
      this.subtitle.set('Wir laden dein Kalorienziel und deine Lebensmittelübersicht.');
    }

    await this.startExecution();
  }

  private isExecuting = false;

  async startExecution(): Promise<void> {
    if (this.isExecuting) return;
    this.isExecuting = true;

    this.hasError.set(false);
    this.errorMessage.set('');

    const startTime = Date.now();

    try {
      if (this.mode() === 'calculate') {
        await this.executeCalorieCalculation();
      } else {
        await this.executeDashboardPreparation();
      }

      // Check whether quick mode was requested (e.g. during fast testing) or hold for visual inspection
      const isQuick = this.route.snapshot.queryParamMap.get('quick') === 'true';
      const isHold = this.route.snapshot.queryParamMap.get('hold') === 'true';

      const elapsed = Date.now() - startTime;
      const remainingTime = isQuick ? 0 : Math.max(0, this.MIN_ANIMATION_DURATION_MS - elapsed);

      if (!isHold) {
        setTimeout(() => {
          if (this.mode() === 'calculate') {
            this.router.navigate(['/calculator']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        }, remainingTime);
      }
    } catch (err: unknown) {
      console.error('Error during loading process', err);
      this.hasError.set(true);
      if (this.mode() === 'calculate') {
        this.errorMessage.set('Die Kalorienberechnung konnte nicht abgeschlossen werden. Bitte versuche es erneut.');
      } else {
        this.errorMessage.set('Die Vorbereitung konnte nicht abgeschlossen werden. Bitte versuche es erneut.');
      }
    } finally {
      this.isExecuting = false;
    }
  }

  private async executeCalorieCalculation(): Promise<void> {
    const profile = await this.storageService.loadProfile();
    if (!profile) {
      throw new Error('Kein Profil gefunden');
    }

    // Berechne Erhaltungsbedarf und Kalorienziel
    const calculation = this.calorieService.calculate(profile);
    if (!calculation || !calculation.dailyTargetKcal) {
      throw new Error('Fehler bei der Kalorienberechnung');
    }

    // Speichere das Ziel im Profil für spätere Sessions ab
    const updatedProfile = {
      ...profile,
      targetCalories: Math.round(calculation.dailyTargetKcal)
    };
    await this.storageService.saveProfile(updatedProfile);
  }

  private async executeDashboardPreparation(): Promise<void> {
    // 1. Profil & Kalorienziel verifizieren
    const profile = await this.storageService.loadProfile();
    if (profile) {
      this.calorieService.calculate(profile);
    }

    // 2. Marktauswahl laden
    await this.retailerService.loadPreference();

    // 3. Netto-Produktdaten initialisieren
    this.productService.loadInitialData();

    // 4. Onboarding als abgeschlossen markieren
    this.storageService.setOnboardingCompleted(true);
  }

  retry(): void {
    this.startExecution();
  }
}
