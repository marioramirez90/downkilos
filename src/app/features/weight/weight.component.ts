import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from '../../core/services/storage.service';
import { UserProfile } from '../../core/models/user-profile.model';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

export interface EnrichedWeightRow {
  id: string;
  date: string;
  formattedDate: string;
  chartDate: string;
  weight: number;
  weightFormatted: string;
  diffFormatted: string;
  diffSign: 'loss' | 'gain' | 'neutral';
  note?: string;
}

export interface ChartPoint {
  id: string;
  x: number;
  y: number;
  weight: number;
  label: string;
}

export interface YAxisTick {
  value: number;
  y: number;
}

@Component({
  selector: 'app-weight',
  standalone: true,
  imports: [CommonModule, FormsModule, BottomNavComponent],
  templateUrl: './weight.component.html',
  styleUrl: './weight.component.scss'
})
export class WeightComponent implements OnInit {
  private router = inject(Router);
  private storageService = inject(StorageService);

  readonly weightHistory = computed(() => this.storageService.weightHistory());
  readonly profile = computed<UserProfile | null>(() => this.storageService.profile());

  // Modal State
  readonly showModal = signal<boolean>(false);
  readonly editingEntryId = signal<string | null>(null);
  readonly activeMenuEntryId = signal<string | null>(null);
  readonly showAllEntries = signal<boolean>(false);

  inputWeight = signal<number | null>(null);
  inputDate = signal<string>(new Date().toISOString().split('T')[0]);
  inputNote = signal<string>('');
  toastMessage = signal<string | null>(null);
  isSubmitting = signal<boolean>(false);

  // Monat-Namen für saubere deutsche Formatierung (z.B. "12. Mai 2024")
  private monthNames = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.'];

  async ngOnInit(): Promise<void> {
    await this.storageService.loadProfile();
    this.storageService.loadWeightHistory();
  }

  // 1. Aktuelles Gewicht (neuester Eintrag oder Profil-Ausgangsgewicht)
  readonly currentWeight = computed<number>(() => {
    const list = this.weightHistory();
    if (list && list.length > 0) {
      return list[list.length - 1].weight;
    }
    const p = this.profile();
    return p?.currentWeight ?? 98;
  });

  readonly currentWeightFormatted = computed<string>(() => {
    const w = this.currentWeight();
    return w % 1 === 0 ? w.toString() : w.toFixed(1).replace('.', ',');
  });

  // 2. Datum des letzten Eintrags
  readonly latestEntryFormatted = computed<string>(() => {
    const list = this.weightHistory();
    if (list && list.length > 0) {
      return this.formatLongDate(list[list.length - 1].date);
    }
    return this.formatLongDate(new Date().toISOString().split('T')[0]);
  });

  // 3. Wunschgewicht aus dem Profil
  readonly targetWeight = computed<number | null>(() => {
    const p = this.profile();
    return p?.targetWeight ?? null;
  });

  // 4. Ausgangsgewicht (erster historischer Eintrag oder Profil-Ausgangswert)
  readonly startWeight = computed<number>(() => {
    const list = this.weightHistory();
    if (list && list.length > 0) {
      return list[0].weight;
    }
    return this.profile()?.currentWeight ?? 98;
  });

  // 5. Verbleibende Kilos zum Wunschgewicht
  readonly remainingKg = computed<number | null>(() => {
    const target = this.targetWeight();
    if (target === null) return null;
    const diff = this.currentWeight() - target;
    return Math.round(diff * 10) / 10;
  });

  readonly remainingKgFormatted = computed<string>(() => {
    const rem = this.remainingKg();
    if (rem === null) return '0';
    const abs = Math.abs(rem);
    return abs % 1 === 0 ? abs.toString() : abs.toFixed(1).replace('.', ',');
  });

  // 6. Bereits abgenommen (Startgewicht - Aktuelles Gewicht)
  readonly lostSoFar = computed<number>(() => {
    const lost = this.startWeight() - this.currentWeight();
    return Math.round(lost * 10) / 10;
  });

