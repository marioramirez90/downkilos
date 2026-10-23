import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StorageService } from '../../core/services/storage.service';
import { CalorieCalculatorService } from '../../core/services/calorie-calculator.service';
import { WeightEntry } from '../../core/models/weight-log.model';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { HamburgerButtonComponent } from '../../shared/components/hamburger-button/hamburger-button.component';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BottomNavComponent, HamburgerButtonComponent],
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.scss'
})
export class ProgressComponent implements OnInit {
  showAddModal = false;
  showResetConfirm = false;

  newWeightVal: number | null = null;
  newWeightDate: string = new Date().toISOString().split('T')[0];
  newWeightNote = '';

  readonly weightEntries = computed(() => this.storageService.weightHistory());
  readonly reversedWeightEntries = computed(() => [...this.storageService.weightHistory()].reverse());

  readonly profile = computed(() => this.storageService.profile());

  readonly currentWeight = computed(() => {
    const list = this.weightEntries();
    if (list.length > 0) {
      return list[list.length - 1].weight;
    }
    return this.profile()?.currentWeight ?? 68.5;
  });

  readonly startWeight = computed(() => {
    const list = this.weightEntries();
    if (list.length > 0) {
      return list[0].weight;
    }
    return (this.profile()?.currentWeight ?? 68.5) + 3.5;
  });

  readonly targetWeight = computed(() => {
    return this.profile()?.targetWeight ?? 62.0;
  });

  readonly changeFromStart = computed(() => {
    return Number((this.currentWeight() - this.startWeight()).toFixed(1));
  });

  readonly progressPercent = computed(() => {
    const totalToLose = this.startWeight() - this.targetWeight();
    if (totalToLose <= 0) return 100;
    const lostSoFar = this.startWeight() - this.currentWeight();
    const pct = Math.round((lostSoFar / totalToLose) * 100);
    return Math.max(0, Math.min(100, pct));
  });

  readonly remainingKg = computed(() => {
    const rem = this.currentWeight() - this.targetWeight();
    return Math.max(0, Number(rem.toFixed(1)));
  });

  // Daily calorie and macro recommendations
  readonly dailyCalories = computed(() => {
    const p = this.profile();
    if (!p) return 1800;
    const res = this.calorieService.calculate(p);
    return res.dailyTargetKcal;
  });

  readonly proteinGrams = computed(() => {
    const p = this.profile();
    if (!p) return 110;
    return this.calorieService.calculate(p).macros.proteinGrams;
  });

  readonly carbsGrams = computed(() => {
    const p = this.profile();
    if (!p) return 190;
    return this.calorieService.calculate(p).macros.carbsGrams;
  });

  readonly fatGrams = computed(() => {
    const p = this.profile();
    if (!p) return 60;
    return this.calorieService.calculate(p).macros.fatGrams;
  });

  // Chart computations
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

  constructor(
    private storageService: StorageService,
    private calorieService: CalorieCalculatorService,
    private router: Router
  ) {}

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
    this.newWeightVal = this.currentWeight();
    this.newWeightDate = new Date().toISOString().split('T')[0];
    this.newWeightNote = '';
    this.showAddModal = true;
  }

  async saveNewWeight(): Promise<void> {
    if (this.newWeightVal && this.newWeightVal > 30 && this.newWeightVal < 300) {
      await this.storageService.addWeightEntry(
        Number(this.newWeightVal.toFixed(1)),
        this.newWeightDate,
        this.newWeightNote.trim() || undefined
      );
      this.showAddModal = false;
    }
  }

  deleteEntry(id: string): void {
    this.storageService.deleteWeightEntry(id);
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
