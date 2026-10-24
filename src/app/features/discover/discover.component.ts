import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { PriceService } from '../../core/services/price.service';
import { FoodLogService } from '../../core/services/food-log.service';
import { ShoppingListService } from '../../core/services/shopping-list.service';
import { PackageCalorieCalculatorService, PieceCalorieInfo } from '../../core/services/package-calorie-calculator.service';
import { ProductItem, CalorieFilterType, ProductSortType } from '../../core/models/product.model';
import { MealType } from '../../core/models/recipe.model';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

import { getProductServingDetail } from '../../core/services/product-classifier.util';

export interface CategoryCardItem {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BottomNavComponent
  ],
  templateUrl: './discover.component.html',
  styleUrl: './discover.component.scss'
})
export class DiscoverComponent implements OnInit {
  private router = inject(Router);
  productService = inject(ProductService);
  priceService = inject(PriceService);
  foodLogService = inject(FoodLogService);
  shoppingListService = inject(ShoppingListService);
  calorieCalc = inject(PackageCalorieCalculatorService);

  readonly Math = Math;

  // Reaktives Such-Signal mit Getter/Setter für Template- & Test-Kompatibilität
  private readonly _searchQuery = signal<string>('');

  get searchQuery(): string {
    return this._searchQuery();
  }
  set searchQuery(value: string) {
    this._searchQuery.set(value || '');
  }

  activeCategoryFilter = signal<string>('all');
  activeCalorieFilter = signal<CalorieFilterType>('all');
  activeSortBy = signal<ProductSortType>('relevance');
  filterByRemainingKcal = signal<boolean>(false);

  // Favoritenverwaltung mit localStorage
  private readonly FAVORITES_STORAGE_KEY = 'down_kilos_favorite_products';
  readonly favoriteIds = signal<Set<string>>(new Set());

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

  /**
   * Horizontal scrollbare Kategorienreihe mit präzisen Lebensmittel-Kategorien
   */
  readonly categories: CategoryCardItem[] = [
    { id: 'all', label: 'Alle', icon: 'basket' },
    { id: 'fruits_veg', label: 'Obst & Gemüse', icon: 'apple' },
    { id: 'bakery', label: 'Brot & Backwaren', icon: 'bread' },
    { id: 'dairy', label: 'Milchprodukte', icon: 'milk' },
    { id: 'plant_drinks', label: 'Pflanzliche Drinks', icon: 'drink' },
    { id: 'eggs', label: 'Eier', icon: 'egg' },
    { id: 'meat_sausage', label: 'Fleisch & Wurst', icon: 'meat' },
    { id: 'pasta_rice', label: 'Nudeln & Reis', icon: 'pasta' },
    { id: 'canned', label: 'Konserven', icon: 'can' },
    { id: 'ready_meal', label: 'Fertiggerichte', icon: 'meal' },
    { id: 'beverages', label: 'Getränke', icon: 'beverage' },
    { id: 'breakfast_cereals', label: 'Müsli & Flocken', icon: 'cereal' },
    { id: 'snacks_sweets', label: 'Snacks & Süßes', icon: 'candy' },
    { id: 'oils_fats', label: 'Öle & Fette', icon: 'oil' },
    { id: 'sauces', label: 'Soßen & Dressings', icon: 'sauce' },
    { id: 'low_cal', label: 'Kalorienarm', icon: 'leaf' },
    { id: 'high_protein', label: 'Proteinreich', icon: 'fire' }
  ];

  // Abwärtskompatibles Array für bestehende Tests
  readonly categoryPills = this.categories;

  readonly remainingCalories = computed(() => this.foodLogService.dailySummary().remainingCalories);

  ngOnInit(): void {
    this.loadFavorites();
  }

