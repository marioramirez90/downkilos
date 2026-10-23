import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { StorageService } from '../../core/services/storage.service';
import { CalorieCalculatorService } from '../../core/services/calorie-calculator.service';
import { FoodLogService } from '../../core/services/food-log.service';
import { WeightEntry } from '../../core/models/weight-log.model';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { HamburgerButtonComponent } from '../../shared/components/hamburger-button/hamburger-button.component';

export interface DisplayWeightEntry {
  id: string;
  date: string;
  formattedDate: string;
  weight: number;
  note?: string;
  weekLabel: string;
  diffFromPrev?: number;
  diffFormatted?: string;
}

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BottomNavComponent,
    HamburgerButtonComponent,
    TranslatePipe
  ],
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.scss'
})
export class ProgressComponent implements OnInit {
  private router = inject(Router);
  storageService = inject(StorageService);
  private calorieService = inject(CalorieCalculatorService);
  foodLogService = inject(FoodLogService);

  showAddModal = false;
  showResetConfirm = false;
  editingEntryId: string | null = null;

  newWeightVal: number | null = null;
  newWeightDate: string = new Date().toISOString().split('T')[0];
  newWeightNote = '';

  readonly weightEntries = computed(() => this.storageService.weightHistory());
  readonly profile = computed(() => this.storageService.profile());

  // Weights
  readonly currentWeight = computed(() => {
    const list = this.weightEntries();
    if (list.length > 0) {
      return list[list.length - 1].weight;
    }
    return this.profile()?.currentWeight ?? 75;
  });

  readonly startWeight = computed(() => {
    const list = this.weightEntries();
    if (list.length > 0) {
      return list[0].weight;
    }
    return this.profile()?.currentWeight ?? 75;
  });

  readonly targetWeight = computed(() => {
    return this.profile()?.targetWeight ?? 70.0;
  });

  readonly changeFromStart = computed(() => {
    return Number((this.currentWeight() - this.startWeight()).toFixed(1));
  });

