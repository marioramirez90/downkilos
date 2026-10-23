import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ShoppingListService } from '../../core/services/shopping-list.service';
import { PriceService } from '../../core/services/price.service';
import { ProductCategory } from '../../core/models/product.model';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [CommonModule, FormsModule, BottomNavComponent],
  template: `
    <div class="flex flex-col h-full bg-[#FFFFFF] overflow-hidden">
      <!-- Main Scrollable Content Area -->
      <div class="flex-1 px-5 pt-4 pb-4 space-y-3.5 min-h-0 overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between pb-1">
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
              Einkaufsliste
            </h1>
          </div>

          <!-- Info & Add Action -->
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              (click)="showAddModal.set(true)"
              class="px-2.5 py-1 text-xs font-bold rounded-full bg-[#E5F5E8] text-[#278F39] hover:bg-[#D4EED8] transition-colors"
            >
              + Artikel
            </button>
            <button
              type="button"
              (click)="showInfo.set(!showInfo())"
              class="w-8 h-8 rounded-full bg-[#F1F5F2] hover:bg-[#E5F5E8] flex items-center justify-center text-[#278F39] transition-colors text-xs font-bold"
              title="Info"
            >
              ℹ️
            </button>
          </div>
        </div>

        <!-- Info Notice -->
        @if (showInfo()) {
          <div class="p-3.5 rounded-2xl bg-[#E5F5E8] border border-[#CDE9D2] text-xs text-[#103A2A] leading-relaxed animate-fade-in flex justify-between items-start">
            <p>
              Diese Einkaufsliste wurde automatisch aus deinen geplanten Mahlzeiten berechnet. Mengen sind auf ganze Netto-Verpackungen gerundet.
            </p>
            <button (click)="showInfo.set(false)" class="text-xs font-bold text-[#278F39] ml-2">✕</button>
          </div>
        }

        <!-- Category Filter Pills (Matching Screen 6) -->
        <div class="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none text-xs">
          <button
            type="button"
            (click)="setCategory('all')"
            class="py-1.5 px-3.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer"
            [ngClass]="shoppingService.selectedCategory() === 'all'
              ? 'bg-[#278F39] text-white shadow-soft-sm'
              : 'bg-[#F1F5F2] text-[#627264] hover:bg-[#E2EDE5]'"
          >
            Alle ({{ shoppingService.items().length }})
          </button>
          <button
            type="button"
            (click)="setCategory('fruits_veg')"
            class="py-1.5 px-3.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer"
            [ngClass]="shoppingService.selectedCategory() === 'fruits_veg'
              ? 'bg-[#278F39] text-white shadow-soft-sm'
              : 'bg-[#F1F5F2] text-[#627264] hover:bg-[#E2EDE5]'"
          >
            Obst & Gemüse
          </button>
          <button
            type="button"
            (click)="setCategory('dairy')"
            class="py-1.5 px-3.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer"
            [ngClass]="shoppingService.selectedCategory() === 'dairy'
              ? 'bg-[#278F39] text-white shadow-soft-sm'
              : 'bg-[#F1F5F2] text-[#627264] hover:bg-[#E2EDE5]'"
          >
            Milchprodukte
          </button>
          <button
            type="button"
            (click)="setCategory('meat_fish')"
            class="py-1.5 px-3.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer"
            [ngClass]="shoppingService.selectedCategory() === 'meat_fish'
              ? 'bg-[#278F39] text-white shadow-soft-sm'
              : 'bg-[#F1F5F2] text-[#627264] hover:bg-[#E2EDE5]'"
          >
            Fleisch & Fisch
          </button>
          <button
            type="button"
            (click)="setCategory('grains')"
            class="py-1.5 px-3.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer"
            [ngClass]="shoppingService.selectedCategory() === 'grains'
              ? 'bg-[#278F39] text-white shadow-soft-sm'
              : 'bg-[#F1F5F2] text-[#627264] hover:bg-[#E2EDE5]'"
          >
            Getreide
          </button>
        </div>

        <!-- Items List (Matching Screen 6) -->
        <div class="space-y-2 pt-1">
          @for (item of shoppingService.filteredItems(); track item.id) {
            <div
              class="p-2.5 sm:p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 select-none"
              [ngClass]="item.isChecked
                ? 'bg-[#F8FAF9] border-[#E3EBE4] opacity-80'
                : 'bg-white border-[#E3EBE4] shadow-soft-sm hover:border-[#278F39]/50'"
            >
              <!-- Left: Checkbox & Product Image -->
              <div class="flex items-center gap-3 min-w-0">
                <!-- Checkbox -->
                <button
                  type="button"
                  (click)="shoppingService.toggleItemChecked(item.id)"
                  class="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all cursor-pointer"
                  [ngClass]="item.isChecked
                    ? 'bg-[#278F39] text-white shadow-2xs'
                    : 'border-2 border-[#CBD5E1] bg-white hover:border-[#278F39]'"
                  [attr.aria-label]="item.name + ' abhaken'"
                >
                  @if (item.isChecked) {
                    <svg class="w-4 h-4 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  }
                </button>

                <!-- Thumbnail -->
                <div class="w-12 h-12 rounded-xl overflow-hidden bg-[#F6F8F6] border border-[#E3EBE4] flex-shrink-0">
                  <img [src]="item.imageUrl" [alt]="item.name" class="w-full h-full object-cover" />
                </div>

                <!-- Text labels -->
                <div class="min-w-0">
                  <h4
                    class="text-xs sm:text-sm font-bold text-[#103A2A] truncate"
                    [class.line-through]="item.isChecked"
                    [class.text-[#627264]]="item.isChecked"
                  >
                    {{ item.name }}
                  </h4>
                  <span class="text-[11px] text-[#627264] block">
                    {{ item.packageSize }}
                  </span>
                </div>
              </div>

              <!-- Right: Price -->
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="text-xs sm:text-sm font-black text-[#103A2A]">
                  {{ priceService.formatPrice(item.totalCost) }}
                </span>
                @if (item.isCustom) {
                  <button
                    type="button"
                    (click)="shoppingService.removeCustomItem(item.id)"
                    class="text-xs text-red-400 hover:text-red-600 p-1"
                    title="Löschen"
                  >
                    ✕
                  </button>
                }
              </div>
            </div>
          } @empty {
            <div class="text-center py-8 text-xs text-[#627264]">
              Keine Artikel in dieser Kategorie vorhanden.
            </div>
          }
        </div>

        <!-- Bottom Summary Row (Matching Screen 6) -->
        <div class="p-3.5 rounded-2xl bg-[#F6F8F6] border border-[#E3EBE4] flex items-center justify-between mt-2">
          <span class="text-xs font-bold text-[#103A2A]">
            Gesamtsumme (ca.)
          </span>
          <span class="text-base sm:text-lg font-black text-[#103A2A]">
            {{ priceService.formatPrice(shoppingService.summary().totalCost) }}
          </span>
        </div>

        <!-- Action Button (Matching Screen 6) -->
        <div class="pt-1">
          <button
            type="button"
            (click)="openListInStore()"
            class="w-full py-4 px-6 rounded-2xl bg-[#278F39] hover:bg-[#217A30] active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-button flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Liste im Markt öffnen</span>
            <span class="text-lg">→</span>
          </button>
      </div>

      <!-- Persistent 5-Icon Bottom Navigation -->
      <app-bottom-nav></app-bottom-nav>

      <!-- Add Custom Item Modal -->
      @if (showAddModal()) {
        <div class="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div class="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-xl border border-[#E3EBE4]">
            <div class="flex justify-between items-center">
              <h3 class="text-sm font-extrabold text-[#103A2A]">Artikel hinzufügen</h3>
              <button (click)="showAddModal.set(false)" class="text-[#627264] hover:text-[#103A2A] font-bold">✕</button>
            </div>

            <div class="space-y-2">
              <label class="block text-xs font-semibold text-[#17241D]">Produktname</label>
              <input
                type="text"
                [(ngModel)]="newItemName"
                placeholder="z.B. Mineralwasser"
                class="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE4DE] text-xs focus:outline-none focus:border-[#278F39]"
              />

              <label class="block text-xs font-semibold text-[#17241D] pt-1">Geschätzter Preis in €</label>
              <input
                type="number"
                step="0.05"
                [(ngModel)]="newItemPrice"
                placeholder="0.79"
                class="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE4DE] text-xs focus:outline-none focus:border-[#278F39]"
              />
            </div>

            <div class="flex gap-2 pt-2">
              <button
                type="button"
                (click)="showAddModal.set(false)"
                class="flex-1 py-2.5 rounded-xl bg-[#F1F5F2] text-xs font-semibold text-[#627264]"
              >
                Abbrechen
              </button>
              <button
                type="button"
                (click)="addCustomItem()"
                class="flex-1 py-2.5 rounded-xl bg-[#278F39] text-white text-xs font-bold hover:bg-[#217A30]"
              >
                Hinzufügen
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Bottom Navigation -->
      <app-bottom-nav></app-bottom-nav>
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
export class ShoppingListComponent {
  private router = inject(Router);
  shoppingService = inject(ShoppingListService);
  priceService = inject(PriceService);

  showInfo = signal<boolean>(false);
  showAddModal = signal<boolean>(false);
  newItemName = '';
  newItemPrice: number | null = 1.49;

  setCategory(cat: ProductCategory) {
    this.shoppingService.selectedCategory.set(cat);
  }

  addCustomItem() {
    if (!this.newItemName.trim()) return;
    this.shoppingService.addCustomItem(this.newItemName, this.newItemPrice);
    this.newItemName = '';
    this.showAddModal.set(false);
  }

  openListInStore() {
    // Mode for shopping directly at Netto
    alert('Einkaufsmodus aktiviert! Hake deine Artikel beim Einkauf im Netto-Markt einfach ab.');
  }

  goBack() {
    this.router.navigate(['/meal-planner']);
  }
}
