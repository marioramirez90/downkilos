import { Component, computed, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StorageService } from '../../core/services/storage.service';
import { CalorieCalculatorService } from '../../core/services/calorie-calculator.service';
import { CalorieCalculationResult } from '../../core/models/calorie-calculation.model';
import { UserProfile } from '../../core/models/user-profile.model';
import { CalorieResultRingComponent } from '../../shared/components/calorie-result-ring/calorie-result-ring.component';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule, CalorieResultRingComponent],
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

  // Reaktives Profil
  readonly profile = signal<UserProfile | null>(null);

  constructor() {
    // Synchronisiere initial mit dem Storage-Signal
    const initialProf = this.storageService.profile();
    if (initialProf) {
      this.profile.set(initialProf);
    }

    // Höre auf Updates am Storage-Signal
    effect(() => {
      const p = this.storageService.profile();
      if (p) {
        this.profile.set(p);
      }
    });
  }

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
    if (!c) return '2.000';
    return Math.round(c.dailyTargetKcal).toLocaleString('de-DE');
  });

  readonly formattedTdee = computed<string>(() => {
    const c = this.calc();
    if (!c) return '2.300';
    return Math.round(c.tdee).toLocaleString('de-DE');
  });

  readonly formattedBmr = computed<string>(() => {
    const c = this.calc();
    if (!c) return '1.500';
    return Math.round(c.bmr).toLocaleString('de-DE');
  });

  readonly deficitDisplay = computed<string>(() => {
    const p = this.profile();
    const c = this.calc();
    if (!c) return '-300';
    if (p?.goal === 'gain_weight') {
      return `+${Math.abs(c.deficit)}`;
    }
    if (p?.goal === 'maintain_weight') {
      return '0';
    }
    return `-${Math.abs(c.deficit)}`;
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
      return `Mit ${this.formattedTargetKcal()} kcal pro Tag deckst du deinen Erhaltungsbedarf.`;
    }
    if (p?.goal === 'gain_weight') {
      return `Mit ${this.formattedTargetKcal()} kcal pro Tag planst du einen gesunden Kalorienüberschuss.`;
    }
    return `Mit ${this.formattedTargetKcal()} kcal pro Tag erreichst du ein moderates Kaloriendefizit.`;
  });

  readonly explanationBody = computed<string>(() => {
    const p = this.profile();
    if (p?.goal === 'maintain_weight') {
      return 'Das hilft dir dabei, auf gesunde Weise dein Gewicht stabil zu halten, ohne auf deine Lieblingslebensmittel verzichten zu müssen.';
    }
    if (p?.goal === 'gain_weight') {
      return 'Das unterstützt dich dabei, gezielt Muskeln aufzubauen, ohne auf deine Lieblingslebensmittel verzichten zu müssen.';
    }
    return 'Das kann dir helfen, auf gesunde und nachhaltige Weise abzunehmen, ohne auf deine Lieblingslebensmittel verzichten zu müssen.';
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
    if (p) {
      this.profile.set(p);
      this.storageService.profile.set(p);
      this.calorieService.calculate(p);
    } else {
      const current = this.storageService.profile();
      if (current) {
        this.profile.set(current);
        this.calorieService.calculate(current);
      } else {
        this.router.navigate(['/onboarding']);
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/onboarding']);
  }

  goToRetailers(): void {
    this.router.navigate(['/retailers']);
  }
}
