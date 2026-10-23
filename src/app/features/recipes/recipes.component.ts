import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { ProductCatalogComponent } from '../../shared/components/product-catalog/product-catalog.component';
import { HamburgerButtonComponent } from '../../shared/components/hamburger-button/hamburger-button.component';
import { RECIPES_DATA } from '../../core/models/recipes.data';
import { Recipe } from '../../core/models/recipe.model';

@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [CommonModule, BottomNavComponent, ProductCatalogComponent, HamburgerButtonComponent],
  templateUrl: './recipes.component.html',
  styleUrl: './recipes.component.scss'
})
export class RecipesComponent {
  activeTab = signal<'recipes' | 'catalog'>('recipes');
  readonly allRecipes: Recipe[] = RECIPES_DATA;

  getMealTypeLabel(type: string): string {
    switch (type) {
      case 'breakfast': return 'Frühstück';
      case 'lunch': return 'Mittagessen';
      case 'dinner': return 'Abendessen';
      case 'snack': return 'Snack';
      default: return type;
    }
  }
}
