import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { PriceService } from '../../../core/services/price.service';
import { ProductCategory, ProductItem } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4">
      <!-- Search & Category Filters -->
      <div class="space-y-2">
        <div class="relative">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Netto-Produkte suchen (z.B. Skyr, Reis, Hähnchen)..."
            class="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-[#F6F8F6] border border-[#E3EBE4] text-xs text-[#17241D] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#278F39]"
          />
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[#627264] text-xs">
            🔍
          </span>
        </div>

        <!-- Category filter pills -->
        <div class="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
          @for (cat of categories; track cat.id) {
            <button
              type="button"
              (click)="selectedCategory.set(cat.id)"
              class="py-1 px-3 rounded-full font-semibold transition-all select-none whitespace-nowrap cursor-pointer"
              [ngClass]="selectedCategory() === cat.id
                ? 'bg-[#278F39] text-white'
                : 'bg-[#F1F5F2] text-[#627264] hover:bg-[#E2EDE5]'"
            >
              {{ cat.label }}
            </button>
          }
        </div>
      </div>

      <!-- Products List -->
      <div class="space-y-2.5">
        @for (item of filteredProducts(); track item.id) {
          <div class="p-3 rounded-2xl bg-white border border-[#E3EBE4] shadow-soft-sm flex items-center justify-between gap-3">
            <!-- Product Image -->
            <div class="w-14 h-14 rounded-xl overflow-hidden bg-[#F6F8F6] flex-shrink-0 border border-[#E3EBE4]">
              <img
                [src]="item.imageUrl"
                [alt]="item.name"
                class="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            <!-- Product Details -->
            <div class="flex-1 min-w-0">
              <span class="text-[10px] font-bold text-[#627264] block truncate">
                {{ item.brand }}
              </span>
              <h4 class="text-xs font-bold text-[#103A2A] truncate">
                {{ item.name }}
              </h4>
              <span class="text-[11px] text-[#627264] block">
                {{ item.packageSize }}
              </span>
              <!-- Status Badge -->
              <div class="flex items-center gap-1.5 mt-1">
                <span
                  class="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                  [ngClass]="[priceService.getStatusBadge(item.priceStatus).bgClass, priceService.getStatusBadge(item.priceStatus).textClass]"
                >
                  {{ priceService.getStatusBadge(item.priceStatus).label }}
                </span>
                @if (item.ean) {
                  <span class="text-[9px] text-[#94A3B8]">EAN: {{ item.ean.slice(-6) }}</span>
                }
              </div>
            </div>

            <!-- Price & Edit Action -->
            <div class="flex flex-col items-end justify-between flex-shrink-0">
              <span
                class="font-black text-sm"
                [ngClass]="item.price !== null ? 'text-[#103A2A]' : 'text-[#D97706] text-xs font-semibold'"
              >
                {{ priceService.formatPrice(item.price) }}
              </span>
              <button
                type="button"
                (click)="openPriceEditor(item)"
                class="text-[10px] text-[#278F39] hover:underline font-semibold mt-2 cursor-pointer"
              >
                {{ item.price !== null ? 'Preis anpassen' : 'Preis eintragen' }}
              </button>
            </div>
          </div>
        } @empty {
          <div class="text-center py-6 text-xs text-[#627264]">
            Keine Produkte für diesen Suchbegriff gefunden.
          </div>
        }
      </div>

      <!-- Price Edit Modal -->
      @if (editingProduct(); as prod) {
        <div class="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div class="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-xl border border-[#E3EBE4]">
            <div class="flex justify-between items-center">
              <h3 class="text-sm font-extrabold text-[#103A2A]">
                Preis für Netto eintragen
              </h3>
              <button
                type="button"
                (click)="closePriceEditor()"
                class="text-[#627264] hover:text-[#103A2A] font-bold text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div class="flex items-center gap-3 p-2.5 rounded-xl bg-[#F6F8F6]">
              <img [src]="prod.imageUrl" [alt]="prod.name" class="w-10 h-10 object-cover rounded-lg" />
              <div class="min-w-0">
                <span class="text-[10px] text-[#627264] block">{{ prod.brand }}</span>
                <span class="text-xs font-bold text-[#103A2A] block truncate">{{ prod.name }} ({{ prod.packageSize }})</span>
              </div>
            </div>

            <div class="space-y-1.5">
              <label for="newPriceInput" class="block text-xs font-semibold text-[#17241D]">
                Tatsächlicher Filialpreis in €:
              </label>
              <div class="relative">
                <input
                  id="newPriceInput"
                  type="number"
                  step="0.01"
                  min="0.10"
                  max="99.99"
                  [(ngModel)]="tempPriceInput"
                  class="w-full pl-4 pr-10 py-3 rounded-2xl border border-[#DCE4DE] text-base font-bold text-[#103A2A] focus:outline-none focus:border-[#278F39]"
                  placeholder="z.B. 1,99"
                />
                <span class="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#627264]">€</span>
              </div>
              <p class="text-[10px] text-[#627264]">
                Deine Eingabe wird lokal gespeichert und als „Selbst erfasst“ gekennzeichnet.
              </p>
            </div>

            <div class="flex gap-2 pt-2">
              <button
                type="button"
                (click)="closePriceEditor()"
                class="flex-1 py-3 rounded-2xl bg-[#F1F5F2] text-[#627264] font-semibold text-xs hover:bg-[#E5F5E8] cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                (click)="saveNewPrice()"
                class="flex-1 py-3 rounded-2xl bg-[#278F39] text-white font-bold text-xs hover:bg-[#217A30] cursor-pointer"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ProductCatalogComponent {
  productService = inject(ProductService);
  priceService = inject(PriceService);

  searchQuery = '';
  selectedCategory = signal<ProductCategory>('all');
  editingProduct = signal<ProductItem | null>(null);
  tempPriceInput: number | null = null;

  readonly categories: { id: ProductCategory; label: string }[] = [
    { id: 'all', label: 'Alle' },
    { id: 'fruits_veg', label: 'Obst & Gemüse' },
    { id: 'meat_fish', label: 'Fleisch' },
    { id: 'dairy', label: 'Milchprodukte' },
    { id: 'grains', label: 'Getreide' }
  ];

  filteredProducts(): ProductItem[] {
    return this.productService.searchProducts(this.searchQuery, this.selectedCategory());
  }

  openPriceEditor(item: ProductItem) {
    this.editingProduct.set(item);
    this.tempPriceInput = item.price !== null ? item.price : 1.99;
  }

  closePriceEditor() {
    this.editingProduct.set(null);
    this.tempPriceInput = null;
  }

  saveNewPrice() {
    const prod = this.editingProduct();
    if (prod && this.tempPriceInput !== null && this.tempPriceInput > 0) {
      this.productService.updateUserPrice(prod.id, this.tempPriceInput);
      this.closePriceEditor();
    }
  }
}