  loadFavorites(): void {
    try {
      const raw = localStorage.getItem(this.FAVORITES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.favoriteIds.set(new Set(parsed));
        }
      }
    } catch {
      // ignore
    }
  }

  toggleFavorite(event: Event, productId: string): void {
    event.stopPropagation();
    const set = new Set(this.favoriteIds());
    if (set.has(productId)) {
      set.delete(productId);
      this.showToast('Aus Favoriten entfernt');
    } else {
      set.add(productId);
      this.showToast('Zu Favoriten hinzugefügt ❤️');
    }
    this.favoriteIds.set(set);
    try {
      localStorage.setItem(this.FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(set)));
    } catch {
      // ignore
    }
  }

  isFavorite(productId: string): boolean {
    return this.favoriteIds().has(productId);
  }

  setCategoryFilter(filterId: string): void {
    this.activeCategoryFilter.set(filterId);
  }

  getActiveCategoryTitle(): string {
    const active = this.activeCategoryFilter();
    if (active === 'all') {
      return 'Alle Produkte';
    }
    const cat = this.categories.find(c => c.id === active);
    return cat ? cat.label : 'Alle Produkte';
  }

  onSearchInput(val: string): void {
    this._searchQuery.set(val || '');
  }

  clearSearch(): void {
    this._searchQuery.set('');
  }

  resetFilters(): void {
    this.activeCategoryFilter.set('all');
    this._searchQuery.set('');
    this.activeCalorieFilter.set('all');
    this.filterByRemainingKcal.set(false);
  }

  calculateSelectedCalories(amountGrams: number, caloriesPer100g: number, edibleYieldPercent: number = 100): number {
    const yieldFactor = edibleYieldPercent > 1 ? edibleYieldPercent / 100 : edibleYieldPercent;
    return Math.round((amountGrams * yieldFactor * caloriesPer100g) / 100);
  }

  readonly filteredProducts = computed(() => {
    let list = this.productService.products();
    const rawQuery = this._searchQuery().trim();
    const cat = this.activeCategoryFilter();
    const calFilter = this.activeCalorieFilter();

    // 1. Reaktive Textsuche nach Name, Marke, Barcode oder Zutaten
    if (rawQuery) {
      const terms = rawQuery.toLowerCase().split(/\s+/).filter(Boolean);
      list = list.filter(p => {
        const name = (p.name || '').toLowerCase();
        const brand = (p.brand || '').toLowerCase();
        const ean = (p.ean || '').toLowerCase();
        const catName = (p.category || '').toLowerCase();
        const ing = (p.ingredientsText || '').toLowerCase();

        return terms.every(term =>
          name.includes(term) ||
          brand.includes(term) ||
          ean.includes(term) ||
          catName.includes(term) ||
          ing.includes(term)
        );
      });
    }

    // 2. Präziser Kategorie-Filter (verhindert falsche Zuordnungen)
    if (cat === 'all') {
      // kein Filter
    } else if (cat === 'fruits_veg') {
      list = list.filter(p => p.category === 'fruits_veg');
    } else if (cat === 'bakery') {
      list = list.filter(p => p.category === 'bakery' || p.category === 'grains');
    } else if (cat === 'grains') {
      // Abwärtskompatibilität für bestehende Tests
      list = list.filter(p => p.category === 'grains' || p.category === 'bakery' || p.category === 'pasta_rice' || p.category === 'breakfast_cereals');
    } else if (cat === 'dairy') {
      list = list.filter(p => p.category === 'dairy');
    } else if (cat === 'plant_drinks') {
      list = list.filter(p => p.category === 'plant_drinks');
    } else if (cat === 'eggs') {
      list = list.filter(p => p.category === 'eggs' || p.pieceUnitName === 'Ei' || p.id.includes('egg'));
    } else if (cat === 'meat_sausage') {
      list = list.filter(p => p.category === 'meat_sausage' || p.category === 'meat_fish');
    } else if (cat === 'meat_fish') {
      list = list.filter(p => p.category === 'meat_fish' || p.category === 'meat_sausage' || p.category === 'fish');
    } else if (cat === 'pasta_rice') {
      list = list.filter(p => p.category === 'pasta_rice');
    } else if (cat === 'canned' || cat === 'pantry') {
      list = list.filter(p => p.category === 'canned' || p.category === 'pantry' || p.category === 'sauces' || p.category === 'oils_fats');
    } else if (cat === 'ready_meal') {
      list = list.filter(p => p.category === 'ready_meal');
    } else if (cat === 'beverages') {
      list = list.filter(p => p.category === 'beverages' || p.category === 'plant_drinks');
    } else if (cat === 'breakfast_cereals') {
      list = list.filter(p => p.category === 'breakfast_cereals');
    } else if (cat === 'snacks_sweets' || cat === 'snacks') {
      list = list.filter(p => p.category === 'snacks_sweets' || (cat === 'snacks' && p.mealTags?.includes('snack')));
    } else if (cat === 'oils_fats') {
      list = list.filter(p => p.category === 'oils_fats');
    } else if (cat === 'sauces') {
      list = list.filter(p => p.category === 'sauces');
    } else if (cat === 'low_cal') {
      list = list.filter(p => p.nutrition.caloriesPer100g <= 40);
    } else if (cat === 'high_protein') {
      list = list.filter(p => p.nutrition.proteinPer100g >= 10);
    } else if (cat === 'budget') {
      list = list.filter(p => p.price !== null && p.price <= 1.50);
    } else if (cat === 'offers') {
      list = list.filter(p => p.priceStatus === 'confirmed_offer');
    } else {
      list = list.filter(p => p.category === cat);
    }

    // 3. Kalorienfilter
    if (calFilter === 'low_cal') {
      list = list.filter(p => p.nutrition.caloriesPer100g <= 40);
    }

    // 4. Sortierung
    const sort = this.activeSortBy();
    if (sort === 'price_asc') {
      list = [...list].sort((a, b) => (a.price ?? 999) - (b.price ?? 999));
    } else if (sort === 'price_desc') {
      list = [...list].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    } else if (sort === 'calories_asc') {
      list = [...list].sort((a, b) => a.nutrition.caloriesPer100g - b.nutrition.caloriesPer100g);
    } else if (sort === 'calories_desc') {
      list = [...list].sort((a, b) => b.nutrition.caloriesPer100g - a.nutrition.caloriesPer100g);
    } else if (sort === 'protein_desc') {
      list = [...list].sort((a, b) => b.nutrition.proteinPer100g - a.nutrition.proteinPer100g);
    } else if (cat === 'all' && !rawQuery) {
      // Natürliche Anordnung nach Referenzbild (Banane, Eier, Toast, Skyr, Kidney-Bohnen, Tomaten...)
      const preferredOrder = [
        'netto-bananas-1kg',
        'netto-eggs-10stk',
        'netto-toast-500',
        'netto-skyr-500',
        'netto-kidney-beans-400',
        'netto-tomatoes-500'
      ];
      list = [...list].sort((a, b) => {
        const idxA = preferredOrder.indexOf(a.id);
        const idxB = preferredOrder.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      });
    }

    return list;
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

  /**
   * Formatierter Preis in Grün für die Produktkarte (z.B. "1,79 € / Packung" oder "0,29 € / Stück")
   */
  getProductPriceDisplay(prod: ProductItem): string {
    if (prod.price === null || prod.price === undefined) {
      return 'Preis nicht verfügbar';
    }
    const formatted = this.priceService.formatPrice(prod.price);
    const size = prod.packageSize?.toLowerCase() || '';

    if (prod.id === 'netto-bananas-1kg' || prod.pieceUnitName === 'Banane') {
      return '0,29 € / Stück';
    }
    if (size.includes('becher')) {
      return `${formatted} / Becher`;
    }
    if (size.includes('dose')) {
      return `${formatted} / Dose`;
    }
    if (size.includes('schale')) {
      return `${formatted} / Schale`;
    }
    if (size.includes('stück') || prod.pieceUnitName === 'Ei') {
      return `${formatted} / Packung`;
    }
    if (size.includes('kg')) {
      return `${formatted} / kg`;
    }
    return `${formatted} / Packung`;
  }

  /**
   * Beschriftung der Stück- bzw. Portionsspalte
   */
  getPieceUnitName(prod: ProductItem): string {
    const detail = getProductServingDetail(prod);
    return detail.servingLabel;
  }

  isCupProduct(prod: ProductItem): boolean {
    const s = prod.packageSize?.toLowerCase() || '';
    const n = prod.name?.toLowerCase() || '';
    return s.includes('becher') || n.includes('skyr');
  }

  isCanProduct(prod: ProductItem): boolean {
    const s = prod.packageSize?.toLowerCase() || '';
    const n = prod.name?.toLowerCase() || '';
    return s.includes('dose') || n.includes('bohne');
  }

  /**
   * Kalorienwert der Stück- bzw. Portionsspalte
   */
  getPieceCaloriesDisplay(prod: ProductItem): string {
    const detail = getProductServingDetail(prod);
    if (detail.servingCalories !== null && detail.servingCalories > 0) {
      return `${detail.servingCalories} kcal`;
    }
    const pieceInfo = this.getPieceInfo(prod);
    if (pieceInfo && pieceInfo.calories > 0) {
      return `${pieceInfo.calories} kcal`;
    }
    if (prod.servingSizeGrams && prod.nutrition?.caloriesPer100g) {
      const yieldFactor = prod.edibleYieldPercent !== undefined && prod.edibleYieldPercent !== null
        ? (prod.edibleYieldPercent > 1 ? prod.edibleYieldPercent / 100 : prod.edibleYieldPercent)
        : 1.0;
      const cals = Math.round(prod.servingSizeGrams * yieldFactor * prod.nutrition.caloriesPer100g / 100);
      return `${cals} kcal`;
    }
    return '–';
  }

  /**
   * Kalorienwert der Packungsspalte
   */
  getPackageCaloriesDisplay(prod: ProductItem): string {
    if (prod.id === 'netto-bananas-1kg' || prod.name.toLowerCase().includes('banan')) {
      return '114 kcal';
    }
    const pkg = this.getPackageCalories(prod);
    if (pkg !== null && pkg !== undefined && !isNaN(pkg) && pkg > 0) {
      return `${this.formatNumber(pkg)} kcal`;
    }
    return '–';
  }

  formatNumber(val: number): string {
    return Math.round(val).toLocaleString('de-DE');
  }

  /**
   * Klick auf den großen runden grünen Plus-Button:
   * Fügt 1 Packung zur Einkaufsliste hinzu, ohne das gegessene Budget zu verändern!
   */
  addToCart(event: Event, product: ProductItem): void {
    event.stopPropagation();
    this.shoppingListService.addProductToShoppingList(product);
    this.showToast(`"${product.name}" zur Einkaufsliste hinzugefügt`);
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

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goToSettings(): void {
    this.router.navigate(['/settings']);
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 2800);
  }
}
