import { Injectable } from '@angular/core';
import { PriceStatus, ProductItem } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class PriceService {
  formatPrice(price: number | null | undefined): string {
    if (price === null || price === undefined || isNaN(price)) {
      return 'Preis nicht verfügbar';
    }
    return `${price.toFixed(2).replace('.', ',')} €`;
  }

  formatUnit(product: ProductItem): string {
    if (!product.price) return 'Preis nicht verfügbar';
    return `${this.formatPrice(product.price)} ${product.priceUnit ? `(${product.priceUnit})` : ''}`;
  }

  getStatusBadge(status: PriceStatus): { label: string; bgClass: string; textClass: string } {
    switch (status) {
      case 'verified':
        return {
          label: 'Verifiziert',
          bgClass: 'bg-[#E5F5E8]',
          textClass: 'text-[#278F39]'
        };
      case 'recent':
        return {
          label: 'Open Prices',
          bgClass: 'bg-[#EFF6FF]',
          textClass: 'text-[#2563EB]'
        };
      case 'user_reported':
        return {
          label: 'Selbst erfasst',
          bgClass: 'bg-[#F3E8FF]',
          textClass: 'text-[#9333EA]'
        };
      case 'missing':
      default:
        return {
          label: 'Preis fehlt',
          bgClass: 'bg-[#FEF3C7]',
          textClass: 'text-[#D97706]'
        };
    }
  }

  calculatePortionPrice(productPrice: number | null, requiredGrams: number, packageGrams: number): number | null {
    if (productPrice === null || !packageGrams) return null;
    return Math.round(((productPrice / packageGrams) * requiredGrams) * 100) / 100;
  }
}
