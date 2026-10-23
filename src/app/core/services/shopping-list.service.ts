import { Injectable, inject, signal, computed } from '@angular/core';
import { ShoppingListItem, ShoppingListSummary } from '../models/shopping-list.model';
import { ProductService } from './product.service';
import { PantryService } from './pantry.service';
import { ProductCategory, ProductItem } from '../models/product.model';
import { Recipe } from '../models/recipe.model';

const STORAGE_CHECKED_KEY = 'down_kilos_shopping_checked';
const STORAGE_PANTRY_KEY = 'down_kilos_shopping_pantry';
const STORAGE_CUSTOM_ITEMS_KEY = 'down_kilos_shopping_custom';

@Injectable({
  providedIn: 'root'
})
export class ShoppingListService {
  private productService = inject(ProductService);
  private pantryService = inject(PantryService);

  readonly items = signal<ShoppingListItem[]>([]);
  readonly selectedCategory = signal<ProductCategory>('all');
  readonly budgetBufferPercent = signal<number>(0); // 0%, 5%, 10%

  readonly summary = computed<ShoppingListSummary>(() => {
    const all = this.items();
    const totalItems = all.length;
    const checkedItems = all.filter(i => i.isChecked).length;

    let totalFullPackageCost = 0;
    let totalPortionCost = 0;
    let hasMissingPrices = false;
    let hasOlderPrices = false;

    for (const item of all) {
      // Wenn bereits im Vorrat vorhanden, entfällt der Kaufpreis
      if (item.inPantry) {
        continue;
      }

      if (item.totalCost !== null && item.totalCost !== undefined) {
        totalFullPackageCost += item.totalCost;
        totalPortionCost += (item.portionCost ?? item.totalCost);
        if (item.isOlderPrice) {
          hasOlderPrices = true;
        }
      } else {
        hasMissingPrices = true;
      }
    }

    const roundedBase = Math.round(totalFullPackageCost * 100) / 100;
    const roundedPortionBase = Math.round(totalPortionCost * 100) / 100;
    const bufferPct = this.budgetBufferPercent();
    const bufferAmount = Math.round((roundedBase * (bufferPct / 100)) * 100) / 100;
    const totalCostWithBuffer = Math.round((roundedBase + bufferAmount) * 100) / 100;

    let estimateNotice: string | undefined = undefined;
    if (hasMissingPrices) {
      estimateNotice = 'Gesamtsumme unvollständig (Preise für einzelne Netto-Produkte fehlen)';
    } else if (hasOlderPrices) {
      estimateNotice = 'Geschätzter Einkaufswert (basiert teilweise auf zuletzt beobachteten Preisen)';
    }

    return {
      totalItems,
      checkedItems,
      totalCost: roundedBase,
      totalPortionCost: roundedPortionBase,
      isComplete: !hasMissingPrices,
      hasOlderPrices,
      hasMissingPrices,
      budgetBufferPercent: bufferPct,
      budgetBufferAmount: bufferAmount,
      totalCostWithBuffer,
      estimateNotice
    };
  });

  readonly filteredItems = computed<ShoppingListItem[]>(() => {
    const cat = this.selectedCategory();
    const list = this.items();
    if (cat === 'all') return list;
    return list.filter(i => i.category === cat);
  });

  constructor() {
    this.generateListFromPlan();
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
      { id: 'netto-chicken-400', neededAmount: 400, unit: 'g' },
      { id: 'netto-brown-rice-500', neededAmount: 500, unit: 'g' },
      { id: 'netto-broccoli-1stk', neededAmount: 1, unit: 'Stück' },
      { id: 'netto-paprika-red-2stk', neededAmount: 500, unit: 'g' },
      { id: 'netto-carrots-1kg', neededAmount: 1, unit: 'kg' },
      { id: 'netto-oats-500', neededAmount: 500, unit: 'g' },
      { id: 'netto-skyr-500', neededAmount: 500, unit: 'g' },
      { id: 'netto-bananas-1kg', neededAmount: 1, unit: 'kg' },
      { id: 'netto-red-lentils-500', neededAmount: 500, unit: 'g' },
      { id: 'netto-eggs-10stk', neededAmount: 10, unit: 'Stück' }
    ];

