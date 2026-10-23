import { Injectable, signal } from '@angular/core';
import { ProductCategory, ProductItem } from '../models/product.model';
import { NETTO_PRODUCT_CATALOG } from '../models/netto-catalog.data';

const USER_PRICES_STORAGE_KEY = 'down_kilos_user_prices';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  readonly products = signal<ProductItem[]>([]);

  constructor() {
    this.loadCatalog();
  }

  loadCatalog(): void {
    const userPrices = this.getUserPrices();
    const catalog = NETTO_PRODUCT_CATALOG.map((p) => {
      const userPrice = userPrices[p.id];
      if (userPrice !== undefined) {
        return {
          ...p,
          price: userPrice,
          priceStatus: 'user_reported' as const,
          dataSource: 'user_input' as const,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }
      return p;
    });

    this.products.set(catalog);
  }

  getAllProducts(): ProductItem[] {
    return this.products();
  }

  getProductById(id: string): ProductItem | undefined {
    return this.products().find((p) => p.id === id);
  }

  searchProducts(query: string, category: ProductCategory = 'all'): ProductItem[] {
    const q = query.trim().toLowerCase();
    return this.products().filter((p) => {
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || (p.ean && p.ean.includes(q));
      const matchesCategory = category === 'all' || p.category === category;
      return matchesQuery && matchesCategory;
    });
  }

  updateUserPrice(productId: string, newPrice: number): void {
    if (newPrice < 0) return;
    const userPrices = this.getUserPrices();
    userPrices[productId] = Math.round(newPrice * 100) / 100;

    try {
      localStorage.setItem(USER_PRICES_STORAGE_KEY, JSON.stringify(userPrices));
    } catch {
      // ignore
    }

    this.loadCatalog();
  }

  private getUserPrices(): Record<string, number> {
    try {
      const stored = localStorage.getItem(USER_PRICES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }
}
