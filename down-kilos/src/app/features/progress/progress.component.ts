import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, BottomNavComponent],
  template: `
    <div class="flex flex-col min-h-full bg-[#FFFFFF]">
      <div class="flex-1 px-5 pt-4 pb-6 space-y-4">
        <h1 class="text-xl sm:text-2xl font-extrabold text-[#103A2A] tracking-tight">
          Mein Fortschritt & Mehr
        </h1>
        <div class="p-6 bg-[#F6F8F6] rounded-2xl border border-[#E3EBE4] text-center space-y-3">
          <span class="text-3xl">📈</span>
          <h2 class="text-base font-bold text-[#103A2A]">Fortschrittsverlauf (Phase 9)</h2>
          <p class="text-xs text-[#55695C]">
            Vorbereitete Route für Gewichtsverlauf, Kalorienhistorie und Profileinstellungen.
          </p>
        </div>
      </div>
      <app-bottom-nav></app-bottom-nav>
    </div>
  `
})
export class ProgressComponent {}
