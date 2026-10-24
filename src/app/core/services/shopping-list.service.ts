import { Injectable, inject, signal, computed } from '@angular/core';
import { ShoppingListItem, ShoppingListSummary } from '../models/shopping-list.model';
import { ProductService } from './product.service';
import { PantryService } from './pantry.service';
import { PackageCalorieCalculatorService } from './package-calorie-calculator.service';
import { ProductCategory, ProductItem } from '../models/product.model';
import { Recipe } from '../models/recipe.model';

const STORAGE_ITEMS_KEY = 'down_kilos_shopping_items';
const STORAGE_CHECKED_KEY = 'down_kilos_shopping_checked';
const STORAGE_PANTRY_KEY = 'down_kilos_shopping_pantry';
const STORAGE_CUSTOM_ITEMS_KEY = 'down_kilos_shopping_custom';

@Injectable({
  providedIn: 'root'
})
export class ShoppingListService {
  private productService = inject(ProductService);
  private pantryService = inject(PantryService);
  private calorieCalc = inject(PackageCalorieCalculatorService);

  readonly items = signal<ShoppingListItem[]>([]);
  readonly selectedCategory = signal<ProductCategory>('all');
  readonly budgetBufferPercent = signal<number>(0); // 0%, 5%, 10%

  readonly summary = computed<ShoppingListSummary>(() => {
    const all = this.items();
    const totalItems = all.length;
    const checkedItems = all.filter(i => i.isChecked).length;

    let totalFullPackageCostCents = 0;
    let totalPortionCostCents = 0;
    let totalCaloriesSum = 0;
    let hasMissingPrices = false;
    let hasOlderPrices = false;
    let hasMissingCalories = false;

    for (const item of all) {
      // Wenn bereits im Vorrat vorhanden, entfällt der Kaufpreis & Zukauf-Kalorien
      if (item.inPantry) {
        continue;
      }

      // 1. Euro-Kosten (Berechnung intern in Cent zur Vermeidung von Rundungsfehlern)
      if (item.totalCost !== null && item.totalCost !== undefined) {
        totalFullPackageCostCents += Math.round(item.totalCost * 100);
        const portion = item.portionCost !== null && item.portionCost !== undefined ? item.portionCost : item.totalCost;
        totalPortionCostCents += Math.round(portion * 100);
        if (item.isOlderPrice) {
          hasOlderPrices = true;
        }
      } else {
        hasMissingPrices = true;
      }

      // 2. Gesamtkalorien aller gekauften Packungen
      if (item.totalCalories !== null && item.totalCalories !== undefined) {
        totalCaloriesSum += item.totalCalories;
      } else {
        hasMissingCalories = true;
      }
    }

    const roundedBase = totalFullPackageCostCents / 100;
    const roundedPortionBase = totalPortionCostCents / 100;
    const bufferPct = this.budgetBufferPercent();
    const bufferAmount = Math.round(totalFullPackageCostCents * (bufferPct / 100)) / 100;
    const totalCostWithBuffer = Math.round((roundedBase + bufferAmount) * 100) / 100;

    let estimateNotice: string | undefined = undefined;
    if (hasMissingPrices) {
      estimateNotice = 'Gesamtsumme unvollständig (Preise für einzelne Netto-Produkte fehlen)';
    } else if (hasOlderPrices) {
      estimateNotice = 'Geschätzter Einkaufswert (basiert teilweise auf zuletzt beobachteten Preisen)';
    }

    let caloriesNotice: string | undefined = undefined;
    if (hasMissingCalories) {
      caloriesNotice = 'Kaloriensumme unvollständig (Nährwertdaten für einzelne Artikel fehlen)';
    }

    return {
      totalItems,
      checkedItems,
      totalCost: roundedBase,
      totalPortionCost: roundedPortionBase,
      totalCalories: hasMissingCalories ? (totalCaloriesSum > 0 ? totalCaloriesSum : null) : totalCaloriesSum,
      isComplete: !hasMissingPrices && !hasMissingCalories,
      hasOlderPrices,
      hasMissingPrices,
      hasMissingCalories,
      budgetBufferPercent: bufferPct,
      budgetBufferAmount: bufferAmount,
      totalCostWithBuffer,
      estimateNotice,
      caloriesNotice
    };
  });

