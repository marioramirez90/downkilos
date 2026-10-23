import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ProductService } from '../../core/services/product.service';
import { PriceService } from '../../core/services/price.service';
import { FoodLogService } from '../../core/services/food-log.service';
import { ShoppingListService } from '../../core/services/shopping-list.service';
import { PackageCalorieCalculatorService, PieceCalorieInfo } from '../../core/services/package-calorie-calculator.service';
import { ProductItem, CalorieFilterType, ProductSortType } from '../../core/models/product.model';
import { MealType } from '../../core/models/recipe.model';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { HamburgerButtonComponent } from '../../shared/components/hamburger-button/hamburger-button.component';
import { LogoComponent } from '../../shared/components/logo/logo.component';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BottomNavComponent,
    HamburgerButtonComponent,
    LogoComponent,
    TranslatePipe
  ],
  templateUrl: './discover.component.html',
  styleUrl: './discover.component.scss'
})
export class DiscoverComponent {
  private router = inject(Router);
  productService = inject(ProductService);
  priceService = inject(PriceService);
  foodLogService = inject(FoodLogService);
  shoppingListService = inject(ShoppingListService);
  calorieCalc = inject(PackageCalorieCalculatorService);

  readonly Math = Math;

  searchQuery = '';
  activeCategoryFilter = signal<string>('all');
  activeCalorieFilter = signal<CalorieFilterType>('all');
  activeSortBy = signal<ProductSortType>('relevance');
  filterByRemainingKcal = signal<boolean>(false);

  setCategoryFilter(filterId: string): void {
    this.activeCategoryFilter.set(filterId);
  }

  calculateSelectedCalories(amountGrams: number, caloriesPer100g: number, edibleYieldPercent: number = 100): number {
    const yieldFactor = edibleYieldPercent > 1 ? edibleYieldPercent / 100 : edibleYieldPercent;
    return Math.round((amountGrams * yieldFactor * caloriesPer100g) / 100);
  }

  // Detail-Modal & interaktive Mengenauswahl
  selectedProductDetail = signal<ProductItem | null>(null);
  detailMode = signal<'pieces' | 'grams' | 'packages'>('pieces');
  detailAmount = signal<number>(1);
  selectedMealType: MealType = 'snack';

  // Barcode-Scanner Modal
  showBarcodeScanner = signal<boolean>(false);
  barcodeInput = '';
  barcodeScanError = signal<string | null>(null);

  toastMessage = signal<string | null>(null);

  readonly categoryPills = [
    { id: 'all', label: 'Alle' },
    { id: 'grains', label: '🍞 Brot & Getreide' },
    { id: 'dairy', label: '🥚 Eier & Milch' },
    { id: 'pantry', label: '🥫 Vorrat & Dosen' },
    { id: 'fruits_veg', label: '🍏 Obst & Gemüse' },
    { id: 'meat_fish', label: '🥩 Fleisch & Fisch' },
    { id: 'beverages', label: '🥤 Getränke' },
    { id: 'ready_meal', label: '🍲 Fertiggerichte' },
    { id: 'low_cal', label: '🌱 Kalorienarm (<40 kcal)' },
    { id: 'high_protein', label: '💪 Proteinreich (>10g)' },
    { id: 'budget', label: '🏷️ Günstig (< 1,50 €)' },
    { id: 'offers', label: '🔥 Netto-Angebote' }
  ];

  readonly remainingCalories = computed(() => this.foodLogService.dailySummary().remainingCalories);

