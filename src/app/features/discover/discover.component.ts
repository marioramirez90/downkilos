import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { PriceService } from '../../core/services/price.service';
import { FoodLogService } from '../../core/services/food-log.service';
import { ShoppingListService } from '../../core/services/shopping-list.service';
import { ProductItem, CalorieFilterType, ProductSortType } from '../../core/models/product.model';
import { MealType } from '../../core/models/recipe.model';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { HamburgerButtonComponent } from '../../shared/components/hamburger-button/hamburger-button.component';
import { LogoComponent } from '../../shared/components/logo/logo.component';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [CommonModule, FormsModule, BottomNavComponent, HamburgerButtonComponent, LogoComponent],
  templateUrl: './discover.component.html',
  styleUrl: './discover.component.scss'
})
export class DiscoverComponent {
  private router = inject(Router);
  productService = inject(ProductService);
  priceService = inject(PriceService);
  foodLogService = inject(FoodLogService);
  shoppingListService = inject(ShoppingListService);

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

  // Portions- & Tagesplan-Modal
  selectedProductForLog = signal<ProductItem | null>(null);
  customAmountGrams: number = 150;
  selectedMealType: MealType = 'snack';
  selectedLogStatus: 'planned' | 'eaten' = 'planned';

  toastMessage = signal<string | null>(null);

  readonly categoryPills = [
    { id: 'all', label: 'Alle' },
    { id: 'fruits_veg', label: 'Obst & Gemüse' },
    { id: 'meat_fish', label: 'Fleisch & Fisch' },
    { id: 'dairy', label: 'Milch & Skyr' },
    { id: 'grains', label: 'Getreide & Reis' },
    { id: 'ready_meal', label: 'Fertiggerichte' },
    { id: 'low_cal', label: '🌱 Kalorienarm (<40 kcal)' },
    { id: 'under_100', label: '⚡ < 100 kcal / Portion' },
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

    // 1. Textsuche
    if (query) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        (p.ean && p.ean.includes(query))
      );
    }

    // 2. Kategorie- & Smart-Filter
    if (cat === 'fruits_veg' || cat === 'meat_fish' || cat === 'dairy' || cat === 'grains' || cat === 'ready_meal') {
      list = list.filter(p => p.category === cat);
    } else if (cat === 'low_cal') {
      list = list.filter(p => p.nutrition.caloriesPer100g < 40);
    } else if (cat === 'under_100') {
      list = list.filter(p => {
        const portionGrams = p.servingSizeGrams || 100;
        const edibleGrams = Math.round(portionGrams * (p.edibleYieldPercent || 1.0));
        const cal = (p.nutrition.caloriesPer100g / 100) * edibleGrams;
        return cal <= 100;
      });
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
    } else if (calFilter === 'under_100_serving') {
      list = list.filter(p => (p.nutrition.caloriesPer100g / 100) * ((p.servingSizeGrams || 100) * (p.edibleYieldPercent || 1.0)) <= 100);
    } else if (calFilter === 'under_200_serving') {
      list = list.filter(p => (p.nutrition.caloriesPer100g / 100) * ((p.servingSizeGrams || 100) * (p.edibleYieldPercent || 1.0)) <= 200);
    }

    // 4. Verbleibendes Kalorienbudget
    if (remainingLimit !== null) {
      list = list.filter(p => {
        const portionGrams = p.servingSizeGrams || 100;
        const cal = (p.nutrition.caloriesPer100g / 100) * (portionGrams * (p.edibleYieldPercent || 1.0));
        return cal <= remainingLimit;
      });
    }

    // 5. Sortierung
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

  /**
   * Berechnet Kalorien für die übliche Standardportion
   */
  getServingCalories(product: ProductItem): number {
    const servingGrams = product.servingSizeGrams || 100;
    const edibleGrams = Math.round(servingGrams * (product.edibleYieldPercent || 1.0));
    return Math.round((product.nutrition.caloriesPer100g / 100) * edibleGrams);
  }

  /**
   * Berechnet Kalorien der gesamten essbaren Packung
   */
  getTotalPackageEdibleCalories(product: ProductItem): number {
    const totalGrams = product.packageWeightGrams || 500;
    const edibleGrams = Math.round(totalGrams * (product.edibleYieldPercent || 1.0));
    return Math.round((product.nutrition.caloriesPer100g / 100) * edibleGrams);
  }

  openLogModal(product: ProductItem): void {
    this.selectedProductForLog.set(product);
    this.customAmountGrams = product.servingSizeGrams || 150;
    this.selectedMealType = 'snack';
    this.selectedLogStatus = 'planned';
  }

  closeLogModal(): void {
    this.selectedProductForLog.set(null);
  }

  setPredefinedAmount(grams: number): void {
    this.customAmountGrams = grams;
  }

  confirmAddToDay(): void {
    const product = this.selectedProductForLog();
    if (!product || this.customAmountGrams <= 0) return;

    this.foodLogService.addProductToDay(
      product,
      this.customAmountGrams,
      this.selectedMealType,
      this.selectedLogStatus
    );

    this.showToast(`"${product.name}" (${this.customAmountGrams}g) zum Tagesplan hinzugefügt!`);
    this.closeLogModal();
  }

  addToShoppingList(product: ProductItem): void {
    this.shoppingListService.addProductToShoppingList(product);
    this.showToast(`"${product.name}" auf Einkaufsliste gesetzt!`);
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
