import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, LogoComponent, ButtonComponent],
  template: `
    <div class="flex flex-col min-h-full px-6 pt-6 pb-8 justify-between">
      <!-- Top Section: Logo & Headline -->
      <div class="space-y-4">
        <!-- Logo -->
        <div class="flex items-center">
          <app-logo size="md"></app-logo>
        </div>

        <!-- Headline -->
        <div class="pt-2">
          <h1 class="text-3xl sm:text-[34px] font-extrabold leading-[1.15] text-[#103A2A] tracking-tight">
            Gesünder essen.<br />
            Einfacher abnehmen.
          </h1>
          <p class="text-[14px] sm:text-[15px] text-[#55695C] mt-2.5 leading-relaxed max-w-[340px]">
            Individuelle Mahlzeitenpläne, passend zu deinem Alltag und deinem Lieblingsmarkt.
          </p>
        </div>
      </div>

      <!-- Center Hero Image Section -->
      <div class="relative my-4 flex justify-center items-center">
        <!-- Main Hero Photo -->
        <div class="w-full relative aspect-[4/3] rounded-[28px] overflow-hidden shadow-soft-lg border-2 border-white/60">
          <img
            src="images/welcome-hero.jpg"
            alt="Gesunde Mahlzeit genießen"
            class="w-full h-full object-cover object-center"
            loading="eager"
          />
          <!-- Subtle lighting vignette -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>
        </div>

        <!-- Handwritten Badge "Kleine Schritte. Große Ergebnisse." -->
        <div class="absolute -right-2 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm px-3.5 py-2.5 rounded-2xl shadow-soft border border-[#E5F5E8] flex flex-col items-start z-10 max-w-[130px] transform rotate-1 hover:rotate-0 transition-transform">
          <span class="font-handwriting text-lg leading-tight text-[#103A2A] font-bold">
            Kleine<br />Schritte.<br />Große<br />Ergebnisse.
          </span>
          <!-- Curved cute arrow -->
          <svg class="w-6 h-6 text-[#278F39] -mt-1 self-end" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 14c4 4 11 3 14-4" />
            <path d="M14 6l4 4-4 4" />
          </svg>
        </div>
      </div>

      <!-- Bottom Actions Section -->
      <div class="space-y-3 pt-2">
        <!-- Primary Button -->
        <app-button
          variant="primary"
          size="lg"
          [fullWidth]="true"
          [iconRight]="true"
          (clicked)="startOnboarding()"
        >
          Kostenlos starten
        </app-button>

        <!-- Secondary Button -->
        <app-button
          variant="secondary"
          size="md"
          [fullWidth]="true"
          (clicked)="startOnboarding()"
        >
          Ohne Login fortfahren
        </app-button>

        <!-- Login placeholder notice -->
        <div class="pt-2 text-center">
          <p class="text-xs text-[#627264]">
            Bereits ein Konto?
            <button
              type="button"
              (click)="showLoginNotice()"
              class="font-semibold text-[#278F39] hover:underline ml-1 cursor-pointer"
            >
              Jetzt anmelden
            </button>
          </p>
          @if (showLoginInfo) {
            <p class="text-[11px] text-[#278F39] bg-[#E5F5E8] py-1 px-2.5 rounded-full mt-2 inline-block animate-fade-in font-medium">
              Coming soon – du kannst Down Kilos direkt ohne Registrierung nutzen!
            </p>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.25s ease-out forwards;
    }
  `]
})
export class WelcomeComponent {
  private router = inject(Router);
  showLoginInfo = false;

  startOnboarding() {
    this.router.navigate(['/onboarding']);
  }

  showLoginNotice() {
    this.showLoginInfo = true;
    setTimeout(() => {
      this.showLoginInfo = false;
    }, 4000);
  }
}