  readonly filteredItems = computed<ShoppingListItem[]>(() => {
    const cat = this.selectedCategory();
    const list = this.items();
    if (cat === 'all') return list;
    return list.filter(i => i.category === cat);
  });

  constructor() {
    this.loadSavedItems();
  }

  loadSavedItems(): void {
    try {
      const raw = localStorage.getItem(STORAGE_ITEMS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.items.set(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    // STRICT REQUIREMENT (Section 14): Starts completely empty for new users
    this.items.set([]);
  }

  saveItems(list: ShoppingListItem[]): void {
    try {
      localStorage.setItem(STORAGE_ITEMS_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  clearAllItems(): void {
    this.items.set([]);
    this.saveItems([]);
  }

  setBudgetBuffer(percent: number): void {
    this.budgetBufferPercent.set(percent);
  }

  generateListFromPlan(): void {
    const checkedMap = this.getSavedCheckedMap();
    const pantryMap = this.getSavedPantryMap();
    const customItems = this.getSavedCustomItems();

    // Basis-Bedarf der Mahlzeiten
    const planProductIds: Array<{ id: string; neededAmount: number; unit: string; defaultPackageCount?: number }> = [
      { id: 'netto-toast-500', neededAmount: 500, unit: 'g' },
      { id: 'netto-eggs-10stk', neededAmount: 10, unit: 'Stück' },
      { id: 'netto-bananas-1kg', neededAmount: 1, unit: 'kg' },
      { id: 'netto-chicken-400', neededAmount: 400, unit: 'g' },
      { id: 'netto-brown-rice-500', neededAmount: 500, unit: 'g' },
      { id: 'netto-broccoli-1stk', neededAmount: 1, unit: 'Stück' },
      { id: 'netto-oats-500', neededAmount: 500, unit: 'g' },
      { id: 'netto-skyr-500', neededAmount: 500, unit: 'g' },
      { id: 'netto-kidney-beans-400', neededAmount: 400, unit: 'g' }
    ];

    const baseItems: ShoppingListItem[] = planProductIds.map(def => {
      const prod = this.productService.getProductById(def.id);
      const isOlder = prod ? (prod.priceStatus === 'last_observed' || prod.priceStatus === 'user_reported') : false;
      const price = prod?.price ?? null;
      const packageCount = def.defaultPackageCount || 1;

      const packCalories = prod ? this.calorieCalc.calculatePackageCalories(prod) : null;
      const pieceInfo = prod ? this.calorieCalc.calculatePieceCalories(prod) : null;
      const itemTotals = this.calorieCalc.calculateItemTotals(price, packageCount, packCalories);

      return {
        id: `item-${def.id}`,
        productId: def.id,
        ean: prod?.ean,
        name: prod?.name || def.id,
        brand: prod?.brand,
        category: prod?.category || 'fruits_veg',
        imageUrl: prod?.imageUrl || 'images/products/rice.jpg',
        neededAmount: def.neededAmount,
        neededUnit: def.unit,
        packageSize: prod?.packageSize || `${def.neededAmount} ${def.unit}`,
        packageWeightGrams: prod?.packageWeightGrams || 500,
        piecesPerPackage: prod?.piecesPerPackage,
        packageCount,
        packagePrice: price,
        portionCost: itemTotals.totalCostEuro,
        totalCost: itemTotals.totalCostEuro,
        packageCalories: packCalories,
        totalCalories: itemTotals.totalCalories,
        caloriesPer100g: prod?.nutrition?.caloriesPer100g ?? null,
        caloriesPerPiece: pieceInfo?.calories ?? null,
        pieceUnitName: pieceInfo?.unitName ?? prod?.pieceUnitName,
        isChecked: checkedMap[`item-${def.id}`] ?? false,
        priceStatus: prod?.priceStatus || 'unknown',
        priceSource: prod?.priceSource || 'Netto Katalog',
        observationDate: prod?.lastUpdated,
        isOlderPrice: isOlder,
        inPantry: pantryMap[`item-${def.id}`] ?? false
      };
    });

    const combined = [...baseItems, ...customItems];
    this.items.set(combined);
  }

  loadSampleList(): void {
    const list: ShoppingListItem[] = [
      {
        id: 'item-netto-toast-500',
        productId: 'netto-toast-500',
        ean: '4311501789012',
        name: 'Toastbrot Vollkorn',
        brand: 'Grafschafter',
        category: 'grains',
        imageUrl: 'images/products/toast.jpg',
        neededAmount: 500,
        neededUnit: 'g',
        packageSize: '500 g Packung',
        packageWeightGrams: 500,
        piecesPerPackage: 15,
        packageCount: 1,
        packagePrice: 1.79,
        portionCost: 1.79,
        totalCost: 1.79,
        packageCalories: 1230,
        totalCalories: 1230,
        caloriesPer100g: 246,
        caloriesPerPiece: 82,
        pieceUnitName: 'Scheibe',
        isChecked: false
      },
      {
        id: 'item-netto-eggs-10stk',
        productId: 'netto-eggs-10stk',
        ean: '4311501438204',
        name: 'Eier',
        brand: 'Gut Ponholz',
        category: 'dairy',
        imageUrl: 'images/products/eggs.jpg',
        neededAmount: 10,
        neededUnit: 'Stück',
        packageSize: '10er Packung',
        packageWeightGrams: 530,
        piecesPerPackage: 10,
        packageCount: 1,
        packagePrice: 2.99,
        portionCost: 2.99,
        totalCost: 2.99,
        packageCalories: 780,
        totalCalories: 780,
        caloriesPer100g: 143,
        caloriesPerPiece: 78,
        pieceUnitName: 'Ei',
        isChecked: false
      },
      {
        id: 'item-netto-bananas-1kg',
        productId: 'netto-bananas-1kg',
        ean: '4311501901128',
        name: 'Bananen',
        brand: 'BioBio',
        category: 'fruits_veg',
        imageUrl: 'images/products/bananas.jpg',
        neededAmount: 1,
        neededUnit: 'kg',
        packageSize: '1 kg',
        packageWeightGrams: 1000,
        packageCount: 1,
        packagePrice: 1.69,
        portionCost: 1.69,
        totalCost: 1.69,
        packageCalories: 890,
        totalCalories: 890,
        caloriesPer100g: 89,
        caloriesPerPiece: 95,
        pieceUnitName: 'Banane',
        isChecked: false
      }
    ];
    this.items.set(list);
    this.saveItems(list);
  }

  /**
   * Intelligente Zusammenführung von Rezeptzutaten:
   * Aggregiert identische Produkte über mehrere Rezepte hinweg,
   * zieht bestehende Vorratsmengen ab und kauft nur die tatsächlich benötigten ganzen Packungen!
   */
  addRecipeIngredients(recipe: Recipe, servings: number = 1): void {
    const currentItems = [...this.items()];

    for (const ing of recipe.ingredients) {
      if (!ing.productId) continue;

      const prod = this.productService.getProductById(ing.productId);
      if (!prod) continue;

      const neededGrams = ing.amount * (servings / (recipe.defaultServings || 1));
      const packageGrams = prod.packageWeightGrams || 500;
      const packagePrice = prod.price;
      const packCalories = this.calorieCalc.calculatePackageCalories(prod);

      // Existiert bereits ein Eintrag für dieses Produkt auf der Einkaufsliste?
      const existingIdx = currentItems.findIndex(i => i.productId === ing.productId);

      if (existingIdx >= 0) {
        const existing = currentItems[existingIdx];
        const newTotalNeeded = existing.neededAmount + neededGrams;
        const newPackageCount = Math.max(1, Math.ceil(newTotalNeeded / packageGrams));
        const itemTotals = this.calorieCalc.calculateItemTotals(packagePrice, newPackageCount, packCalories);
        const newPortionCost = packagePrice !== null 
          ? Math.round(((packagePrice / packageGrams) * newTotalNeeded) * 100) / 100 
          : null;

        currentItems[existingIdx] = {
          ...existing,
          neededAmount: Math.round(newTotalNeeded),
          packageCount: newPackageCount,
          totalCost: itemTotals.totalCostEuro,
          portionCost: newPortionCost,
          packageCalories: packCalories,
          totalCalories: itemTotals.totalCalories
        };
      } else {
        const packageCount = Math.max(1, Math.ceil(neededGrams / packageGrams));
        const itemTotals = this.calorieCalc.calculateItemTotals(packagePrice, packageCount, packCalories);
        const portionCost = packagePrice !== null 
          ? Math.round(((packagePrice / packageGrams) * neededGrams) * 100) / 100 
          : null;
        const isOlder = prod.priceStatus === 'last_observed' || prod.priceStatus === 'user_reported';
        const pieceInfo = this.calorieCalc.calculatePieceCalories(prod);

        const newItem: ShoppingListItem = {
          id: `item-${prod.id}`,
          productId: prod.id,
          ean: prod.ean,
          name: prod.name,
          brand: prod.brand,
          category: prod.category,
          imageUrl: prod.imageUrl,
          neededAmount: Math.round(neededGrams),
          neededUnit: ing.unit,
          packageSize: prod.packageSize,
          packageWeightGrams: packageGrams,
          packageCount,
          packagePrice,
          portionCost,
          totalCost: itemTotals.totalCostEuro,
          packageCalories: packCalories,
          totalCalories: itemTotals.totalCalories,
          caloriesPer100g: prod.nutrition?.caloriesPer100g ?? null,
          caloriesPerPiece: pieceInfo?.calories ?? null,
          pieceUnitName: pieceInfo?.unitName ?? prod.pieceUnitName,
          isChecked: false,
          priceStatus: prod.priceStatus,
          priceSource: prod.priceSource,
          observationDate: prod.lastUpdated,
          isOlderPrice: isOlder,
          inPantry: false
        };

        currentItems.unshift(newItem);
      }
    }

    this.items.set(currentItems);
  }

  toggleItemChecked(id: string): void {
    const list = this.items().map(i => {
      if (i.id === id) {
        return { ...i, isChecked: !i.isChecked };
      }
      return i;
    });

    this.items.set(list);
    this.saveCheckedState(list);
  }

  toggleInPantry(id: string): void {
    const list = this.items().map(i => {
      if (i.id === id) {
        return { ...i, inPantry: !i.inPantry };
      }
      return i;
    });

    this.items.set(list);
    this.savePantryState(list);
  }

  /**
   * Ändert die Packungsanzahl (+/-) und aktualisiert sofort Preis in Cent und Gesamtkalorien
   */
  updatePackageCount(id: string, delta: number): void {
    const list = this.items().map(i => {
      if (i.id === id) {
        const newCount = Math.max(1, i.packageCount + delta);
        const itemTotals = this.calorieCalc.calculateItemTotals(i.packagePrice, newCount, i.packageCalories);
        return {
          ...i,
          packageCount: newCount,
          totalCost: itemTotals.totalCostEuro,
          totalCalories: itemTotals.totalCalories
        };
      }
      return i;
    });

    this.items.set(list);
    this.saveItems(list);
  }

  /**
   * Entfernt einen Artikel aus der Einkaufsliste
   */
  removeItem(id: string): void {
    const remaining = this.items().filter(i => i.id !== id);
    this.items.set(remaining);
    this.saveItems(remaining);

    if (id.startsWith('custom-')) {
      this.removeCustomItem(id);
    }
  }

  /**
   * Fügt ein Netto-Produkt aus dem Entdecken-Katalog oder der Produktdetailseite hinzu
   */
  addProductToShoppingList(product: ProductItem): void {
    const existing = this.items().find(i => i.productId === product.id);
    if (existing) {
      // Wenn bereits vorhanden, Packungsanzahl um 1 erhöhen
      this.updatePackageCount(existing.id, 1);
      return;
    }

    const isOlder = product.priceStatus === 'last_observed' || product.priceStatus === 'user_reported';
    const packCalories = this.calorieCalc.calculatePackageCalories(product);
    const pieceInfo = this.calorieCalc.calculatePieceCalories(product);
    const itemTotals = this.calorieCalc.calculateItemTotals(product.price, 1, packCalories);

    const newItem: ShoppingListItem = {
      id: `item-${product.id}`,
      productId: product.id,
      ean: product.ean,
      name: product.name,
      brand: product.brand,
      category: product.category,
      imageUrl: product.imageUrl,
      neededAmount: product.packageWeightGrams,
      neededUnit: 'g',
      packageSize: product.packageSize,
      packageWeightGrams: product.packageWeightGrams,
      packageCount: 1,
      packagePrice: product.price,
      portionCost: itemTotals.totalCostEuro,
      totalCost: itemTotals.totalCostEuro,
      packageCalories: packCalories,
      totalCalories: itemTotals.totalCalories,
      caloriesPer100g: product.nutrition?.caloriesPer100g ?? null,
      caloriesPerPiece: pieceInfo?.calories ?? null,
      pieceUnitName: pieceInfo?.unitName ?? product.pieceUnitName,
      isChecked: false,
      priceStatus: product.priceStatus,
      priceSource: product.priceSource,
      observationDate: product.lastUpdated,
      isOlderPrice: isOlder,
      inPantry: false
    };

    const updated = [newItem, ...this.items()];
    this.items.set(updated);
    this.saveItems(updated);
  }

  addCustomItem(name: string, price: number | null, category: ProductCategory = 'pantry', packageSize = '1 Packung', packageCalories: number | null = null): void {
    const itemTotals = this.calorieCalc.calculateItemTotals(price, 1, packageCalories);

    const newItem: ShoppingListItem = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      category,
      imageUrl: 'images/products/oats.jpg',
      neededAmount: 1,
      neededUnit: 'Stück',
      packageSize,
      packageWeightGrams: 500,
      packageCount: 1,
      packagePrice: price,
      portionCost: itemTotals.totalCostEuro,
      totalCost: itemTotals.totalCostEuro,
      packageCalories: packageCalories,
      totalCalories: itemTotals.totalCalories,
      caloriesPer100g: null,
      caloriesPerPiece: null,
      isChecked: false,
      isCustom: true,
      priceStatus: price !== null ? 'user_reported' : 'unknown',
      priceSource: 'Benutzereingabe',
      observationDate: new Date().toISOString().split('T')[0],
      isOlderPrice: false,
      inPantry: false
    };

    const currentCustom = this.getSavedCustomItems();
    currentCustom.push(newItem);
    this.saveCustomItems(currentCustom);

    const updated = [newItem, ...this.items()];
    this.items.set(updated);
    this.saveItems(updated);
  }

  removeCustomItem(id: string): void {
    let currentCustom = this.getSavedCustomItems();
    currentCustom = currentCustom.filter(i => i.id !== id);
    this.saveCustomItems(currentCustom);
    const updated = this.items().filter(i => i.id !== id);
    this.items.set(updated);
    this.saveItems(updated);
  }

  private saveCheckedState(list: ShoppingListItem[]): void {
    const map: Record<string, boolean> = {};
    for (const item of list) {
      map[item.id] = item.isChecked;
    }
    try {
      localStorage.setItem(STORAGE_CHECKED_KEY, JSON.stringify(map));
    } catch {
      // ignore
    }
  }

  private getSavedCheckedMap(): Record<string, boolean> {
    try {
      const data = localStorage.getItem(STORAGE_CHECKED_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private savePantryState(list: ShoppingListItem[]): void {
    const map: Record<string, boolean> = {};
    for (const item of list) {
      map[item.id] = !!item.inPantry;
    }
    try {
      localStorage.setItem(STORAGE_PANTRY_KEY, JSON.stringify(map));
    } catch {
      // ignore
    }
  }

  private getSavedPantryMap(): Record<string, boolean> {
    try {
      const data = localStorage.getItem(STORAGE_PANTRY_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private saveCustomItems(items: ShoppingListItem[]): void {
    try {
      localStorage.setItem(STORAGE_CUSTOM_ITEMS_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }

  private getSavedCustomItems(): ShoppingListItem[] {
    try {
      const data = localStorage.getItem(STORAGE_CUSTOM_ITEMS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}
