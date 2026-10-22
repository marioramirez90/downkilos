import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, LogoComponent, ButtonComponent],
  template: `
    <div class="flex flex-col min-h-full px-6 pt-6 pb-8 justify-between">
      <!-- Top Bar -->
      <div class="flex items-center justify-between pb-4 border-b border-[#E3EBE4]">
        <button
          type="button"
          (click)="goBack()"
          class="flex items-center text-[#103A2A] hover:text-[#278F39] transition-colors font-medium text-sm gap-1"
        >
          <span class="text-lg">←</span> Zurück
        </button>
        <app-logo size="sm"></app-logo>
        <span class="text-xs font-semibold px-2.5 py-1 bg-[#E5F5E8] text-[#278F39] rounded-full">
          Schritt 1 / 4
        </span>
      </div>

      <!-- Content Preview / Ready for Commit 2 -->
      <div class="flex-1 py-8 flex flex-col justify-center items-center text-center space-y-4">
        <div class="w-16 h-16 rounded-full bg-[#E5F5E8] flex items-center justify-center text-[#278F39] text-2xl font-bold">
          👤
        </div>
        <div>
          <h2 class="text-2xl font-extrabold text-[#103A2A]">Profil erstellen</h2>
          <p class="text-sm text-[#55695C] mt-2 max-w-[280px]">
            Erzähle uns ein wenig über dich, damit wir deinen Plan individuell anpassen können.
          </p>
        </div>
        <div class="p-4 bg-[#F6F8F6] rounded-2xl border border-[#E3EBE4] text-xs text-[#627264] max-w-xs">
          Vorbereitete Route für Phase 2 (Guest Onboarding & Reactive Forms mit Validierung).
        </div>
      </div>

      <!-- Action -->
      <div>
        <app-button variant="secondary" size="md" [fullWidth]="true" (clicked)="goBack()">
          ← Zurück zum Start
        </app-button>
      </div>
    </div>
  `
})
export class OnboardingComponent {
  private router = inject(Router);

  goBack() {
    this.router.navigate(['/']);
  }
}
