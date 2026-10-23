import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { ProductCatalogComponent } from '../../shared/components/product-catalog/product-catalog.component';

@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [CommonModule, BottomNavComponent, ProductCatalogComponent],
  template: `
    <div class="flex flex-col min-h-full bg-[#FFFFFF]">
      <div class="flex-1 px-5 pt-4 pb-6 space-y-4 overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between pb-1">
          <h1 class="text-xl sm:text-2xl font-extrabold text-[#103A2A] tracking-tight">
            Rezepte & Produkte
          </h1>
          <span class="text-[10px] font-bold px-2 py-1 rounded-full bg-[#FFF200] text-[#ED1C24]">
            Netto
          </span>
        </div>

        <!-- Segmented Tab: Rezepte vs Netto-Sortiment -->
        <div class="flex p-1 bg-[#F1F5F2] rounded-2xl select-none">
          <button
            type="button"
            (click)="activeTab.set('recipes')"
            class="flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
            [ngClass]="activeTab() === 'recipes'
              ? 'bg-[#278F39] text-white shadow-soft-sm'
              : 'text-[#627264] hover:text-[#103A2A]'"
          >
            Rezept-Ideen
          </button>
          <button
            type="button"
            (click)="activeTab.set('catalog')"
            class="flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
            [ngClass]="activeTab() === 'catalog'
              ? 'bg-[#278F39] text-white shadow-soft-sm'
              : 'text-[#627264] hover:text-[#103A2A]'"
          >
            Netto-Produkte
          </button>
        </div>

        @if (activeTab() === 'catalog') {
          <!-- Product Catalog Component -->
          <div class="animate-fade-in">
            <app-product-catalog></app-product-catalog>
          </div>
        } @else {
          <!-- Recipe Preview (Phase 7 preparation) -->
          <div class="p-6 bg-[#F6F8F6] rounded-2xl border border-[#E3EBE4] text-center space-y-3 animate-fade-in">
            <span class="text-3xl">📖</span>
            <h2 class="text-base font-bold text-[#103A2A]">Rezeptübersicht (Phase 7)</h2>
            <p class="text-xs text-[#55695C]">
              In Phase 7 werden hier 20+ alltagstaugliche Gerichte mit genauen Netto-Zutaten, Nährwerten und Portionspreisen bereitgestellt.
            </p>
          </div>
        }
      </div>

      <app-bottom-nav></app-bottom-nav>
    </div>
  `
})
export class RecipesComponent {
  activeTab = signal<'recipes' | 'catalog'>('catalog');
}