  readonly weightDiffFormatted = computed(() => {
    const diff = this.changeFromStart();
    if (Math.abs(diff) < 0.05) return '0,0 kg';
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff.toFixed(1).replace('.', ',')} kg`;
  });

  readonly weightDiffSub = computed(() => {
    return this.weightEntries().length > 1 ? 'Veränderung seit Start' : 'Ausgangswert';
  });

  readonly progressPercent = computed(() => {
    const start = this.startWeight();
    const target = this.targetWeight();
    const current = this.currentWeight();

    if (start <= target) {
      return current <= target ? 100 : 0;
    }

    const totalToLose = start - target;
    const lostSoFar = start - current;
    const pct = Math.round((lostSoFar / totalToLose) * 100);
    return Math.max(0, Math.min(100, pct));
  });

  readonly remainingKg = computed(() => {
    const rem = this.currentWeight() - this.targetWeight();
    return Math.max(0, Number(rem.toFixed(1)));
  });

  // Enriched week-by-week entries
  readonly enrichedWeightEntries = computed<DisplayWeightEntry[]>(() => {
    const raw = this.weightEntries();
    if (raw.length === 0) return [];

    const sorted = [...raw].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const startDate = new Date(sorted[0].date).getTime();

    return sorted.map((entry, index) => {
      const entryTime = new Date(entry.date).getTime();
      const diffDays = Math.floor((entryTime - startDate) / (1000 * 60 * 60 * 24));
      const weekIndex = Math.max(1, Math.floor(diffDays / 7) + 1);

      let diffFromPrev: number | undefined;
      let diffFormatted: string | undefined;

      if (index > 0) {
        diffFromPrev = Number((entry.weight - sorted[index - 1].weight).toFixed(1));
        const sign = diffFromPrev > 0 ? '+' : '';
        diffFormatted = `${sign}${diffFromPrev.toFixed(1).replace('.', ',')} kg`;
      }

      return {
        id: entry.id,
        date: entry.date,
        formattedDate: this.formatDisplayDate(entry.date),
        weight: entry.weight,
        note: entry.note,
        weekLabel: `Woche ${weekIndex}`,
        diffFromPrev,
        diffFormatted
      };
    });
  });

  readonly reversedEnrichedEntries = computed<DisplayWeightEntry[]>(() => {
    return [...this.enrichedWeightEntries()].reverse();
  });

  // Daily calorie and macro recommendations
  readonly dailyCalories = computed(() => {
    const p = this.profile();
    if (!p) return 2000;
    const res = this.calorieService.calculate(p);
    return res.dailyTargetKcal || 2000;
  });

  readonly proteinGrams = computed(() => {
    const p = this.profile();
    if (!p) return 150;
    return this.calorieService.calculate(p).macros.proteinGrams || 150;
  });

  readonly carbsGrams = computed(() => {
    const p = this.profile();
    if (!p) return 250;
    return this.calorieService.calculate(p).macros.carbsGrams || 250;
  });

  readonly fatGrams = computed(() => {
    const p = this.profile();
    if (!p) return 70;
    return this.calorieService.calculate(p).macros.fatGrams || 70;
  });

  readonly targetProtein = computed(() => this.proteinGrams());
  readonly targetCarbs = computed(() => this.carbsGrams());
  readonly targetFat = computed(() => this.fatGrams());

  readonly eatenCalories = computed(() => {
    const eaten = this.foodLogService.eatenCalories();
    return eaten > 0 ? eaten : 0;
  });

  readonly targetKcal = computed(() => this.dailyCalories());

  readonly calorieRatio = computed(() => {
    const target = this.targetKcal();
    if (!target) return 0;
    return Math.min(1, Math.max(0, this.eatenCalories() / target));
  });

  readonly calorieDashOffset = computed(() => {
    return 314 * (1 - this.calorieRatio());
  });

  readonly eatenProtein = computed(() => {
    return this.foodLogService.dailySummary().eatenProtein;
  });

  readonly eatenCarbs = computed(() => {
    return this.foodLogService.dailySummary().eatenCarbs;
  });

  readonly eatenFat = computed(() => {
    return this.foodLogService.dailySummary().eatenFat;
  });

  macroRatio(eaten: number, target: number): number {
    if (!target || target <= 0) return 0;
    return Math.min(100, Math.round((eaten / target) * 100));
  }

  // Navigation actions
  goToSettings(): void {
    this.router.navigate(['/settings']);
  }

  goToMealPlanner(): void {
    this.router.navigate(['/meal-planner']);
  }

  goToShoppingList(): void {
    this.router.navigate(['/shopping-list']);
  }

  goToProfileEdit(): void {
    this.router.navigate(['/onboarding']);
  }

  goToHowItWorks(): void {
    this.router.navigate(['/how-it-works']);
  }

  goToCaloriePlan(): void {
    this.router.navigate(['/calculator']);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  readonly chartPoints = computed(() => {
    const entries = this.weightEntries();
    if (entries.length < 2) return [];

    const weights = entries.map(e => e.weight);
    const minW = Math.min(...weights) - 0.5;
    const maxW = Math.max(...weights) + 0.5;
    const rangeW = maxW - minW || 1;

    const width = 320;
    const height = 120;
    const padX = 20;
    const padY = 20;

    const stepX = (width - 2 * padX) / (entries.length - 1);

    return entries.map((e, index) => {
      const x = padX + index * stepX;
      const normalizedY = (e.weight - minW) / rangeW;
      const y = height - padY - normalizedY * (height - 2 * padY);
      return {
        id: e.id,
        x: Math.round(x),
        y: Math.round(y),
        weight: e.weight
      };
    });
  });

  readonly chartLinePoints = computed(() => {
    return this.chartPoints().map(p => `${p.x},${p.y}`).join(' ');
  });

  readonly chartAreaPoints = computed(() => {
    const pts = this.chartPoints();
    if (pts.length === 0) return '';
    const firstX = pts[0].x;
    const lastX = pts[pts.length - 1].x;
    const baselineY = 125;
    const lineCoords = pts.map(p => `${p.x},${p.y}`).join(' ');
    return `${firstX},${baselineY} ${lineCoords} ${lastX},${baselineY}`;
  });

  constructor() {}

  ngOnInit(): void {
    this.storageService.loadWeightHistory();
  }

  currentWeightFormatted(): string {
    return this.currentWeight().toFixed(1).replace('.', ',');
  }

  startWeightFormatted(): string {
    return this.startWeight().toFixed(1).replace('.', ',');
  }

  targetWeightFormatted(): string {
    return this.targetWeight().toFixed(1).replace('.', ',');
  }

  changeFromStartFormatted(): string {
    const ch = this.changeFromStart();
    const sign = ch > 0 ? '+' : '';
    return sign + ch.toFixed(1).replace('.', ',');
  }

  remainingKgFormatted(): string {
    return this.remainingKg().toFixed(1).replace('.', ',');
  }

  formatDisplayDate(isoDate: string): string {
    try {
      const parts = isoDate.split('-');
      if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.`;
      }
      return isoDate;
    } catch {
      return isoDate;
    }
  }

  openAddWeightModal(): void {
    this.editingEntryId = null;
    this.newWeightVal = this.currentWeight();
    this.newWeightDate = new Date().toISOString().split('T')[0];
    this.newWeightNote = '';
    this.showAddModal = true;
  }

  openEditWeightModal(entry: DisplayWeightEntry): void {
    this.editingEntryId = entry.id;
    this.newWeightVal = entry.weight;
    this.newWeightDate = entry.date;
    this.newWeightNote = entry.note || '';
    this.showAddModal = true;
  }

  async saveNewWeight(): Promise<void> {
    if (this.newWeightVal && this.newWeightVal > 30 && this.newWeightVal < 300) {
      const roundedWeight = Number(this.newWeightVal.toFixed(1));
      const trimmedNote = this.newWeightNote.trim() || undefined;

      if (this.editingEntryId) {
        await this.storageService.updateWeightEntry(
          this.editingEntryId,
          roundedWeight,
          this.newWeightDate,
          trimmedNote
        );
      } else {
        await this.storageService.addWeightEntry(
          roundedWeight,
          this.newWeightDate,
          trimmedNote
        );
      }
      this.showAddModal = false;
      this.editingEntryId = null;
    }
  }

  async deleteEntry(id: string): Promise<void> {
    await this.storageService.deleteWeightEntry(id);
  }

  exportBackup(): void {
    const json = this.storageService.exportDataJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `down-kilos-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async executeReset(): Promise<void> {
    await this.storageService.resetAllData();
    this.showResetConfirm = false;
    this.router.navigate(['/welcome']);
  }
}
