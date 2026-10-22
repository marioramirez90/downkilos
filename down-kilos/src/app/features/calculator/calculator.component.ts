import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StorageService } from '../../core/services/storage.service';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col min-h-full px-5 pt-4 pb-6 bg-[#FFFFFF]">
      <!-- Header -->
      <div class="flex items-center gap-3 pb-3">
        <button
          type="button"
          (click)="goBack()"
          class="w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-[#103A2A] hover:bg-[#F1F5F2] active:scale-95 transition-transform"
        >
          <svg class="w-6 h-6 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 class="text-xl sm:text-2xl font-extrabold text-[#103A2A] tracking-tight">
          Mein Kalorienbedarf
        </h1>
      </div>

      <div class="flex-1 flex flex-col justify-center items-center text-center space-y-4 py-8">
        <div class="w-16 h-16 rounded-full bg-[#E5F5E8] flex items-center justify-center text-[#278F39] text-2xl font-bold">
          ⚡
        </div>
        <h2 class="text-xl font-bold text-[#103A2A]">Profil erfolgreich gespeichert!</h2>
        @if (storageService.profile(); as p) {
          <p class="text-xs text-[#55695C] max-w-xs">
            Daten für <strong>{{ p.name }}</strong> ({{ p.currentWeight }} kg, {{ p.height }} cm) wurden lokal in IndexedDB gesichert.
          </p>
        }
        <div class="p-3 bg-[#F6F8F6] rounded-xl border border-[#E3EBE4] text-xs text-[#627264] max-w-xs">
          Vorbereitete Route für Phase 3 (Kalorienrechner mit Mifflin-St.-Jeor-Formel & Makronährstoffen).
        </div>
      </div>

      <button
        (click)="goBack()"
        class="w-full py-3.5 px-6 rounded-2xl bg-[#EDF5EF] text-[#103A2A] font-semibold text-sm hover:bg-[#E2EDE5] transition-colors"
      >
        ← Profil nochmals ansehen / bearbeiten
      </button>
    </div>
  `
})
export class CalculatorComponent {
  private router = inject(Router);
  readonly storageService = inject(StorageService);

  goBack() {
    this.router.navigate(['/onboarding']);
  }
}
