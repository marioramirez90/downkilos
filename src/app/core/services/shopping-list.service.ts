import { Injectable, inject, signal, computed } from '@angular/core';
import { ShoppingListItem, ShoppingListSummary } from '../models/shopping-list.model';
import { ProductService } from './product.service';
import { PantryService } from './pantry.service';
import { PackageCalorieCalculatorService } from './package-calorie-calculator.service';
import { ProductCategory, ProductItem } from '../models/product.model';
import { Recipe, DayPlan } from '../models/recipe.model';

const STORAGE_ITEMS_KEY = 'down_kilos_shopping_items';
const STORAGE_PLAN_ITEMS_KEY = 'down_kilos_shopping_plan_items';
const STORAGE_MANUAL_ITEMS_KEY = 'down_kilos_shopping_manual_items';
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

  /**
   * Phase 9: Getrennte Verwaltung von Wochenplan-Bedarf und manuell hinzugefügten Artikeln.
   * Dadurch können Wochenpläne jederzeit neu berechnet oder Mahlzeiten gelöscht werden,
   * ohne dass manuell hinzugefügte Einkaufslistenpositionen verloren gehen.
   */
  readonly planItems = signal<ShoppingListItem[]>([]);
  readonly manualItems = signal<ShoppingListItem[]>([]);
  readonly items = signal<ShoppingListItem[]>([]);

  readonly selectedCategory = signal<ProductCategory>('all');
  readonly originFilter = signal<'all' | 'plan' | 'manual'>('all');
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
    const origin = this.originFilter();
    let list = this.items();

    if (cat !== 'all') {
      list = list.filter(i => i.category === cat);
    }

    if (origin === 'plan') {
      list = list.filter(i => i.source === 'plan' || i.source === 'both');
    } else if (origin === 'manual') {
      list = list.filter(i => i.source === 'manual' || i.source === 'both');
    }

    return list;
  });

  constructor() {
    this.loadSavedItems();
  }

  loadSavedItems(): void {
    try {
      const rawPlan = localStorage.getItem(STORAGE_PLAN_ITEMS_KEY);
      const rawManual = localStorage.getItem(STORAGE_MANUAL_ITEMS_KEY);
      const rawCustom = localStorage.getItem(STORAGE_CUSTOM_ITEMS_KEY);
      const rawCombined = localStorage.getItem(STORAGE_ITEMS_KEY);

      let loadedPlan: ShoppingListItem[] = [];
      let loadedManual: ShoppingListItem[] = [];

      if (rawPlan) {
        loadedPlan = JSON.parse(rawPlan);
      }
      if (rawManual) {
        loadedManual = JSON.parse(rawManual);
      } else if (rawCustom) {
        loadedManual = JSON.parse(rawCustom);
      } else if (rawCombined) {
        // Migration aus älterer Einzelliste
        const oldList = JSON.parse(rawCombined);
        if (Array.isArray(oldList)) {
          loadedManual = oldList.filter(i => i.isCustom || i.source === 'manual');
          loadedPlan = oldList.filter(i => !i.isCustom && i.source !== 'manual');
        }
      }

      this.planItems.set(Array.isArray(loadedPlan) ? loadedPlan : []);
      this.manualItems.set(Array.isArray(loadedManual) ? loadedManual : []);
      this.recalculateCombinedList();
      return;
    } catch {
      // ignore
    }

    // STRICT REQUIREMENT: Startet komplett leer für Neukunden
    this.planItems.set([]);
    this.manualItems.set([]);
    this.items.set([]);
  }

  private saveAll(): void {
    this.saveItems(this.items());
    this.savePlanItems(this.planItems());
    this.saveManualItems(this.manualItems());
  }

  saveItems(list: ShoppingListItem[]): void {
    try {
      localStorage.setItem(STORAGE_ITEMS_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  savePlanItems(list: ShoppingListItem[]): void {
    try {
      localStorage.setItem(STORAGE_PLAN_ITEMS_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  saveManualItems(list: ShoppingListItem[]): void {
    try {
      localStorage.setItem(STORAGE_MANUAL_ITEMS_KEY, JSON.stringify(list));
      localStorage.setItem(STORAGE_CUSTOM_ITEMS_KEY, JSON.stringify(list.filter(i => i.isCustom)));
    } catch {
      // ignore
    }
  }

  clearAllItems(): void {
    this.planItems.set([]);
    this.manualItems.set([]);
    this.items.set([]);
    this.saveAll();
  }

  clearPlanItems(): void {
    this.planItems.set([]);
    this.recalculateCombinedList();
  }

  setBudgetBuffer(percent: number): void {
    this.budgetBufferPercent.set(percent);
  }

  /**
   * Intelligente Zusammenführung von Wochenplan-Bedarf und manuell hinzugefügten Artikeln (Phase 9):
   * - Wenn ein Produkt sowohl im Wochenplan als auch manuell aufgeführt ist, wird es als EIN Artikel
   *   mit Quelle 'both' und summierter Packungsanzahl dargestellt.
   * - Beim Entfernen oder Neugenerieren von Rezepten im Wochenplan bleiben alle manuellen Artikel
   *   vollständig erhalten.
   * - Abgehakte Zustände (isChecked) bleiben stets erhalten.
   */
  recalculateCombinedList(): void {
    const pItems = this.planItems();
    const mItems = this.manualItems();
    const checkedMap = this.getSavedCheckedMap();
    const pantryMap = this.getSavedPantryMap();

    const mergedList: ShoppingListItem[] = [];
    const usedManualIds = new Set<string>();

    for (const planItem of pItems) {
      const manualMatch = mItems.find(m =>
        (planItem.productId && m.productId === planItem.productId) ||
        (m.id === planItem.id) ||
        (!planItem.productId && m.name.toLowerCase().trim() === planItem.name.toLowerCase().trim())
      );

      if (manualMatch) {
        usedManualIds.add(manualMatch.id);
        const planCount = planItem.packageCount || 1;
        const manualCount = manualMatch.packageCount || 1;
        const totalCount = planCount + manualCount;

        const price = planItem.packagePrice ?? manualMatch.packagePrice;
        const packCal = planItem.packageCalories ?? manualMatch.packageCalories;
        const totals = this.calorieCalc.calculateItemTotals(price, totalCount, packCal);

        mergedList.push({
          ...planItem,
          source: 'both',
          planPackageCount: planCount,
          manualPackageCount: manualCount,
          packageCount: totalCount,
          totalCost: totals.totalCostEuro,
          totalCalories: totals.totalCalories,
          isChecked: checkedMap[planItem.id] ?? (manualMatch.isChecked || planItem.isChecked),
          inPantry: pantryMap[planItem.id] ?? (manualMatch.inPantry || planItem.inPantry)
        });
      } else {
        mergedList.push({
          ...planItem,
          source: 'plan',
          planPackageCount: planItem.packageCount,
          manualPackageCount: 0,
          isChecked: checkedMap[planItem.id] ?? planItem.isChecked,
          inPantry: pantryMap[planItem.id] ?? planItem.inPantry
        });
      }
    }

    for (const manualItem of mItems) {
      if (!usedManualIds.has(manualItem.id)) {
        mergedList.push({
          ...manualItem,
          source: 'manual',
          planPackageCount: 0,
          manualPackageCount: manualItem.packageCount,
          isChecked: checkedMap[manualItem.id] ?? manualItem.isChecked,
          inPantry: pantryMap[manualItem.id] ?? manualItem.inPantry
        });
      }
    }

    this.items.set(mergedList);
    this.saveAll();
  }

  /**
   * Phase 9: Synchronisiert die Einkaufsliste automatisch mit dem 7-Tage-Wochenplan.
   * Aggregiert Zutaten aller aktiven Mahlzeiten, berechnet ganze Verpackungseinheiten
   * und behält manuell hinzugefügte Artikel unberührt bei.
   */
  syncWithWeeklyPlan(plan: DayPlan[]): void {
    const pantryItems = this.pantryService.items();
    const checkedMap = this.getSavedCheckedMap();
    const pantryMap = this.getSavedPantryMap();

    const aggregatedMap = new Map<string, {
      productId?: string;
      name: string;
      category?: ProductCategory;
      amount: number;
      unit: string;
      portionCost: number;
      packagePrice: number | null;
      packageSize: string;
      imageUrl: string;
    }>();

    for (const day of plan) {
      const sel = day.selectedMeals || { breakfast: true, lunch: true, dinner: true, snack: false };
      const portions = day.portions || { breakfast: 1, lunch: 1, dinner: 1, snack: 1 };
      const slots: Array<'breakfast' | 'lunch' | 'dinner' | 'snack'> = ['breakfast', 'lunch', 'dinner', 'snack'];

      for (const slot of slots) {
        if (sel[slot] && day[slot]) {
          const p = portions[slot] ?? 1;
          for (const ing of day[slot].ingredients) {
            const nameLower = ing.name.toLowerCase();
            const key = ing.productId || nameLower.trim();

            let img = 'images/products/rice.jpg';
            if (nameLower.includes('banan')) img = 'images/products/bananas.jpg';
            else if (nameLower.includes('hafer')) img = 'images/products/oats.jpg';
            else if (nameLower.includes('milch')) img = 'images/products/milk.jpg';
            else if (nameLower.includes('toast') || nameLower.includes('brot')) img = 'images/products/toast.jpg';
            else if (nameLower.includes('ei') && !nameLower.includes('reis')) img = 'images/products/eggs.jpg';
            else if (nameLower.includes('chicken') || nameLower.includes('hähnchen')) img = 'images/products/chicken.jpg';
            else if (nameLower.includes('brokkoli') || nameLower.includes('broccoli')) img = 'images/products/broccoli.jpg';
            else if (nameLower.includes('möhre') || nameLower.includes('karotte')) img = 'images/products/carrots.jpg';
            else if (nameLower.includes('paprika')) img = 'images/products/paprika.jpg';
            else if (nameLower.includes('skyr') || nameLower.includes('quark')) img = 'images/products/skyr.jpg';

            const ingAmount = ing.amount * p;
            const ingPortionCost = (ing.portionCost || 0) * p;

            const existing = aggregatedMap.get(key);
            if (existing) {
              existing.amount += ingAmount;
              existing.portionCost += ingPortionCost;
            } else {
              let displayName = ing.name;
              if (nameLower.includes('banane')) displayName = 'Bananen';
              else if (nameLower.includes('haferflocke')) displayName = 'Haferflocken';
              else if (nameLower.includes('milch')) displayName = 'Milch';
              else if (nameLower.includes('toast') || nameLower.includes('vollkornbrot')) displayName = 'Vollkornbrot';
              else if (nameLower.includes('ei') && !nameLower.includes('reis')) displayName = 'Eier';
              else if (nameLower.includes('reis')) displayName = 'Reis';

              aggregatedMap.set(key, {
                productId: ing.productId,
                name: displayName,
                amount: ingAmount,
                unit: ing.unit,
                portionCost: ingPortionCost,
                packagePrice: ing.packagePrice ?? null,
                packageSize: ing.packageSize || `${ing.amount} ${ing.unit}`,
                imageUrl: img
              });
            }
          }
        }
      }
    }

    const newPlanItems: ShoppingListItem[] = [];

    aggregatedMap.forEach((val, key) => {
      const prod = val.productId ? this.productService.getProductById(val.productId) : undefined;
      const packageGrams = prod?.packageWeightGrams || (val.unit === 'kg' ? 1000 : (val.name === 'Milch' ? 1000 : 500));
      const packagePrice = prod?.price ?? val.packagePrice;
      const piecesPerPackage = prod?.piecesPerPackage || (val.name === 'Eier' ? 10 : (val.name === 'Bananen' ? 7 : 1));

      const inPantryItem = pantryItems.find(pi => pi.productId === val.productId || pi.name.toLowerCase() === val.name.toLowerCase());
      const pantryAmount = inPantryItem ? inPantryItem.remainingQuantityGrams : 0;
      const effectiveNeeded = Math.max(0, val.amount - pantryAmount);

      let packageCount = 0;
      let surplusAmount = 0;

      if (effectiveNeeded > 0) {
        if (val.unit === 'Stück') {
          packageCount = Math.max(1, Math.ceil(effectiveNeeded / piecesPerPackage));
          surplusAmount = (packageCount * piecesPerPackage) - effectiveNeeded;
        } else if (val.unit === 'ml') {
          packageCount = Math.max(1, Math.ceil(effectiveNeeded / packageGrams));
          surplusAmount = (packageCount * packageGrams) - effectiveNeeded;
        } else {
          packageCount = Math.max(1, Math.ceil(effectiveNeeded / packageGrams));
          surplusAmount = (packageCount * packageGrams) - effectiveNeeded;
        }
      }

      const packCalories = prod ? this.calorieCalc.calculatePackageCalories(prod) : null;
      const pieceInfo = prod ? this.calorieCalc.calculatePieceCalories(prod) : null;
      const itemTotals = this.calorieCalc.calculateItemTotals(packagePrice, packageCount, packCalories);
      const isOlder = prod ? (prod.priceStatus === 'last_observed' || prod.priceStatus === 'user_reported') : false;

      const surplusText = surplusAmount > 0 ? `${Math.round(surplusAmount)} ${val.unit} Rest` : undefined;

      const itemId = `item-${val.productId || key}`;
      newPlanItems.push({
        id: itemId,
        productId: val.productId,
        ean: prod?.ean,
        name: prod?.name || val.name,
        brand: prod?.brand,
        category: prod?.category || 'fruits_veg',
        imageUrl: prod?.imageUrl || val.imageUrl,
        neededAmount: Math.round(val.amount),
        neededUnit: val.unit,
        packageSize: prod?.packageSize || val.packageSize,
        packageWeightGrams: packageGrams,
        piecesPerPackage,
        packageCount,
        packagePrice,
        portionCost: Math.round(val.portionCost * 100) / 100,
        totalCost: itemTotals.totalCostEuro,
        packageCalories: packCalories,
        totalCalories: itemTotals.totalCalories,
        caloriesPer100g: prod?.nutrition?.caloriesPer100g ?? null,
        caloriesPerPiece: pieceInfo?.calories ?? null,
        pieceUnitName: pieceInfo?.unitName ?? prod?.pieceUnitName,
        isChecked: checkedMap[itemId] ?? false,
        priceStatus: prod?.priceStatus || 'unknown',
        priceSource: prod?.priceSource || 'Netto Katalog',
        observationDate: prod?.lastUpdated,
        isOlderPrice: isOlder,
        inPantry: pantryMap[itemId] ?? false,
        source: 'plan',
        planPackageCount: packageCount,
        manualPackageCount: 0,
        surplusText
      });
    });

    this.planItems.set(newPlanItems);
    this.savePlanItems(newPlanItems);
    this.recalculateCombinedList();
  }

  generateListFromPlan(): void {
    const checkedMap = this.getSavedCheckedMap();
    const pantryMap = this.getSavedPantryMap();

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
        inPantry: pantryMap[`item-${def.id}`] ?? false,
        source: 'plan',
        planPackageCount: packageCount,
        manualPackageCount: 0
      };
    });

    this.planItems.set(baseItems);
    this.recalculateCombinedList();
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
        isChecked: false,
        source: 'plan',
        planPackageCount: 1
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
        isChecked: false,
        source: 'plan',
        planPackageCount: 1
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
        isChecked: false,
        source: 'plan',
        planPackageCount: 1
      }
    ];

    this.planItems.set(list);
    this.recalculateCombinedList();
  }

  addRecipeIngredients(recipe: Recipe, servings: number = 1): void {
    const current = [...this.planItems()];

    for (const ing of recipe.ingredients) {
      if (!ing.productId) continue;

      const prod = this.productService.getProductById(ing.productId);
      if (!prod) continue;

      const neededGrams = ing.amount * (servings / (recipe.defaultServings || 1));
      const packageGrams = prod.packageWeightGrams || 500;
      const packagePrice = prod.price;
      const packCalories = this.calorieCalc.calculatePackageCalories(prod);

      const existingIdx = current.findIndex(i => i.productId === ing.productId);

      if (existingIdx >= 0) {
        const existing = current[existingIdx];
        const newTotalNeeded = existing.neededAmount + neededGrams;
        const newPackageCount = Math.max(1, Math.ceil(newTotalNeeded / packageGrams));
        const itemTotals = this.calorieCalc.calculateItemTotals(packagePrice, newPackageCount, packCalories);
        const newPortionCost = packagePrice !== null
          ? Math.round(((packagePrice / packageGrams) * newTotalNeeded) * 100) / 100
          : null;

        current[existingIdx] = {
          ...existing,
          neededAmount: Math.round(newTotalNeeded),
          packageCount: newPackageCount,
          planPackageCount: newPackageCount,
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
          planPackageCount: packageCount,
          manualPackageCount: 0,
          source: 'plan',
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

        current.unshift(newItem);
      }
    }

    this.planItems.set(current);
    this.recalculateCombinedList();
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

  updatePackageCount(id: string, delta: number): void {
    const currentCombined = this.items();
    const item = currentCombined.find(i => i.id === id);
    if (!item) return;

    if (item.source === 'both') {
      const currentManual = [...this.manualItems()];
      const mIdx = currentManual.findIndex(m => m.id === id || m.productId === item.productId);
      if (mIdx >= 0) {
        const newMCount = (currentManual[mIdx].packageCount || 1) + delta;
        if (newMCount <= 0) {
          currentManual.splice(mIdx, 1);
        } else {
          currentManual[mIdx] = {
            ...currentManual[mIdx],
            packageCount: newMCount,
            manualPackageCount: newMCount
          };
        }
        this.manualItems.set(currentManual);
        this.saveManualItems(currentManual);
      }
    } else if (item.source === 'manual') {
      const currentManual = [...this.manualItems()];
      const mIdx = currentManual.findIndex(m => m.id === id || m.productId === item.productId);
      if (mIdx >= 0) {
        const newCount = Math.max(1, currentManual[mIdx].packageCount + delta);
        currentManual[mIdx] = {
          ...currentManual[mIdx],
          packageCount: newCount,
          manualPackageCount: newCount
        };
        this.manualItems.set(currentManual);
        this.saveManualItems(currentManual);
      }
    } else {
      // source === 'plan'
      if (delta > 0) {
        // Erhöhe über den Wochenplan hinaus -> fügt ein manuelles Paket hinzu
        const newItem: ShoppingListItem = {
          ...item,
          id: `manual-extra-${item.productId || item.id}`,
          packageCount: delta,
          manualPackageCount: delta,
          planPackageCount: 0,
          source: 'manual'
        };
        const currentManual = [...this.manualItems(), newItem];
        this.manualItems.set(currentManual);
        this.saveManualItems(currentManual);
      } else {
        const currentPlan = [...this.planItems()];
        const pIdx = currentPlan.findIndex(p => p.id === id);
        if (pIdx >= 0) {
          const newCount = Math.max(1, currentPlan[pIdx].packageCount + delta);
          currentPlan[pIdx] = {
            ...currentPlan[pIdx],
            packageCount: newCount,
            planPackageCount: newCount
          };
          this.planItems.set(currentPlan);
          this.savePlanItems(currentPlan);
        }
      }
    }

    this.recalculateCombinedList();
  }

  removeItem(id: string): void {
    const remainingManual = this.manualItems().filter(i => i.id !== id && i.productId !== id && `item-${i.productId}` !== id);
    this.manualItems.set(remainingManual);
    this.saveManualItems(remainingManual);

    const remainingPlan = this.planItems().filter(i => i.id !== id && i.productId !== id);
    this.planItems.set(remainingPlan);
    this.savePlanItems(remainingPlan);

    if (id.startsWith('custom-')) {
      this.removeCustomItem(id);
    }

    this.recalculateCombinedList();
  }

  addProductToShoppingList(product: ProductItem): void {
    const currentManual = [...this.manualItems()];
    const existingIdx = currentManual.findIndex(i => i.productId === product.id);

    if (existingIdx >= 0) {
      const newCount = currentManual[existingIdx].packageCount + 1;
      const packCalories = currentManual[existingIdx].packageCalories;
      const totals = this.calorieCalc.calculateItemTotals(currentManual[existingIdx].packagePrice, newCount, packCalories);

      currentManual[existingIdx] = {
        ...currentManual[existingIdx],
        packageCount: newCount,
        manualPackageCount: newCount,
        totalCost: totals.totalCostEuro,
        totalCalories: totals.totalCalories
      };
    } else {
      const isOlder = product.priceStatus === 'last_observed' || product.priceStatus === 'user_reported';
      const packCalories = this.calorieCalc.calculatePackageCalories(product);
      const pieceInfo = this.calorieCalc.calculatePieceCalories(product);
      const itemTotals = this.calorieCalc.calculateItemTotals(product.price, 1, packCalories);

      const newItem: ShoppingListItem = {
        id: `manual-item-${product.id}`,
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
        manualPackageCount: 1,
        planPackageCount: 0,
        source: 'manual',
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
      currentManual.push(newItem);
    }

    this.manualItems.set(currentManual);
    this.saveManualItems(currentManual);
    this.recalculateCombinedList();
  }

  addCustomItem(name: string, price: number | null, category: ProductCategory = 'pantry', packageSize = '1 Packung', packageCalories: number | null = null): void {
    const itemTotals = this.calorieCalc.calculateItemTotals(price, 1, packageCalories);

    const newItem: ShoppingListItem = {
      id: `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name.trim(),
      category,
      imageUrl: 'images/products/oats.jpg',
      neededAmount: 1,
      neededUnit: 'Stück',
      packageSize,
      packageWeightGrams: 500,
      packageCount: 1,
      manualPackageCount: 1,
      planPackageCount: 0,
      source: 'manual',
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

    const currentManual = [...this.manualItems(), newItem];
    this.manualItems.set(currentManual);
    this.saveManualItems(currentManual);
    this.recalculateCombinedList();
  }

  removeCustomItem(id: string): void {
    const remaining = this.manualItems().filter(i => i.id !== id);
    this.manualItems.set(remaining);
    this.saveManualItems(remaining);
    this.recalculateCombinedList();
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
}
