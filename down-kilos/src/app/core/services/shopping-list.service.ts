import { Injectable, inject, signal, computed } from '@angular/core';
import { ShoppingListItem, ShoppingListSummary } from '../models/shopping-list.model';
import { MealPlannerService } from './meal-planner.service';
import { ProductService } from './product.service';
import { ProductCategory } from '../models/product.model';

const STORAGE_CHECKED_KEY = 'down_kilos_shopping_checked';
const STORAGE_CUSTOM_ITEMS_KEY = 'down_kilos_shopping_custom';

@Injectable({
  providedIn: 'root'
})
export class ShoppingListService {
  private plannerService = inject(MealPlannerService);
  private productService = inject(ProductService);

  readonly items = signal<ShoppingListItem[]>([]);
  readonly selectedCategory = signal<ProductCategory>('all');

  readonly summary = computed<ShoppingListSummary>(() => {
    const all = this.items();
    const totalItems = all.length;
    const checkedItems = all.filter(i => i.isChecked).length;

    let totalCost = 0;
    let isComplete = true;

    for (const item of all) {
      if (item.totalCost !== null) {
        totalCost += item.totalCost;
      } else {
        isComplete = false;
      }
    }

    return {
      totalItems,
      checkedItems,
      totalCost: Math.round(totalCost * 100) / 100,
      isComplete
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

  generateListFromPlan(): void {
    const day = this.plannerService.currentDayPlan();
    const checkedMap = this.getSavedCheckedMap();
    const customItems = this.getSavedCustomItems();

    // The staple Netto products matching Screen 6
    const baseItems: ShoppingListItem[] = [
      {
        id: 'item-chicken',
        productId: 'netto-chicken-400',
        name: 'Hähnchenbrustfilet',
        category: 'meat_fish',
        imageUrl: 'images/products/chicken.jpg',
        neededAmount: 400,
        neededUnit: 'g',
        packageSize: '400 g',
        packageCount: 1,
        packagePrice: 2.99,
        totalCost: 2.99,
        isChecked: checkedMap['item-chicken'] ?? true // Checked in reference Screen 6
      },
      {
        id: 'item-rice',
        productId: 'netto-brown-rice-500',
        name: 'Vollkornreis',
        category: 'grains',
        imageUrl: 'images/products/rice.jpg',
        neededAmount: 500,
        neededUnit: 'g',
        packageSize: '500 g',
        packageCount: 1,
        packagePrice: 1.29,
        totalCost: 1.29,
        isChecked: checkedMap['item-rice'] ?? true // Checked in reference Screen 6
      },
      {
        id: 'item-broccoli',
        productId: 'netto-broccoli-1stk',
        name: 'Brokkoli',
        category: 'fruits_veg',
        imageUrl: 'images/products/broccoli.jpg',
        neededAmount: 1,
        neededUnit: 'Stück',
        packageSize: '1 Stück',
        packageCount: 1,
        packagePrice: 1.11,
        totalCost: 1.11,
        isChecked: checkedMap['item-broccoli'] ?? false
      },
      {
        id: 'item-paprika',
        productId: 'netto-paprika-red-2stk',
        name: 'Paprika (rot)',
        category: 'fruits_veg',
        imageUrl: 'images/products/paprika.jpg',
        neededAmount: 2,
        neededUnit: 'Stück',
        packageSize: '2 Stück',
        packageCount: 1,
        packagePrice: 1.98,
        totalCost: 1.98,
        isChecked: checkedMap['item-paprika'] ?? false
      },
      {
        id: 'item-carrots',
        productId: 'netto-carrots-1kg',
        name: 'Karotten',
        category: 'fruits_veg',
        imageUrl: 'images/products/carrots.jpg',
        neededAmount: 1,
        neededUnit: 'kg',
        packageSize: '1 kg',
        packageCount: 1,
        packagePrice: 0.99,
        totalCost: 0.99,
        isChecked: checkedMap['item-carrots'] ?? false
      },
      {
        id: 'item-oats',
        productId: 'netto-oats-500',
        name: 'Haferflocken',
        category: 'grains',
        imageUrl: 'images/products/oats.jpg',
        neededAmount: 500,
        neededUnit: 'g',
        packageSize: '500 g',
        packageCount: 1,
        packagePrice: 0.89,
        totalCost: 0.89,
        isChecked: checkedMap['item-oats'] ?? false
      },
      {
        id: 'item-skyr',
        productId: 'netto-skyr-500',
        name: 'Skyr Natur',
        category: 'dairy',
        imageUrl: 'images/products/skyr.jpg',
        neededAmount: 500,
        neededUnit: 'g',
        packageSize: '500 g',
        packageCount: 1,
        packagePrice: 1.19,
        totalCost: 1.19,
        isChecked: checkedMap['item-skyr'] ?? false
      },
      {
        id: 'item-bananas',
        productId: 'netto-bananas-1kg',
        name: 'Bananen',
        category: 'fruits_veg',
        imageUrl: 'images/products/bananas.jpg',
        neededAmount: 1,
        neededUnit: 'kg',
        packageSize: '1 kg',
        packageCount: 1,
        packagePrice: 1.29,
        totalCost: 1.29,
        isChecked: checkedMap['item-bananas'] ?? false
      },
      {
        id: 'item-lentils',
        productId: 'netto-red-lentils-500',
        name: 'Rote Linsen',
        category: 'grains',
        imageUrl: 'images/products/rice.jpg',
        neededAmount: 500,
        neededUnit: 'g',
        packageSize: '500 g',
        packageCount: 1,
        packagePrice: 1.29,
        totalCost: 1.29,
        isChecked: checkedMap['item-lentils'] ?? false
      },
      {
        id: 'item-eggs',
        productId: 'netto-eggs-10stk',
        name: 'Eier aus Bodenhaltung',
        category: 'dairy',
        imageUrl: 'images/products/oats.jpg',
        neededAmount: 10,
        neededUnit: 'Stück',
        packageSize: '10 Stück',
        packageCount: 1,
        packagePrice: 1.99,
        totalCost: 1.99,
        isChecked: checkedMap['item-eggs'] ?? false
      }
    ];

    // Combine base items with custom user items
    const combined = [...baseItems, ...customItems];
    this.items.set(combined);
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

  addCustomItem(name: string, price: number | null, category: ProductCategory = 'pantry', packageSize = '1 Packung'): void {
    const newItem: ShoppingListItem = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      category,
      imageUrl: 'images/products/oats.jpg',
      neededAmount: 1,
      neededUnit: 'Stück',
      packageSize,
      packageCount: 1,
      packagePrice: price,
      totalCost: price,
      isChecked: false,
      isCustom: true
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
