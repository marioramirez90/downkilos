import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StorageService } from '../../core/services/storage.service';
import {
  ACTIVITY_OPTIONS,
  ActivityLevel,
  GOAL_OPTIONS,
  UserProfile
} from '../../core/models/user-profile.model';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="flex flex-col h-full bg-[#FFFFFF] overflow-hidden">
      <!-- Fixed Top Navigation Header -->
      <header class="flex-shrink-0 px-5 pt-4 pb-2.5 border-b border-[#F0F4F1] bg-white z-10">
        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="goBack()"
            class="w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-[#103A2A] hover:bg-[#F1F5F2] active:scale-95 transition-transform"
            aria-label="Zurück"
          >
            <svg class="w-6 h-6 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 class="text-xl sm:text-2xl font-extrabold text-[#103A2A] tracking-tight">
            Profil erstellen
          </h1>
        </div>
        <p class="text-xs text-[#55695C] leading-relaxed mt-1">
          Erzähle uns ein wenig über dich, damit wir deinen Plan individuell anpassen können.
        </p>
      </header>

      <!-- Scrollable Form Inputs Area (Only this area scrolls) -->
      <div class="flex-1 min-h-0 overflow-y-auto px-5 py-4">
        <form id="onboardingForm" [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <!-- Field: Name -->
          <div class="space-y-1.5">
            <label for="nameInput" class="block text-xs font-semibold text-[#17241D]">
              Name
            </label>
            <input
              id="nameInput"
              type="text"
              formControlName="name"
              placeholder="Lisa Müller"
              class="w-full px-4 py-3 rounded-2xl bg-[#FFFFFF] border border-[#DCE4DE] text-sm text-[#17241D] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#278F39] focus:ring-2 focus:ring-[#278F39]/15 transition-all"
              [class.border-red-400]="isFieldInvalid('name')"
            />
            @if (isFieldInvalid('name')) {
              <p class="text-[11px] text-red-500 font-medium pl-1">Bitte gib deinen Namen ein.</p>
            }
          </div>

          <!-- Field: Geburtsdatum -->
          <div class="space-y-1.5">
            <label for="birthDateInput" class="block text-xs font-semibold text-[#17241D]">
              Geburtsdatum
            </label>
            <div class="relative">
              <input
                id="birthDateInput"
                type="date"
                formControlName="birthDate"
                class="w-full px-4 py-3 rounded-2xl bg-[#FFFFFF] border border-[#DCE4DE] text-sm text-[#17241D] focus:outline-none focus:border-[#278F39] focus:ring-2 focus:ring-[#278F39]/15 transition-all appearance-none"
                [class.border-red-400]="isFieldInvalid('birthDate')"
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#627264]">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </span>
            </div>
            @if (isFieldInvalid('birthDate')) {
              <p class="text-[11px] text-red-500 font-medium pl-1">Bitte gib ein gültiges Geburtsdatum ein.</p>
            }
          </div>

          <!-- Biological Gender -->
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-[#17241D]">
              Biologisches Geschlecht (für den Grundumsatz)
            </label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                (click)="setGender('female')"
                class="py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer"
                [ngClass]="form.value.gender === 'female' ? 'bg-[#E5F5E8] border-[#278F39] text-[#103A2A]' : 'bg-[#FFFFFF] border-[#DCE4DE] text-[#627264] hover:bg-[#F6F8F6]'"
              >
                Weiblich
              </button>
              <button
                type="button"
                (click)="setGender('male')"
                class="py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer"
                [ngClass]="form.value.gender === 'male' ? 'bg-[#E5F5E8] border-[#278F39] text-[#103A2A]' : 'bg-[#FFFFFF] border-[#DCE4DE] text-[#627264] hover:bg-[#F6F8F6]'"
              >
                Männlich
              </button>
            </div>
          </div>

          <!-- Two-column row: Körpergröße & Aktuelles Gewicht -->
          <div class="grid grid-cols-2 gap-3">
            <!-- Körpergröße -->
            <div class="space-y-1.5">
              <label for="heightInput" class="block text-xs font-semibold text-[#17241D]">
                Größe
              </label>
              <div class="relative">
                <input
                  id="heightInput"
                  type="number"
                  step="1"
                  min="100"
                  max="250"
                  formControlName="height"
                  placeholder="168"
                  class="w-full pl-4 pr-10 py-3 rounded-2xl bg-[#FFFFFF] border border-[#DCE4DE] text-sm text-[#17241D] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#278F39] focus:ring-2 focus:ring-[#278F39]/15 transition-all"
                  [class.border-red-400]="isFieldInvalid('height')"
                />
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-[#627264] pointer-events-none">
                  cm
                </span>
              </div>
              @if (isFieldInvalid('height')) {
                <p class="text-[10px] text-red-500 font-medium pl-1">100–250 cm</p>
              }
            </div>

            <!-- Aktuelles Gewicht -->
            <div class="space-y-1.5">
              <label for="currentWeightInput" class="block text-xs font-semibold text-[#17241D]">
                Gewicht
              </label>
              <div class="relative">
                <input
                  id="currentWeightInput"
                  type="number"
                  step="0.5"
                  min="35"
                  max="250"
                  formControlName="currentWeight"
                  placeholder="72"
                  class="w-full pl-4 pr-10 py-3 rounded-2xl bg-[#FFFFFF] border border-[#DCE4DE] text-sm text-[#17241D] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#278F39] focus:ring-2 focus:ring-[#278F39]/15 transition-all"
                  [class.border-red-400]="isFieldInvalid('currentWeight')"
                />
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-[#627264] pointer-events-none">
                  kg
                </span>
              </div>
              @if (isFieldInvalid('currentWeight')) {
                <p class="text-[10px] text-red-500 font-medium pl-1">35–250 kg</p>
              }
            </div>
          </div>

          <!-- Activity Level Cards -->
          <div class="space-y-1.5 pt-1">
            <label class="block text-xs font-semibold text-[#17241D]">
              Aktivitätslevel
            </label>
            <div class="space-y-2">
              @for (opt of activityOptions; track opt.value) {
                <div
                  (click)="selectActivity(opt.value)"
                  class="flex items-center gap-3 px-3.5 py-3 rounded-2xl border cursor-pointer transition-all select-none"
                  [ngClass]="form.value.activityLevel === opt.value
                    ? 'bg-[#E5F5E8] border-[#278F39] shadow-soft-sm'
                    : 'bg-[#FFFFFF] border-[#E3EBE4] hover:bg-[#F9FAF9]'"
                >
                  <!-- Radio Check Circle -->
                  <div
                    class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                    [ngClass]="form.value.activityLevel === opt.value
                      ? 'bg-[#278F39] text-white'
                      : 'border-2 border-[#CBD5E1] bg-white'"
                  >
                    @if (form.value.activityLevel === opt.value) {
                      <svg class="w-3.5 h-3.5 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    }
                  </div>

                  <!-- Text labels -->
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-xs sm:text-sm font-semibold text-[#103A2A]">
                      {{ opt.title }}
                    </span>
                    <span class="text-[11px] sm:text-xs text-[#627264]">
                      ({{ opt.subtitle }})
                    </span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Field: Mein Ziel Dropdown -->
          <div class="space-y-1.5 pt-1">
            <label for="goalSelect" class="block text-xs font-semibold text-[#17241D]">
              Mein Ziel
            </label>
            <div class="relative">
              <select
                id="goalSelect"
                formControlName="goal"
                class="w-full px-4 py-3 rounded-2xl bg-[#FFFFFF] border border-[#DCE4DE] text-sm font-medium text-[#17241D] focus:outline-none focus:border-[#278F39] focus:ring-2 focus:ring-[#278F39]/15 transition-all appearance-none cursor-pointer"
              >
                @for (g of goalOptions; track g.value) {
                  <option [value]="g.value">{{ g.label }}</option>
                }
              </select>
              <span class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#627264]">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </span>
            </div>
          </div>

          <!-- Optional Zielgewicht wenn Ziel Gewicht reduzieren ist -->
          @if (form.value.goal === 'lose_weight') {
            <div class="space-y-1.5 pt-1 animate-fade-in">
              <label for="targetWeightInput" class="block text-xs font-semibold text-[#17241D]">
                Wunsch-Zielgewicht (optional)
              </label>
              <div class="relative">
                <input
                  id="targetWeightInput"
                  type="number"
                  step="0.5"
                  min="35"
                  max="200"
                  formControlName="targetWeight"
                  placeholder="70"
                  class="w-full pl-4 pr-10 py-3 rounded-2xl bg-[#FFFFFF] border border-[#DCE4DE] text-sm text-[#17241D] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#278F39] focus:ring-2 focus:ring-[#278F39]/15 transition-all"
                />
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-[#627264] pointer-events-none">
                  kg
                </span>
              </div>
            </div>
          }
        </form>
      </div>

      <!-- Static Bottom Action Footer: "Weiter" button is 100% fixed at the bottom -->
      <footer class="flex-shrink-0 bg-white/95 backdrop-blur-md border-t border-[#E3EBE4] px-5 py-3 space-y-2.5 z-20 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        <!-- Progress bar (Step 1 of onboarding) -->
        <div class="flex items-center justify-center gap-1.5">
          <div class="w-16 h-1.5 rounded-full bg-[#278F39]"></div>
          <div class="w-16 h-1.5 rounded-full bg-[#E3EBE4]"></div>
          <div class="w-16 h-1.5 rounded-full bg-[#E3EBE4]"></div>
        </div>

        <!-- Submit Button (Linked to form via form="onboardingForm") -->
        <button
          type="submit"
          form="onboardingForm"
          [disabled]="isSubmitting"
          class="w-full py-3.5 px-6 rounded-2xl bg-[#278F39] hover:bg-[#217A30] active:scale-[0.98] text-white font-bold text-base shadow-button flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <span>Weiter</span>
          <span class="text-lg">→</span>
        </button>
      </footer>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out forwards;
    }
  `]
})
export class OnboardingComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private storageService = inject(StorageService);

  readonly activityOptions = ACTIVITY_OPTIONS;
  readonly goalOptions = GOAL_OPTIONS;
  isSubmitting = false;

  form: FormGroup = this.fb.group({
    name: ['Lisa Müller', [Validators.required, Validators.minLength(2)]],
    birthDate: ['1990-05-14', [Validators.required]],
    gender: ['female', [Validators.required]],
    height: [168, [Validators.required, Validators.min(100), Validators.max(250)]],
    currentWeight: [78, [Validators.required, Validators.min(35), Validators.max(250)]],
    targetWeight: [62],
    activityLevel: ['sedentary', [Validators.required]],
    goal: ['lose_weight', [Validators.required]]
  });

  async ngOnInit() {
    const existing = await this.storageService.loadProfile();
    if (existing) {
      this.form.patchValue({
        name: existing.name,
        birthDate: existing.birthDate,
        gender: existing.gender || 'female',
        height: existing.height,
        currentWeight: existing.currentWeight,
        targetWeight: existing.targetWeight || null,
        activityLevel: existing.activityLevel,
        goal: existing.goal
      });
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  setGender(gender: 'female' | 'male') {
    this.form.patchValue({ gender });
  }

  selectActivity(level: ActivityLevel) {
    this.form.patchValue({ activityLevel: level });
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    try {
      const formVal = this.form.value;
      const profile: UserProfile = {
        id: 'guest_profile',
        name: formVal.name.trim(),
        birthDate: formVal.birthDate,
        gender: formVal.gender,
        height: Number(formVal.height),
        currentWeight: Number(formVal.currentWeight),
        targetWeight: formVal.targetWeight ? Number(formVal.targetWeight) : undefined,
        activityLevel: formVal.activityLevel,
        goal: formVal.goal,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.storageService.saveProfile(profile);
      this.router.navigate(['/calculator']);
    } finally {
      this.isSubmitting = false;
    }
  }

  goBack() {
    this.router.navigate(['/welcome']);
  }
}
