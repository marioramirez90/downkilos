import { Component, computed, inject, OnInit, signal } from '@angular/core';
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
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.scss'
})
export class CalculatorComponent implements OnInit {
  private router = inject(Router);
  private storageService = inject(StorageService);
  private calorieService = inject(CalorieCalculatorService);

  readonly activeTab = signal<'overview' | 'details'>('overview');

  toggleTab(): void {
    this.activeTab.set(this.activeTab() === 'overview' ? 'details' : 'overview');
  }

  // Reaktives Profil aus dem Storage (KEINE Dummy-Daten im Produktivcode)
  readonly profile = computed<UserProfile | null>(() => {
    return this.storageService.profile();
  });

  // Automatische Neuberechnung bei jeder Profiländerung
  readonly calc = computed<CalorieCalculationResult | null>(() => {
    const prof = this.profile();
    if (!prof) return null;
    return this.calorieService.calculate(prof);
  });

  readonly userFirstName = computed<string>(() => {
    const name = this.profile()?.name || '';
    if (!name.trim()) return '';
    return name.trim().split(' ')[0];
  });

  readonly formattedTargetKcal = computed<string>(() => {
    const c = this.calc();
    if (!c) return '0';
    return Math.round(c.dailyTargetKcal).toLocaleString('de-DE');
  });

  readonly formattedTdee = computed<string>(() => {
    const c = this.calc();
    if (!c) return '0';
    return Math.round(c.tdee).toLocaleString('de-DE');
  });

  readonly formattedBmr = computed<string>(() => {
    const c = this.calc();
    if (!c) return '0';
    return Math.round(c.bmr).toLocaleString('de-DE');
  });

  readonly deficitValue = computed<number>(() => {
    const c = this.calc();
    return c ? c.deficit : 0;
  });

  readonly deficitDisplay = computed<string>(() => {
    const p = this.profile();
    const c = this.calc();
    if (!c) return '0';
    if (p?.goal === 'gain_weight') {
      return `+${Math.abs(c.deficit)}`;
    }
    if (p?.goal === 'maintain_weight') {
      return '0';
    }
    return `${c.deficit}`;
  });

  readonly deficitSubtitle = computed<string>(() => {
    const p = this.profile();
    if (p?.goal === 'maintain_weight') return '(Gewicht stabil halten)';
    if (p?.goal === 'gain_weight') return '(für Muskelaufbau)';
    return '(für gesundes Abnehmen)';
  });

  readonly explanationHeadline = computed<string>(() => {
    const p = this.profile();
    if (p?.goal === 'maintain_weight') {
      return 'Mit deinem täglichen Kalorienziel deckst du deinen Erhaltungsbedarf.';
    }
    if (p?.goal === 'gain_weight') {
      return 'Mit deinem täglichen Kalorienziel planst du einen gesunden Kalorienüberschuss.';
    }
    return 'Mit deinem täglichen Kalorienziel planst du eine moderate Energieeinsparung.';
  });

  readonly explanationBody = computed<string>(() => {
    const p = this.profile();
    if (p?.goal === 'maintain_weight') {
      return 'Down Kilos unterstützt dich dabei, passende Lebensmittel zu entdecken und dein Gewicht stabil zu halten.';
    }
    if (p?.goal === 'gain_weight') {
      return 'Down Kilos unterstützt dich dabei, proteinreiche und passende Lebensmittel für den gezielten Aufbau zu entdecken.';
    }
    return 'Down Kilos unterstützt dich dabei, passende Lebensmittel zu entdecken.';
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

  readonly fourWeekRangeText = computed<string>(() => {
    const c = this.calc();
    if (!c || c.isMinor || c.deficit <= 0) return 'Gewicht stabil';
    const def = c.deficit;
    if (def < 250) return 'ungefähr -0,5 kg';
    if (def <= 450) return '-0,5 bis -1,0 kg';
    return '-1,0 bis -1,5 kg';
  });

  readonly threeMonthRangeText = computed<string>(() => {
    const c = this.calc();
    if (!c || c.isMinor || c.deficit <= 0) return 'Gewicht stabil';
    const def = c.deficit;
    if (def < 250) return 'ungefähr -1,5 kg';
    if (def <= 450) return '-2 bis -4 kg';
    return '-4 bis -6 kg';
  });

  async ngOnInit(): Promise<void> {
    const p = await this.storageService.loadProfile();
    if (!p) {
      this.router.navigate(['/onboarding']);
    } else {
      this.storageService.profile.set(p);
    }
  }

  goBack(): void {
    this.router.navigate(['/onboarding']);
  }

  goToRetailers(): void {
    this.router.navigate(['/retailers']);
  }
}
