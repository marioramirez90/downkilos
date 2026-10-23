import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from '../../core/services/storage.service';
import { CalorieCalculatorService } from '../../core/services/calorie-calculator.service';
import { ProductService } from '../../core/services/product.service';

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

  readonly loadingStep = signal<string>('Dein Down-Kilos-Erlebnis wird vorbereitet...');
  readonly hasError = signal<boolean>(false);
  readonly errorMessage = signal<string>('');

  async ngOnInit(): Promise<void> {
    await this.startPreparation();
  }

  async startPreparation(): Promise<void> {
    this.hasError.set(false);
    this.errorMessage.set('');

    try {
      // 1. Profil und Kalorienziel laden & verifizieren
      this.loadingStep.set('Persönliches Kalorienziel abrufen...');
      const profile = await this.storageService.loadProfile();
      if (profile) {
        this.calorieService.calculate(profile);
      }

      // 2. Marktauswahl laden
      this.loadingStep.set('Ausgewählten Supermarkt laden...');
      await this.storageService.loadRetailerPreference();

      // 3. Netto-Produktdaten initialisieren
      this.loadingStep.set('Wir bereiten deine Lebensmittelübersicht vor...');
      this.productService.loadInitialData();

      // 4. Onboarding-Status als abgeschlossen markieren
      this.storageService.setOnboardingCompleted(true);

      // Weicher Übergang zum Dashboard (sofern nicht hold=true zur visuellen Prüfung aktiv ist)
      if (this.route.snapshot.queryParamMap.get('hold') !== 'true') {
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      }
    } catch (err: unknown) {
      console.error('Error during dashboard preparation', err);
      this.hasError.set(true);
      this.errorMessage.set('Die Vorbereitung konnte nicht abgeschlossen werden. Bitte versuche es erneut.');
    }
  }

  retry(): void {
    this.startPreparation();
  }
}
