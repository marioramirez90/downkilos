import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ShoppingListService } from '../../core/services/shopping-list.service';
import { PriceService } from '../../core/services/price.service';
import { ShoppingListItem } from '../../core/models/shopping-list.model';
import { ProductCategory } from '../../core/models/product.model';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

import { MealPlannerService } from '../../core/services/meal-planner.service';

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BottomNavComponent
  ],
  templateUrl: './shopping-list.component.html',
  styleUrl: './shopping-list.component.scss'
})
export class ShoppingListComponent {
  private router = inject(Router);
  readonly shoppingService = inject(ShoppingListService);
  readonly priceService = inject(PriceService);
  readonly plannerService = inject(MealPlannerService);

  readonly showAddModal = signal<boolean>(false);
  readonly originFilter = computed(() => this.shoppingService.originFilter());
  newItemName = '';
  newItemPrice: number | null = null;
  newItemSize = '1 Packung';

  readonly displayedItems = computed<ShoppingListItem[]>(() => {
    return this.shoppingService.filteredItems();
  });

  setOriginFilter(filter: 'all' | 'plan' | 'manual'): void {
    this.shoppingService.originFilter.set(filter);
  }

  syncWithPlan(): void {
    const plan = this.plannerService.weeklyPlan();
    this.shoppingService.syncWithWeeklyPlan(plan);
  }

  readonly summary = computed(() => {
    return this.shoppingService.summary();
  });

  /**
   * Summe der Kalorien pro 100g aller eindeutigen Artikel in der Liste (z.B. 246 + 143 + 89 = 478 kcal)
   */
  readonly sumCaloriesPer100g = computed<number>(() => {
    return this.displayedItems().reduce((acc, item) => acc + (item.caloriesPer100g || 0), 0);
  });

  /**
   * Deutsche Formatierung mit Tausendertrennzeichen (z.B. 1.230 oder 2.900)
   */
  formatCalories(val: number | null | undefined): string {
    if (val === null || val === undefined || isNaN(val)) return '0';
    return Math.round(val).toLocaleString('de-DE');
  }

  /**
   * Berechnet den Grundpreis passend zum Artikel (z.B. (0,36 €/100 g) oder (0,30 €/Stück))
   */
  getBasePriceText(item: ShoppingListItem): string {
    if (item.packagePrice === null || item.packagePrice === undefined) return '';

    // Falls Eier oder reine Stückware ohne Gramm-Basis
    if (item.pieceUnitName === 'Ei' || item.name.toLowerCase().includes('eier')) {
      const pieces = item.piecesPerPackage || 10;
      const piecePrice = item.packagePrice / pieces;
      return `(${piecePrice.toFixed(2).replace('.', ',')} €/Stück)`;
    }

    // Falls Gewichtsangabe in Gramm oder Kilogramm (Toast, Bananen, etc.)
    const grams = item.packageWeightGrams || (item.neededUnit === 'kg' ? 1000 : 500);
    if (grams > 0) {
      const pricePer100g = (item.packagePrice / grams) * 100;
      return `(${pricePer100g.toFixed(2).replace('.', ',')} €/100 g)`;
    }

    return '';
  }

  /**
   * Beschriftung der Stück-Spalte (z.B. "1 Scheibe", "1 Ei", "1 Banane")
   */
  getPieceUnitLabel(item: ShoppingListItem): string {
    const unit = item.pieceUnitName?.trim() || 'Stück';
    return `1 ${unit}`;
  }

  /**
   * Stückkalorien für die zweite Spalte
   */
  getPieceCalories(item: ShoppingListItem): number | null {
    if (item.caloriesPerPiece !== null && item.caloriesPerPiece !== undefined) {
      return item.caloriesPerPiece;
    }
    // Fallback falls Banane
    if (item.name.toLowerCase().includes('banan')) {
      return 95;
    }
    return item.packageCalories;
  }

  /**
   * Beschriftung der dritten Spalte ("Packung" oder "Gesamt")
   */
  getPackageUnitLabel(item: ShoppingListItem): string {
    if (item.pieceUnitName === 'Banane' || item.neededUnit === 'kg' || item.name.toLowerCase().includes('banan')) {
      return 'Gesamt';
    }
    return 'Packung';
  }

  /**
   * Kalorien der Packung bzw. Gesamtmenge (skaliert mit Mengensteuerung)
   */
  getPackageCalories(item: ShoppingListItem): number | null {
    if (item.packageCalories !== null && item.packageCalories !== undefined) {
      return item.packageCalories;
    }
    if (item.totalCalories !== null && item.totalCalories !== undefined) {
      return item.totalCalories;
    }
    return null;
  }

  /**
   * Mengensteuerung: Verringern nur bis minimal 1.
   * Löschen erfolgt ausschließlich über das Papierkorb-Icon!
   */
  updateCount(id: string, delta: number): void {
    const item = this.displayedItems().find(i => i.id === id);
    if (item && delta < 0 && item.packageCount <= 1) {
      return; // Nicht löschen bei Klick auf Minus
    }
    this.shoppingService.updatePackageCount(id, delta);
  }

  /**
   * Artikel entfernen über das Papierkorb-Icon
   */
  removeItem(id: string): void {
    this.shoppingService.removeItem(id);
  }

  /**
   * Vorrats- oder Abhak-Status (Checkbox)
   */
  toggleChecked(id: string): void {
    this.shoppingService.toggleItemChecked(id);
  }

  loadSample(): void {
    this.shoppingService.loadSampleList();
  }

  openAddModal(): void {
    this.newItemName = '';
    this.newItemPrice = null;
    this.newItemSize = '1 Packung';
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
  }

  addCustomItem(): void {
    const name = this.newItemName.trim();
    if (!name) return;
    this.shoppingService.addCustomItem(name, this.newItemPrice, 'pantry', this.newItemSize);
    this.newItemName = '';
    this.newItemPrice = null;
    this.showAddModal.set(false);
  }

  setCategory(cat: ProductCategory): void {
    this.shoppingService.selectedCategory.set(cat);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  goToDiscover(): void {
    this.router.navigate(['/discover']);
  }
}
