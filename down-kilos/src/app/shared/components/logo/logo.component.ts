import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="containerClasses()">
      <!-- Leaf Icon SVG -->
      <div [class]="iconWrapperClasses()">
        <svg
          [attr.width]="iconSize()"
          [attr.height]="iconSize()"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          class="transform transition-transform hover:scale-105"
        >
          <!-- Leaf Body with subtle gradient -->
          <defs>
            <linearGradient id="leafGrad" x1="6" y1="42" x2="42" y2="6" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#1E7A2E" />
              <stop offset="50%" stop-color="#278F39" />
              <stop offset="100%" stop-color="#34B24B" />
            </linearGradient>
            <linearGradient id="veinGrad" x1="12" y1="36" x2="38" y2="10" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.85" />
              <stop offset="100%" stop-color="#E5F5E8" stop-opacity="0.9" />
            </linearGradient>
          </defs>
          
          <!-- Organic Leaf Shape matching the reference -->
          <path
            d="M8 40C8 40 10 24 22 13C34 2 44 4 44 4C44 4 45 15 36 27C27 39 12 40 8 40Z"
            fill="url(#leafGrad)"
          />
          
          <!-- Central Stem & Veins -->
          <path
            d="M10 39C16 35 24 27 34 14"
            stroke="url(#veinGrad)"
            stroke-width="2.2"
            stroke-linecap="round"
          />
          <!-- Vein Branch 1 -->
          <path
            d="M19 30C23 30 29 27 33 22"
            stroke="url(#veinGrad)"
            stroke-width="1.6"
            stroke-linecap="round"
          />
          <!-- Vein Branch 2 -->
          <path
            d="M15 34C18 31 20 27 23 23"
            stroke="url(#veinGrad)"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <!-- Vein Branch 3 -->
          <path
            d="M26 23C30 20 34 16 38 10"
            stroke="url(#veinGrad)"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </div>

      <!-- Text Container -->
      <div class="flex flex-col select-none">
        <span [class]="textClasses()">
          Down Kilos
        </span>
        @if (showTagline()) {
          <span class="text-[9px] font-bold tracking-[0.18em] text-[#278F39] uppercase mt-0.5">
            Einfach. Lecker. Gesünder leben.
          </span>
        }
      </div>
    </div>
  `
})
export class LogoComponent {
  size = input<'sm' | 'md' | 'lg'>('md');
  showTagline = input<boolean>(false);
  centered = input<boolean>(false);

  containerClasses() {
    const align = this.centered() ? 'justify-center items-center' : 'items-center';
    return `inline-flex gap-2.5 ${align}`;
  }

  iconWrapperClasses() {
    return 'flex-shrink-0 flex items-center justify-center';
  }

  iconSize() {
    switch (this.size()) {
      case 'sm': return 24;
      case 'lg': return 42;
      case 'md':
      default: return 32;
    }
  }

  textClasses() {
    switch (this.size()) {
      case 'sm':
        return 'text-lg font-bold tracking-tight text-[#103A2A]';
      case 'lg':
        return 'text-3xl font-extrabold tracking-tight text-[#103A2A]';
      case 'md':
      default:
        return 'text-2xl font-bold tracking-tight text-[#103A2A]';
    }
  }
}
