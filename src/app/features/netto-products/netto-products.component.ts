import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductCatalogComponent } from '../../shared/components/product-catalog/product-catalog.component';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { HamburgerButtonComponent } from '../../shared/components/hamburger-button/hamburger-button.component';
import { LogoComponent } from '../../shared/components/logo/logo.component';

@Component({
  selector: 'app-netto-products',
  standalone: true,
  imports: [CommonModule, ProductCatalogComponent, BottomNavComponent, HamburgerButtonComponent, LogoComponent],
  templateUrl: './netto-products.component.html',
  styleUrl: './netto-products.component.scss'
})
export class NettoProductsComponent {
  private router = inject(Router);

  goToShoppingList(): void {
    this.router.navigate(['/shopping-list']);
  }
}