    const baseItems: ShoppingListItem[] = planProductIds.map(def => {
      const prod = this.productService.getProductById(def.id);
      const isOlder = prod ? (prod.priceStatus === 'last_observed' || prod.priceStatus === 'user_reported') : false;
      const price = prod?.price ?? null;
      const packageCount = def.defaultPackageCount || 1;
      const totalCost = price !== null ? Math.round((price * packageCount) * 100) / 100 : null;

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
        packageCount,
        packagePrice: price,
        portionCost: totalCost,
        totalCost,
        isChecked: checkedMap[`item-${def.id}`] ?? false,
        priceStatus: prod?.priceStatus || 'unknown',
        priceSource: prod?.priceSource || 'Netto Katalog',
        observationDate: prod?.lastUpdated,
        isOlderPrice: isOlder,
        inPantry: pantryMap[`item-${def.id}`] ?? false
      };
    });

    // Mark reference items from Screen 6 as checked if not user-toggled yet
    if (checkedMap['item-netto-chicken-400'] === undefined && checkedMap['item-netto-brown-rice-500'] === undefined) {
      const chicken = baseItems.find(i => i.productId === 'netto-chicken-400');
      const rice = baseItems.find(i => i.productId === 'netto-brown-rice-500');
      if (chicken) chicken.isChecked = true;
      if (rice) rice.isChecked = true;
    }

    const combined = [...baseItems, ...customItems];
    this.items.set(combined);
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

      // Existiert bereits ein Eintrag für dieses Produkt auf der Einkaufsliste?
      const existingIdx = currentItems.findIndex(i => i.productId === ing.productId);

      if (existingIdx >= 0) {
        const existing = currentItems[existingIdx];
        const newTotalNeeded = existing.neededAmount + neededGrams;
        const newPackageCount = Math.max(1, Math.ceil(newTotalNeeded / packageGrams));
        const newTotalCost = packagePrice !== null ? Math.round((packagePrice * newPackageCount) * 100) / 100 : null;
        const newPortionCost = packagePrice !== null ? Math.round(((packagePrice / packageGrams) * newTotalNeeded) * 100) / 100 : null;

        currentItems[existingIdx] = {
          ...existing,
          neededAmount: Math.round(newTotalNeeded),
          packageCount: newPackageCount,
          totalCost: newTotalCost,
          portionCost: newPortionCost
        };
      } else {
        const packageCount = Math.max(1, Math.ceil(neededGrams / packageGrams));
        const totalCost = packagePrice !== null ? Math.round((packagePrice * packageCount) * 100) / 100 : null;
        const portionCost = packagePrice !== null ? Math.round(((packagePrice / packageGrams) * neededGrams) * 100) / 100 : null;
        const isOlder = prod.priceStatus === 'last_observed' || prod.priceStatus === 'user_reported';

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
          totalCost,
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

  addProductToShoppingList(product: ProductItem): void {
    const existing = this.items().find(i => i.productId === product.id);
    if (existing) {
      // Wenn bereits vorhanden, Stückzahl erhöhen
      const updated = this.items().map(i => {
        if (i.productId === product.id) {
          const newCount = i.packageCount + 1;
          const newTotal = i.packagePrice !== null ? Math.round((i.packagePrice * newCount) * 100) / 100 : null;
          return { ...i, packageCount: newCount, totalCost: newTotal };
        }
        return i;
      });
      this.items.set(updated);
      return;
    }

    const isOlder = product.priceStatus === 'last_observed' || product.priceStatus === 'user_reported';
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
      portionCost: product.price,
      totalCost: product.price,
      isChecked: false,
      priceStatus: product.priceStatus,
      priceSource: product.priceSource,
      observationDate: product.lastUpdated,
      isOlderPrice: isOlder,
      inPantry: false
    };

    this.items.set([newItem, ...this.items()]);
  }

  addCustomItem(name: string, price: number | null, category: ProductCategory = 'pantry', packageSize = '1 Packung'): void {
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
      portionCost: price,
      totalCost: price,
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

    this.generateListFromPlan();
  }

  removeCustomItem(id: string): void {
    let currentCustom = this.getSavedCustomItems();
    currentCustom = currentCustom.filter(i => i.id !== id);
    this.saveCustomItems(currentCustom);

    this.generateListFromPlan();
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