  readonly filteredProducts = computed(() => {
    let list = this.productService.products();
    const query = this.searchQuery.trim().toLowerCase();
    const cat = this.activeCategoryFilter();
    const calFilter = this.activeCalorieFilter();
    const remainingLimit = this.filterByRemainingKcal() ? this.remainingCalories() : null;

    // 1. Textsuche nach Name, Marke oder Barcode
    if (query) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        (p.ean && p.ean.includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query))
      );
    }

    // 2. Kategorie-Filter
    if (cat === 'fruits_veg' || cat === 'meat_fish' || cat === 'dairy' || cat === 'grains' || cat === 'pantry' || cat === 'ready_meal') {
      list = list.filter(p => p.category === cat);
    } else if (cat === 'low_cal') {
      list = list.filter(p => p.nutrition.caloriesPer100g < 40);
    } else if (cat === 'high_protein') {
      list = list.filter(p => p.nutrition.proteinPer100g >= 10);
    } else if (cat === 'budget') {
      list = list.filter(p => p.price !== null && p.price <= 1.50);
    } else if (cat === 'offers') {
      list = list.filter(p => p.priceStatus === 'confirmed_offer');
    }

    // 3. Kalorienfilter
    if (calFilter === 'low_cal') {
      list = list.filter(p => p.nutrition.caloriesPer100g < 40);
    }

    // 4. Sortierung
    const sort = this.activeSortBy();
    const sorted = [...list];
    if (sort === 'price_asc') {
      sorted.sort((a, b) => (a.price ?? 999) - (b.price ?? 999));
    } else if (sort === 'price_desc') {
      sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    } else if (sort === 'calories_asc') {
      sorted.sort((a, b) => a.nutrition.caloriesPer100g - b.nutrition.caloriesPer100g);
    } else if (sort === 'calories_desc') {
      sorted.sort((a, b) => b.nutrition.caloriesPer100g - a.nutrition.caloriesPer100g);
    } else if (sort === 'protein_desc') {
      sorted.sort((a, b) => b.nutrition.proteinPer100g - a.nutrition.proteinPer100g);
    }

    return sorted;
  });

  // Dynamische Kalorienberechnung für die geöffnete Produktdetail-Ansicht
  readonly calculatedDetailCalories = computed<number | null>(() => {
    const prod = this.selectedProductDetail();
    if (!prod) return null;
    const mode = this.detailMode();
    const amount = this.detailAmount();
    return this.calorieCalc.calculateCustomAmountCalories(prod, amount, mode);
  });

  getPackageCalories(product: ProductItem): number | null {
    return this.calorieCalc.calculatePackageCalories(product);
  }

  getPieceInfo(product: ProductItem): PieceCalorieInfo | null {
    return this.calorieCalc.calculatePieceCalories(product);
  }

  openProductDetail(product: ProductItem): void {
    this.selectedProductDetail.set(product);
    const pieceInfo = this.calorieCalc.calculatePieceCalories(product);
    if (pieceInfo) {
      this.detailMode.set('pieces');
      this.detailAmount.set(1);
    } else {
      this.detailMode.set('grams');
      this.detailAmount.set(product.servingSizeGrams || 100);
    }
  }

  closeProductDetail(): void {
    this.selectedProductDetail.set(null);
  }

  setDetailSelection(amount: number, mode: 'pieces' | 'grams' | 'packages'): void {
    this.detailAmount.set(amount);
    this.detailMode.set(mode);
  }

  addToShoppingList(product: ProductItem): void {
    this.shoppingListService.addProductToShoppingList(product);
    this.showToast(`1 Packung "${product.name}" zur Einkaufsliste hinzugefügt!`);
  }

  logAsEatenFromDetail(): void {
    const prod = this.selectedProductDetail();
    if (!prod) return;

    let grams = 100;
    const mode = this.detailMode();
    const amount = this.detailAmount();

    if (mode === 'pieces') {
      const pieceInfo = this.calorieCalc.calculatePieceCalories(prod);
      grams = (pieceInfo?.pieceWeightGrams || 50) * amount;
    } else if (mode === 'packages') {
      grams = (prod.packageWeightGrams || 500) * amount;
    } else {
      grams = amount;
    }

    this.foodLogService.addProductToDay(prod, Math.round(grams), this.selectedMealType, 'eaten');
    this.showToast(`"${prod.name}" (${Math.round(grams)}g) als gegessen verbucht!`);
    this.closeProductDetail();
  }

  // Barcode-Suche
  searchByBarcode(): void {
    const code = this.barcodeInput.trim();
    if (!code) return;

    const matched = this.productService.products().find(p => p.ean === code);
    if (matched) {
      this.barcodeScanError.set(null);
      this.showBarcodeScanner.set(false);
      this.barcodeInput = '';
      this.openProductDetail(matched);
    } else {
      this.barcodeScanError.set(`Kein verifiziertes Netto-Produkt mit EAN "${code}" gefunden.`);
    }
  }

  goToShoppingList(): void {
    this.router.navigate(['/shopping-list']);
  }

  goToRecipes(): void {
    this.router.navigate(['/recipes']);
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 2800);
  }
}
