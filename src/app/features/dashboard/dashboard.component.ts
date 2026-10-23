import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../core/services/storage.service';
import { CalorieCalculatorService } from '../../core/services/calorie-calculator.service';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { FoodLogService } from '../../core/services/food-log.service';
import { ProductService } from '../../core/services/product.service';
import { ShoppingListService } from '../../core/services/shopping-list.service';
import { RetailerService } from '../../core/services/retailer.service';
import { ProductItem } from '../../core/models/product.model';
import { UserProfile } from '../../core/models/user-profile.model';
import { CalorieCalculationResult } from '../../core/models/calorie-calculation.model';
import { MealType } from '../../core/models/recipe.model';
import { FoodLogItem } from '../../core/models/food-log.model';

export interface DashboardProductCard {
  id: string;
  name: string;
  portionText: string;
  caloriesText: string;
  imageUrl: string;
  product: ProductItem;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BottomNavComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private storageService = inject(StorageService);
  private calorieService = inject(CalorieCalculatorService);
  private productService = inject(ProductService);
  private shoppingListService = inject(ShoppingListService);
  private retailerService = inject(RetailerService);
  readonly foodLogService = inject(FoodLogService);

  readonly profile = signal<UserProfile | null>(null);
  readonly calculation = signal<CalorieCalculationResult | null>(null);
  readonly searchQuery = signal<string>('');
  readonly marketLocation = signal<string>('10115 Berlin – Mitte');
  readonly toastMessage = signal<string | null>(null);

  // Ernährungstagebuch State (Section 11.4 & Section 12)
  readonly isDiaryOpen = signal<boolean>(false);
  readonly selectedMealForAdd = signal<MealType | null>(null);
  readonly addFoodMode = signal<'netto' | 'manual'>('netto');
  readonly quickProductForAdd = signal<ProductItem | null>(null);
  readonly nettoFilterQuery = signal<string>('');

  // Manuelle Lebensmitteleingabe
  readonly manualName = signal<string>('');
  readonly manualCalories = signal<number | null>(null);
  readonly manualPortion = signal<string>('1 Portion');

  // Datum im Tagebuch
  readonly diaryDate = signal<Date>(new Date());
  readonly Math = Math;