  readonly lostSoFarFormatted = computed<string>(() => {
    const lost = this.lostSoFar();
    return (lost > 0 ? lost.toFixed(1) : '0,0').replace('.', ',');
  });

  // 7. Ziel-Status (Abnehmen, Erreicht, Halten, Fehlt)
  readonly goalStatus = computed<'lose' | 'reached' | 'maintain' | 'missing'>(() => {
    const p = this.profile();
    if (p && p.goal === 'maintain_weight') return 'maintain';
    const target = this.targetWeight();
    if (target === null || target === undefined) return 'missing';

    const rem = this.remainingKg();
    if (rem !== null && rem <= 0) {
      return 'reached';
    }
    return 'lose';
  });

  // 8. Aufbereitete Einträge mit Differenz zum jeweiligen Vorgänger
  readonly enrichedEntries = computed<EnrichedWeightRow[]>(() => {
    const raw = this.weightHistory();
    if (!raw || raw.length === 0) {
      const p = this.profile();
      if (p && p.currentWeight) {
        const today = new Date().toISOString().split('T')[0];
        return [{
          id: 'init_start',
          date: today,
          formattedDate: this.formatLongDate(today),
          chartDate: this.formatChartDate(today),
          weight: p.currentWeight,
          weightFormatted: p.currentWeight % 1 === 0 ? `${p.currentWeight} kg` : `${p.currentWeight.toFixed(1).replace('.', ',')} kg`,
          diffFormatted: '—',
          diffSign: 'neutral',
          note: 'Startgewicht'
        }];
      }
      return [];
    }

    const sorted = [...raw].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return sorted.map((entry, idx) => {
      let diffFormatted = '—';
      let diffSign: 'loss' | 'gain' | 'neutral' = 'neutral';

      if (idx > 0) {
        const prevWeight = sorted[idx - 1].weight;
        const diff = Math.round((entry.weight - prevWeight) * 10) / 10;
        if (diff < 0) {
          diffSign = 'loss';
          diffFormatted = `↓ -${Math.abs(diff).toFixed(1).replace('.', ',')} kg`;
        } else if (diff > 0) {
          diffSign = 'gain';
          diffFormatted = `↑ +${diff.toFixed(1).replace('.', ',')} kg`;
        } else {
          diffFormatted = '0,0 kg';
        }
      }

      return {
        id: entry.id,
        date: entry.date,
        formattedDate: this.formatLongDate(entry.date),
        chartDate: this.formatChartDate(entry.date),
        weight: entry.weight,
        weightFormatted: entry.weight % 1 === 0 ? `${entry.weight} kg` : `${entry.weight.toFixed(1).replace('.', ',')} kg`,
        diffFormatted,
        diffSign,
        note: entry.note
      };
    });
  });

  readonly displayEntries = computed<EnrichedWeightRow[]>(() => {
    const list = [...this.enrichedEntries()].reverse();
    if (this.showAllEntries()) {
      return list;
    }
    return list.slice(0, 5);
  });

