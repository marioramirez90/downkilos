import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StorageService } from '../../core/services/storage.service';
import { CalorieCalculatorService } from '../../core/services/calorie-calculator.service';
import { WeightEntry } from '../../core/models/weight-log.model';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BottomNavComponent],
  template: `
    <div class="flex flex-col h-full bg-[#F4F6F4] overflow-hidden">
      <!-- Fixed Mobile Header -->
      <header class="flex-shrink-0 bg-[#FFFFFF] border-b border-[#E3EBE4] px-4 py-3 z-10">
        <div class="max-w-md mx-auto flex items-center justify-between">
          <div>
            <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#E5F5E8] text-[#278F39] text-[10px] font-bold tracking-wide">
              <span>📉</span>
              <span>GEWICHTSVERLAUF</span>
            </div>
            <h1 class="text-xl font-black text-[#103A2A] tracking-tight mt-0.5">
              Mein Fortschritt
            </h1>
          </div>
          <button
            (click)="openAddWeightModal()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#278F39] hover:bg-[#20752E] text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95"
            aria-label="Gewicht wiegen"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Wiegen</span>
          </button>
        </div>
      </header>

      <main class="flex-1 min-h-0 overflow-y-auto max-w-md w-full mx-auto px-4 pt-4 pb-6 space-y-4">
        <!-- 1. Hero Weight Progress Card -->
        <section class="bg-[#FFFFFF] rounded-3xl p-5 border border-[#E3EBE4] shadow-sm relative overflow-hidden">
          <div class="absolute -top-12 -right-12 w-32 h-32 bg-[#E5F5E8] rounded-full blur-2xl pointer-events-none"></div>

          <div class="flex items-start justify-between">
            <div>
              <span class="text-xs font-semibold text-[#627264] uppercase tracking-wider">Aktuelles Gewicht</span>
              <div class="flex items-baseline gap-1.5 mt-1">
                <span class="text-4xl font-black text-[#103A2A] tracking-tight">
                  {{ currentWeightFormatted() }}
                </span>
                <span class="text-base font-bold text-[#627264]">kg</span>
              </div>
            </div>

            <!-- Difference pill -->
            <div
              [ngClass]="changeFromStart() <= 0 ? 'bg-[#E5F5E8] text-[#278F39]' : 'bg-amber-50 text-amber-700'"
              class="px-3 py-1.5 rounded-2xl flex items-center gap-1 text-xs font-black shadow-sm"
            >
              <span>{{ changeFromStart() <= 0 ? '↓' : '↑' }}</span>
              <span>{{ changeFromStartFormatted() }} kg</span>
            </div>
          </div>

          <!-- Progress Bar & Target Calculation -->
          <div class="mt-5 pt-4 border-t border-[#F0F4F1] space-y-2">
            <div class="flex items-center justify-between text-xs font-bold">
              <span class="text-[#627264]">Start: {{ startWeightFormatted() }} kg</span>
              <span class="text-[#278F39]">{{ progressPercent() }}% geschafft</span>
              <span class="text-[#103A2A]">Ziel: {{ targetWeightFormatted() }} kg</span>
            </div>

            <!-- Progress Track -->
            <div class="w-full bg-[#EBF0EC] rounded-full h-3 overflow-hidden p-0.5">
              <div
                class="bg-gradient-to-r from-[#278F39] to-[#34B34C] h-full rounded-full transition-all duration-700"
                [style.width.%]="progressPercent()"
              ></div>
            </div>

            <p class="text-[11px] text-[#627264] text-center pt-1">
              Noch <strong class="text-[#103A2A]">{{ remainingKgFormatted() }} kg</strong> bis zu deinem Wohlfühlgewicht!
            </p>
          </div>
        </section>

        <!-- 2. Visual SVG Chart (Gewichtsverlauf) -->
        <section class="bg-[#FFFFFF] rounded-3xl p-5 border border-[#E3EBE4] shadow-sm space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-sm font-black text-[#103A2A] tracking-tight">Gewichtsverlauf</h2>
              <p class="text-[11px] text-[#627264]">Entwicklung über die letzten Wiegungen</p>
            </div>
            <span class="text-xs font-bold text-[#278F39] bg-[#E5F5E8] px-2.5 py-0.5 rounded-full">
              {{ weightEntries().length }} Messungen
            </span>
          </div>

          <!-- SVG Chart Container -->
          <div class="w-full h-44 pt-2">
            @if (weightEntries().length >= 2) {
              <svg class="w-full h-full overflow-visible" viewBox="0 0 320 130" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#278F39" stop-opacity="0.25" />
                    <stop offset="100%" stop-color="#278F39" stop-opacity="0.0" />
                  </linearGradient>
                </defs>

                <!-- Horizontal guide lines -->
                <line x1="0" y1="20" x2="320" y2="20" stroke="#E3EBE4" stroke-dasharray="3,3" stroke-width="1" />
                <line x1="0" y1="65" x2="320" y2="65" stroke="#E3EBE4" stroke-dasharray="3,3" stroke-width="1" />
                <line x1="0" y1="110" x2="320" y2="110" stroke="#E3EBE4" stroke-dasharray="3,3" stroke-width="1" />

                <!-- Filled Area -->
                <polygon [attr.points]="chartAreaPoints()" fill="url(#chartGradient)" />

                <!-- Trend Line -->
                <polyline
                  [attr.points]="chartLinePoints()"
                  fill="none"
                  stroke="#278F39"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />

                <!-- Data Points -->
                @for (pt of chartPoints(); track pt.id) {
                  <circle
                    [attr.cx]="pt.x"
                    [attr.cy]="pt.y"
                    r="4.5"
                    fill="#FFFFFF"
                    stroke="#278F39"
                    stroke-width="2.5"
                  />
                  <!-- Weight label on point -->
                  <text
                    [attr.x]="pt.x"
                    [attr.y]="pt.y - 8"
                    font-size="9"
                    font-weight="bold"
                    fill="#103A2A"
                    text-anchor="middle"
                  >
                    {{ pt.weight.toFixed(1) }}
                  </text>
                }
              </svg>
            } @else {
              <div class="h-full flex flex-col items-center justify-center text-center p-4 bg-[#F8FAF8] rounded-2xl border border-dashed border-[#CCD8CF]">
                <span class="text-2xl mb-1">📊</span>
                <p class="text-xs font-bold text-[#103A2A]">Noch nicht genügend Datenpunkte</p>
                <p class="text-[11px] text-[#627264] mt-0.5">Trage mindestens 2 Wiegungen ein, um den Verlauf zu sehen.</p>
              </div>
            }
          </div>

          <!-- Date labels below chart -->
          @if (weightEntries().length >= 2) {
            <div class="flex justify-between items-center text-[10px] text-[#627264] font-medium px-1">
              <span>{{ formatDisplayDate(weightEntries()[0].date) }}</span>
              <span>{{ formatDisplayDate(weightEntries()[weightEntries().length - 1].date) }}</span>
            </div>
          }
        </section>

        <!-- 3. Daily Calorie & Macronutrient Targets -->
        <section class="bg-[#FFFFFF] rounded-3xl p-5 border border-[#E3EBE4] shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-sm font-black text-[#103A2A] tracking-tight">Tages-Ernährungsziel</h2>
              <p class="text-[11px] text-[#627264]">Berechnet nach Mifflin-St. Jeor & PAL</p>
            </div>
            <a
              routerLink="/calculator"
              class="text-xs font-bold text-[#278F39] hover:underline flex items-center gap-0.5"
            >
              <span>Neu berechnen</span>
              <span>→</span>
            </a>
          </div>

          <!-- Calorie Target Badge -->
          <div class="p-4 bg-[#E5F5E8] rounded-2xl flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-[#278F39] text-white flex items-center justify-center font-bold text-lg">
                🔥
              </div>
              <div>
                <span class="text-xs font-medium text-[#278F39] uppercase tracking-wider">Tägliches Kalorienziel</span>
                <div class="text-xl font-black text-[#103A2A]">
                  {{ dailyCalories() }} <span class="text-sm font-semibold text-[#627264]">kcal / Tag</span>
                </div>
              </div>
            </div>
            <span class="text-[11px] font-bold text-[#278F39] bg-white px-2 py-1 rounded-xl shadow-xs">
              -500 kcal Defizit
            </span>
          </div>

          <!-- Macronutrient Split Cards -->
          <div class="grid grid-cols-3 gap-2.5">
            <!-- Protein -->
            <div class="p-3 bg-[#F8FAF8] rounded-2xl border border-[#E3EBE4] text-center">
              <span class="text-[10px] font-bold text-[#627264] uppercase block">Eiweiß</span>
              <span class="text-base font-black text-[#103A2A] block mt-0.5">{{ proteinGrams() }}g</span>
              <span class="text-[9px] font-semibold text-[#278F39]">25% Energie</span>
            </div>

            <!-- Carbs -->
            <div class="p-3 bg-[#F8FAF8] rounded-2xl border border-[#E3EBE4] text-center">
              <span class="text-[10px] font-bold text-[#627264] uppercase block">Kohlenhydrate</span>
              <span class="text-base font-black text-[#103A2A] block mt-0.5">{{ carbsGrams() }}g</span>
              <span class="text-[9px] font-semibold text-[#627264]">45% Energie</span>
            </div>

            <!-- Fat -->
            <div class="p-3 bg-[#F8FAF8] rounded-2xl border border-[#E3EBE4] text-center">
              <span class="text-[10px] font-bold text-[#627264] uppercase block">Fett</span>
              <span class="text-base font-black text-[#103A2A] block mt-0.5">{{ fatGrams() }}g</span>
              <span class="text-[9px] font-semibold text-[#627264]">30% Energie</span>
            </div>
          </div>
        </section>

        <!-- 4. Weight History Table -->
        <section class="bg-[#FFFFFF] rounded-3xl p-5 border border-[#E3EBE4] shadow-sm space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-black text-[#103A2A] tracking-tight">Messungen-Historie</h2>
            <button
              (click)="openAddWeightModal()"
              class="text-xs font-bold text-[#278F39] hover:underline"
            >
              + Neu hinzufügen
            </button>
          </div>

          <div class="divide-y divide-[#F0F4F1] -mx-2">
            @for (entry of reversedWeightEntries(); track entry.id) {
              <div class="py-2.5 px-2 flex items-center justify-between hover:bg-[#F8FAF8] rounded-xl transition-colors">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-[#103A2A]">{{ formatDisplayDate(entry.date) }}</span>
                    @if (entry.note) {
                      <span class="text-[10px] font-medium text-[#627264] bg-[#F0F4F1] px-1.5 py-0.5 rounded-md">
                        {{ entry.note }}
                      </span>
                    }
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <span class="text-sm font-black text-[#103A2A]">
                    {{ entry.weight.toFixed(1) }} kg
                  </span>
                  <button
                    (click)="deleteEntry(entry.id)"
                    class="p-1 text-[#9BA89F] hover:text-red-500 rounded-lg transition-colors"
                    title="Eintrag entfernen"
                    aria-label="Eintrag entfernen"
                  >
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            }
          </div>
        </section>

        <!-- 5. Profile & Data Management Actions -->
        <section class="bg-[#FFFFFF] rounded-3xl p-5 border border-[#E3EBE4] shadow-sm space-y-3">
          <h2 class="text-sm font-black text-[#103A2A] tracking-tight">Einstellungen & Lokale Daten</h2>

          <div class="space-y-2 text-xs">
            <!-- Edit Profile -->
            <a
              routerLink="/onboarding"
              class="flex items-center justify-between p-3 rounded-2xl bg-[#F8FAF8] hover:bg-[#E5F5E8] border border-[#E3EBE4] font-bold text-[#103A2A] transition-colors"
            >
              <div class="flex items-center gap-2.5">
                <span>👤</span>
                <span>Gastprofil anpassen (Größe, Alter, Ziel)</span>
              </div>
              <span class="text-[#278F39]">→</span>
            </a>

            <!-- Change Retailer -->
            <a
              routerLink="/retailers"
              class="flex items-center justify-between p-3 rounded-2xl bg-[#F8FAF8] hover:bg-[#E5F5E8] border border-[#E3EBE4] font-bold text-[#103A2A] transition-colors"
            >
              <div class="flex items-center gap-2.5">
                <span>🛒</span>
                <span>Netto Filiale & Budget anpassen</span>
              </div>
              <span class="text-[#278F39]">→</span>
            </a>

            <!-- Export JSON -->
            <button
              (click)="exportBackup()"
              class="w-full flex items-center justify-between p-3 rounded-2xl bg-[#F8FAF8] hover:bg-[#F0F4F1] border border-[#E3EBE4] font-bold text-[#103A2A] transition-colors text-left"
            >
              <div class="flex items-center gap-2.5">
                <span>💾</span>
                <span>Meine Daten als JSON-Backup exportieren</span>
              </div>
              <span class="text-[#627264]">Download</span>
            </button>

            <!-- Reset App -->
            <button
              (click)="showResetConfirm = true"
              class="w-full flex items-center justify-between p-3 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-100 font-bold text-red-600 transition-colors text-left"
            >
              <div class="flex items-center gap-2.5">
                <span>🗑️</span>
                <span>Alle lokalen Daten zurücksetzen</span>
              </div>
              <span>Reset</span>
            </button>
          </div>
        </section>
      </main>

      <!-- Sticky Bottom Navigation Bar -->
      <app-bottom-nav></app-bottom-nav>

      <!-- Modal: Gewicht eintragen -->
      @if (showAddModal) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div class="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#E3EBE4] space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-extrabold text-[#103A2A]">Neues Gewicht erfassen</h3>
              <button
                (click)="showAddModal = false"
                class="p-1 rounded-full text-gray-400 hover:text-gray-700"
                aria-label="Schließen"
              >
                ✕
              </button>
            </div>

            <div class="space-y-3">
              <div>
                <label class="block text-xs font-bold text-[#103A2A] mb-1">Gewicht (in kg)</label>
                <div class="relative">
                  <input
                    type="number"
                    step="0.1"
                    [(ngModel)]="newWeightVal"
                    class="w-full px-4 py-2.5 rounded-xl border border-[#CCD8CF] focus:outline-none focus:ring-2 focus:ring-[#278F39] text-base font-bold text-[#103A2A]"
                    placeholder="z.B. 68.2"
                  />
                  <span class="absolute right-3.5 top-3 text-xs font-bold text-[#627264]">kg</span>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-[#103A2A] mb-1">Datum</label>
                <input
                  type="date"
                  [(ngModel)]="newWeightDate"
                  class="w-full px-4 py-2 rounded-xl border border-[#CCD8CF] focus:outline-none focus:ring-2 focus:ring-[#278F39] text-xs font-semibold text-[#103A2A]"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-[#103A2A] mb-1">Optionale Notiz</label>
                <input
                  type="text"
                  [(ngModel)]="newWeightNote"
                  placeholder="z.B. Morgens nüchtern"
                  class="w-full px-4 py-2 rounded-xl border border-[#CCD8CF] focus:outline-none focus:ring-2 focus:ring-[#278F39] text-xs font-medium text-[#103A2A]"
                />
              </div>
            </div>

            <div class="flex items-center gap-2 pt-2">
              <button
                (click)="showAddModal = false"
                class="flex-1 py-2.5 rounded-xl border border-[#CCD8CF] text-xs font-bold text-[#627264] hover:bg-[#F8FAF8]"
              >
                Abbrechen
              </button>
              <button
                (click)="saveNewWeight()"
                [disabled]="!newWeightVal || newWeightVal <= 30 || newWeightVal >= 300"
                class="flex-1 py-2.5 rounded-xl bg-[#278F39] hover:bg-[#20752E] disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal: Reset Confirmation -->
      @if (showResetConfirm) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div class="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#E3EBE4] space-y-4 text-center">
            <span class="text-4xl">⚠️</span>
            <h3 class="text-base font-extrabold text-[#103A2A]">Wirklich alle Daten löschen?</h3>
            <p class="text-xs text-[#627264] leading-relaxed">
              Dein Profil, alle gespeicherten Rezepte, Einkaufslisten und dein Gewichtsverlauf werden unwiderruflich von diesem Gerät gelöscht.
            </p>

            <div class="flex items-center gap-2 pt-2">
              <button
                (click)="showResetConfirm = false"
                class="flex-1 py-2.5 rounded-xl border border-[#CCD8CF] text-xs font-bold text-[#627264] hover:bg-[#F8FAF8]"
              >
                Abbrechen
              </button>
              <button
                (click)="executeReset()"
                class="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                Ja, alles löschen
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
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