  async ngOnInit(): Promise<void> {
    try {
      let p = await this.storageService.loadProfile();
      if (!p) {
        p = {
          id: 'guest_profile',
          name: 'Lisa',
          birthDate: '1992-06-15',
          gender: 'female',
          currentWeight: 75,
          height: 168,
          targetWeight: 65,
          activityLevel: 'moderate',
          goal: 'lose_weight',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      this.profile.set(p);

      const calc = this.calorieService.calculate(p);
      this.calculation.set(calc);

      // Laden der Supermarkt-Präferenz
      const pref = await this.retailerService.loadPreference();
      if (pref) {
        const pc = pref.branch?.postalCode || pref.postalCode || '';
        const city = pref.branch?.city || pref.city || '';
        if (pc || city) {
          this.marketLocation.set(`${pc} ${city}`.trim());
        }
      }
    } catch (err) {
      console.warn('Dashboard init non-fatal error:', err);
    }
  }

  readonly userFirstName = computed(() => {
    const p = this.profile();
    if (!p || !p.name) return 'Lisa';
    return p.name.split(' ')[0];
  });

  readonly targetKcal = computed(() => {
    return this.calculation()?.dailyTargetKcal || 2000;
  });

  readonly eatenKcal = computed(() => {
    return this.foodLogService.eatenCalories();
  });

  readonly remainingKcal = computed(() => {
    return Math.max(0, this.targetKcal() - this.eatenKcal());
  });

  readonly calorieRatio = computed(() => {
    const target = this.targetKcal();
    if (!target) return 0;
    return Math.min(1, Math.max(0, this.eatenKcal() / target));
  });

  readonly calorieDashOffset = computed(() => {
    const circumference = 340; // 2 * PI * 54.11 ≈ 340
    return Math.round(circumference * (1 - this.calorieRatio()));
  });

  readonly formattedTargetKcal = computed(() => {
    return Math.round(this.targetKcal()).toLocaleString('de-DE');
  });

  readonly formattedEatenKcal = computed(() => {
    return Math.round(this.eatenKcal()).toLocaleString('de-DE');
  });

  readonly formattedRemainingKcal = computed(() => {
    return Math.round(this.remainingKcal()).toLocaleString('de-DE');
  });

  readonly featuredProducts = computed<DashboardProductCard[]>(() => {
    const all = this.productService.products();
    if (!all || all.length === 0) return [];

    const result: DashboardProductCard[] = [];

    // 1. Banane
    const banana = all.find(p => p.id === 'netto-bananas-1kg');
    if (banana) {
      result.push({
        id: banana.id,
        name: 'Banane',
        portionText: '1 Banane',
        caloriesText: '≈ 95 kcal',
        imageUrl: banana.imageUrl,
        product: banana
      });
    }

    // 2. Eier
    const eggs = all.find(p => p.id === 'netto-eggs-10stk');
    if (eggs) {
      result.push({
        id: eggs.id,
        name: 'Eier',
        portionText: '1 Ei',
        caloriesText: '≈ 78 kcal',
        imageUrl: 'images/products/eggs.jpg',
        product: eggs
      });
    }

    // 3. Skyr Natur
    const skyr = all.find(p => p.id === 'netto-skyr-500');
    if (skyr) {
      result.push({
        id: skyr.id,
        name: 'Skyr Natur',
        portionText: '1 Becher',
        caloriesText: '≈ 150 kcal',
        imageUrl: skyr.imageUrl,
        product: skyr
      });
    }

    // 4. Toastbrot Vollkorn
    const toast = all.find(p => p.id === 'netto-toast-500');
    if (toast) {
      result.push({
        id: toast.id,
        name: 'Toastbrot Vollkorn',
        portionText: '1 Scheibe',
        caloriesText: '≈ 65 kcal',
        imageUrl: 'images/products/toast.jpg',
        product: toast
      });
    }

    // 5. Weitere Produkte für horizontales Scrollen
    const beans = all.find(p => p.id === 'netto-kidney-beans-400');
    if (beans) {
      result.push({
        id: beans.id,
        name: 'Kidneybohnen',
        portionText: '1/2 Dose',
        caloriesText: '≈ 132 kcal',
        imageUrl: beans.imageUrl,
        product: beans
      });
    }

    return result;
  });

  readonly availableNettoProducts = computed<ProductItem[]>(() => {
    const all = this.productService.products();
    const query = this.nettoFilterQuery().trim().toLowerCase();
    if (!query) return all.slice(0, 16);
    return all.filter(p => p.name.toLowerCase().includes(query) || (p.brand && p.brand.toLowerCase().includes(query))).slice(0, 16);
  });

  readonly formattedDiaryDate = computed(() => {
    const d = this.diaryDate();
    const now = new Date();
    const isToday = now.getFullYear() === d.getFullYear() && now.getMonth() === d.getMonth() && now.getDate() === d.getDate();
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
    const dateStr = d.toLocaleDateString('de-DE', options);
    return isToday ? `Heute, ${dateStr}` : dateStr;
  });

  openDiary(): void {
    this.isDiaryOpen.set(true);
  }

  closeDiary(): void {
    this.isDiaryOpen.set(false);
    this.selectedMealForAdd.set(null);
    this.quickProductForAdd.set(null);
  }

  previousDiaryDay(): void {
    const d = new Date(this.diaryDate());
    d.setDate(d.getDate() - 1);
    this.diaryDate.set(d);
  }

  nextDiaryDay(): void {
    const d = new Date(this.diaryDate());
    d.setDate(d.getDate() + 1);
    this.diaryDate.set(d);
  }

  openAddModal(mealType: MealType): void {
    this.selectedMealForAdd.set(mealType);
    this.addFoodMode.set('netto');
    this.nettoFilterQuery.set('');
    this.manualName.set('');
    this.manualCalories.set(null);
    this.manualPortion.set('1 Portion');
  }

  closeAddModal(): void {
    this.selectedMealForAdd.set(null);
  }

  onProductPlusClick(product: ProductItem, event: MouseEvent): void {
    event.stopPropagation();
    this.quickProductForAdd.set(product);
  }

  closeQuickAddModal(): void {
    this.quickProductForAdd.set(null);
  }

  confirmQuickAddProduct(mealType: MealType): void {
    const p = this.quickProductForAdd();
    if (!p) return;

    this.foodLogService.logProduct(p, mealType, undefined, 'eaten');
    this.quickProductForAdd.set(null);
    this.toastMessage.set(`✓ "${p.name}" zu ${this.getMealLabel(mealType)} hinzugefügt!`);
    setTimeout(() => this.toastMessage.set(null), 2500);
  }

  addProductToMeal(product: ProductItem): void {
    const meal = this.selectedMealForAdd() || 'snack';
    this.foodLogService.logProduct(product, meal, undefined, 'eaten');
    this.closeAddModal();
    this.toastMessage.set(`✓ "${product.name}" zu ${this.getMealLabel(meal)} hinzugefügt!`);
    setTimeout(() => this.toastMessage.set(null), 2500);
  }

  submitManualFood(): void {
    const name = this.manualName().trim();
    const cals = this.manualCalories();
    if (!name || cals === null || cals <= 0) return;

    const meal = this.selectedMealForAdd() || 'snack';
    this.foodLogService.addManualItem(name, cals, this.manualPortion().trim() || '1 Portion', meal, 'eaten');
    this.closeAddModal();
    this.toastMessage.set(`✓ "${name}" (${cals} kcal) zu ${this.getMealLabel(meal)} eingetragen!`);
    setTimeout(() => this.toastMessage.set(null), 2500);
  }

  deleteFoodItem(id: string): void {
    this.foodLogService.removeItem(id);
    this.toastMessage.set('Eintrag gelöscht');
    setTimeout(() => this.toastMessage.set(null), 2000);
  }

  getMealItems(mealType: MealType): FoodLogItem[] {
    return this.foodLogService.getItemsForMeal(mealType);
  }

  getMealCalories(mealType: MealType): number {
    return this.foodLogService.getCaloriesForMeal(mealType);
  }

  getMealLabel(mealType: MealType): string {
    switch (mealType) {
      case 'breakfast': return 'Frühstück';
      case 'lunch': return 'Mittagessen';
      case 'dinner': return 'Abendessen';
      case 'snack': return 'Snacks & Getränke';
      default: return mealType;
    }
  }

  getMealIcon(mealType: MealType): string {
    switch (mealType) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
      case 'snack': return '🍎';
      default: return '🍽️';
    }
  }

  addToCart(product: ProductItem, event: MouseEvent): void {
    event.stopPropagation();
    this.shoppingListService.addProductToShoppingList(product);
    this.toastMessage.set(`✓ "${product.name}" zur Einkaufsliste hinzugefügt!`);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 2500);
  }

  openProduct(product: ProductItem): void {
    this.router.navigate(['/discover'], { queryParams: { q: product.name } });
  }

  goToAllProducts(): void {
    this.router.navigate(['/discover']);
  }

  goToShoppingList(): void {
    this.router.navigate(['/shopping-list']);
  }

  goToRecipes(): void {
    this.router.navigate(['/recipes']);
  }

  goToMarketSelection(): void {
    this.router.navigate(['/retailers']);
  }

  goToSettings(): void {
    this.router.navigate(['/onboarding']);
  }

  onSearchSubmit(): void {
    const q = this.searchQuery().trim();
    if (q) {
      this.router.navigate(['/discover'], { queryParams: { q } });
    } else {
      this.goToAllProducts();
    }
  }
}