  // 9. SVG Chart Geometrie & Skalierung
  readonly chartData = computed<{
    points: ChartPoint[];
    polyLine: string;
    areaPoints: string;
    yTicks: YAxisTick[];
  }>(() => {
    const entries = this.enrichedEntries();
    if (entries.length === 0) {
      return { points: [], polyLine: '', areaPoints: '', yTicks: [] };
    }

    const width = 340;
    const height = 135;
    const padLeft = 40;
    const padRight = 20;
    const padTop = 16;
    const padBottom = 26;

    const weights = entries.map(e => e.weight);
    const minW = Math.floor(Math.min(...weights) - 1);
    const maxW = Math.ceil(Math.max(...weights) + 1);
    const rangeW = maxW - minW || 1;

    // Y-Axis Ticks (4 Ticks)
    const tickStep = rangeW <= 4 ? 1 : Math.ceil(rangeW / 4);
    const yTicks: YAxisTick[] = [];
    for (let w = minW; w <= maxW; w += tickStep) {
      const normalizedY = (w - minW) / rangeW;
      const yPos = (height - padBottom) - normalizedY * (height - padBottom - padTop);
      yTicks.push({ value: w, y: Math.round(yPos) });
    }

    // Points
    const stepX = entries.length > 1
      ? (width - padLeft - padRight) / (entries.length - 1)
      : 0;

    const points: ChartPoint[] = entries.map((e, idx) => {
      const x = entries.length === 1
        ? (padLeft + (width - padLeft - padRight) / 2)
        : padLeft + idx * stepX;
      const normalizedY = (e.weight - minW) / rangeW;
      const y = (height - padBottom) - normalizedY * (height - padBottom - padTop);
      return {
        id: e.id,
        x: Math.round(x),
        y: Math.round(y),
        weight: e.weight,
        label: e.chartDate
      };
    });

    const polyLine = points.map(p => `${p.x},${p.y}`).join(' ');

    const baselineY = height - padBottom;
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const areaPoints = `${firstX},${baselineY} ${polyLine} ${lastX},${baselineY}`;

    return { points, polyLine, areaPoints, yTicks };
  });

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  toggleShowAll(): void {
    this.showAllEntries.set(!this.showAllEntries());
  }

  openNewWeightModal(): void {
    this.editingEntryId.set(null);
    this.inputWeight.set(this.currentWeight());
    this.inputDate.set(new Date().toISOString().split('T')[0]);
    this.inputNote.set('');
    this.activeMenuEntryId.set(null);
    this.showModal.set(true);
  }

  openEditEntryModal(entry: EnrichedWeightRow): void {
    this.editingEntryId.set(entry.id);
    this.inputWeight.set(entry.weight);
    this.inputDate.set(entry.date);
    this.inputNote.set(entry.note || '');
    this.activeMenuEntryId.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingEntryId.set(null);
  }

  toggleEntryMenu(entryId: string, event: MouseEvent): void {
    event.stopPropagation();
    if (this.activeMenuEntryId() === entryId) {
      this.activeMenuEntryId.set(null);
    } else {
      this.activeMenuEntryId.set(entryId);
    }
  }

  closeAllMenus(): void {
    this.activeMenuEntryId.set(null);
  }

  async saveWeight(): Promise<void> {
    const val = this.inputWeight();
    if (!val || val < 30 || val > 300) {
      this.showToast('Bitte ein realistisches Gewicht zwischen 30 und 300 kg eingeben.');
      return;
    }

    this.isSubmitting.set(true);
    try {
      const rounded = Number(val.toFixed(1));
      const date = this.inputDate();
      const note = this.inputNote().trim() || undefined;

      const editId = this.editingEntryId();
      if (editId && !editId.startsWith('init_')) {
        await this.storageService.updateWeightEntry(editId, rounded, date, note);
        this.showToast(`Gewichtseintrag aktualisiert: ${rounded} kg`);
      } else {
        await this.storageService.addWeightEntry(rounded, date, note);
        this.showToast(`Neues Gewicht gespeichert: ${rounded} kg`);
      }

      this.closeModal();
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async deleteEntry(id: string): Promise<void> {
    this.activeMenuEntryId.set(null);
    await this.storageService.deleteWeightEntry(id);
    this.showToast('Eintrag gelöscht.');
  }

  goToSettings(): void {
    this.router.navigate(['/settings']);
  }

  private formatLongDate(isoDate: string): string {
    try {
      const [y, m, d] = isoDate.split('-');
      const monthIdx = parseInt(m, 10) - 1;
      const monthStr = this.monthNames[monthIdx] || m;
      return `${parseInt(d, 10)}. ${monthStr} ${y}`;
    } catch {
      return isoDate;
    }
  }

  private formatChartDate(isoDate: string): string {
    try {
      const [, m, d] = isoDate.split('-');
      const monthIdx = parseInt(m, 10) - 1;
      const monthStr = this.monthNames[monthIdx] || m;
      return `${parseInt(d, 10)}. ${monthStr}`;
    } catch {
      return isoDate;
    }
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 2800);
  }
}
