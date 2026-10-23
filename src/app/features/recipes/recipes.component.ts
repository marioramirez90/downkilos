import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { HamburgerButtonComponent } from '../../shared/components/hamburger-button/hamburger-button.component';
import { RECIPES_DATA } from '../../core/models/recipes.data';
import { Recipe } from '../../core/models/recipe.model';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { PriceService } from '../../core/services/price.service';

@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BottomNavComponent,
    HamburgerButtonComponent,
    TranslatePipe
  ],
  templateUrl: './recipes.component.html',
  styleUrl: './recipes.component.scss'
})
export class RecipesComponent {
  private router = inject(Router);
  priceService = inject(PriceService);

  selectedMealType = signal<'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack'>('all');
  readonly allRecipes: Recipe[] = RECIPES_DATA;

  goToDiscover(): void {
    this.router.navigate(['/discover']);
  }

  readonly mealFilters: { id: 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack'; labelKey: string }[] = [
    { id: 'all', labelKey: 'RECIPES.FILTER_ALL' },
    { id: 'breakfast', labelKey: 'RECIPES.FILTER_BREAKFAST' },
    { id: 'lunch', labelKey: 'RECIPES.FILTER_LUNCH' },
    { id: 'dinner', labelKey: 'RECIPES.FILTER_DINNER' },
    { id: 'snack', labelKey: 'RECIPES.FILTER_SNACK' }
  ];

  filteredRecipes = computed(() => {
    const filter = this.selectedMealType();
    if (filter === 'all') {
      return this.allRecipes;
    }
    return this.allRecipes.filter(r => r.mealType === filter);
  });

  getMealTypeLabelKey(type: string): string {
    switch (type) {
      case 'breakfast': return 'RECIPES.FILTER_BREAKFAST';
      case 'lunch': return 'RECIPES.FILTER_LUNCH';
      case 'dinner': return 'RECIPES.FILTER_DINNER';
      case 'snack': return 'RECIPES.FILTER_SNACK';
      default: return type;
    }
  }
}
