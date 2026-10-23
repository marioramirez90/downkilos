import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { StorageService } from '../../core/services/storage.service';
import { CalorieCalculatorService } from '../../core/services/calorie-calculator.service';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { HamburgerButtonComponent } from '../../shared/components/hamburger-button/hamburger-button.component';
import { FoodLogService } from '../../core/services/food-log.service';
import { ProductService } from '../../core/services/product.service';
import { PackageCalorieCalculatorService, PieceCalorieInfo } from '../../core/services/package-calorie-calculator.service';
import { ProductItem } from '../../core/models/product.model';
import { UserProfile } from '../../core/models/user-profile.model';
import { CalorieCalculationResult } from '../../core/models/calorie-calculation.model';

export interface FeaturedProductView {
  product: ProductItem;
  pieceInfo: PieceCalorieInfo | null;
  servingCalories: number | null;
  packageCalories: number | null;
  priceFormatted: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BottomNavComponent,
    HamburgerButtonComponent,
    TranslatePipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private storageService = inject(StorageService);
  private calorieService = inject(CalorieCalculatorService);
  private productService = inject(ProductService);
  private packageCalcService = inject(PackageCalorieCalculatorService);
  readonly foodLogService = inject(FoodLogService);

  readonly profile = signal<UserProfile | null>(null);
  readonly calculation = signal<CalorieCalculationResult | null>(null);
  readonly searchQuery = signal<string>('');

  // Target curated product IDs to feature on Dashboard Bereich B
  private readonly targetFeaturedIds = [
    'netto-toast-500',
    'netto-eggs-10stk',
    'netto-bananas-1kg',
    'netto-skyr-500',
    'netto-kidney-beans-400',
    'netto-oats-500'
  ];

  async ngOnInit(): Promise<void> {
    let p = await this.storageService.loadProfile();
    if (!p) {
      p = {
        id: 'guest_profile',
        name: 'Lisa Müller',
        birthDate: '1990-05-14',
        gender: 'female',
        currentWeight: 78,
        height: 168,
        targetWeight: 70,
        activityLevel: 'sedentary',
        goal: 'lose_weight',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    this.profile.set(p);

    const calc = this.calorieService.calculate(p);
    this.calculation.set(calc);
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
    const circumference = 352; // 2 * PI * 56 ≈ 351.86
    return Math.round(circumference * (1 - this.calorieRatio()));
  });

  readonly featuredProducts = computed<FeaturedProductView[]>(() => {
    const all = this.productService.products();
    if (!all || all.length === 0) return [];

    // Filter by the preferred curated IDs, or fallback to first 6 items
    const selected = all.filter(p => this.targetFeaturedIds.includes(p.id));
    const items = selected.length >= 4 ? selected : all.slice(0, 6);

    return items.map(product => {
      const pieceInfo = this.packageCalcService.calculatePieceCalories(product);
      const serving = this.packageCalcService.calculateServingCalories(product);
      const packageCalories = this.packageCalcService.calculatePackageCalories(product);
      const priceFormatted = product.price !== null && product.price !== undefined
        ? `${product.price.toFixed(2).replace('.', ',')} €`
        : 'Preis n.v.';

      return {
        product,
        pieceInfo,
        servingCalories: serving?.calories || null,
        packageCalories,
        priceFormatted
      };
    });
  });

  readonly filteredFeaturedProducts = computed<FeaturedProductView[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const list = this.featuredProducts();
    if (!query) return list;

    return list.filter(item =>
      item.product.name.toLowerCase().includes(query) ||
      item.product.category.toLowerCase().includes(query) ||
      (item.product.brand && item.product.brand.toLowerCase().includes(query))
    );
  });

  todayDateFormatted(): string {
    const today = new Date();
    return today.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }

  openProduct(product: ProductItem): void {
    this.router.navigate(['/discover'], { queryParams: { q: product.name } });
  }

  goToAllProducts(): void {
    this.router.navigate(['/discover']);
  }

  goToProfileEdit(): void {
    this.router.navigate(['/onboarding']);
  }
}
