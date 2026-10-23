import { Injectable } from '@angular/core';
import { PriceStatus, ProductItem } from '../models/product.model';

export interface PriceStatusBadge {
  label: string;
  badgeText: string;
  bgClass: string;
  textClass: string;
  isEstimated: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PriceService {
  /**
   * Formatiert einen Euro-Preis. Erfindet niemals Fantasiepreise für NULL-Werte!
   */
  formatPrice(price: number | null | undefined): string {
    if (price === null || price === undefined || isNaN(price)) {
      return 'Preis unbekannt';
    }
    return `${price.toFixed(2).replace('.', ',')} €`;
  }

  /**
   * Formatiert den Grundpreis bzw. die Einheit.
   */
  formatUnit(product: ProductItem): string {
    if (product.price === null || product.price === undefined) {
      return 'Preis unbekannt';
    }
    return `${this.formatPrice(product.price)} ${product.priceUnit ? `(${product.priceUnit})` : ''}`;
  }

  /**
   * Gibt das formatierte Beobachtungsdatum zurück (z.B. "Stand: 22.10.2026").
   */
  formatObservationDate(dateStr?: string): string {
    if (!dateStr) return 'Datum unbekannt';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  /**
   * Liefert das Badge für die 5 verbindlichen Preisstatus.
   */
  getStatusBadge(status: PriceStatus, validUntil?: string): PriceStatusBadge {
    // Prüfen, ob Aktionspreis abgelaufen ist
    if (status === 'confirmed_offer' && validUntil) {
      const today = new Date().toISOString().split('T')[0];
      if (today > validUntil) {
        return {
          label: 'Zuletzt bekannter Preis (Aktion abgelaufen)',
          badgeText: 'Zuletzt bekannt',
          bgClass: 'bg-[#EFF6FF]',
          textClass: 'text-[#2563EB]',
          isEstimated: true
        };
      }
    }

    switch (status) {
      case 'confirmed_offer':
      case 'verified':
        return {
          label: 'Aktuell bestätigtes Netto-Angebot',
          badgeText: 'Netto-Angebot',
          bgClass: 'bg-[#E5F5E8]',
          textClass: 'text-[#278F39]',
          isEstimated: false
        };
      case 'last_observed':
      case 'recent':
        return {
          label: 'Zuletzt beobachteter Netto-Preis',
          badgeText: 'Zuletzt bekannt',
          bgClass: 'bg-[#EFF6FF]',
          textClass: 'text-[#2563EB]',
          isEstimated: true
        };
      case 'user_reported':
        return {
          label: 'Selbst eingetragener Netto-Preis',
          badgeText: 'Selbst erfasst',
          bgClass: 'bg-[#F3E8FF]',
          textClass: 'text-[#9333EA]',
          isEstimated: true
        };
      case 'licensed_data':
        return {
          label: 'Preis aus lizenzierter Datenquelle',
          badgeText: 'Lizenzierte Daten',
          bgClass: 'bg-[#E0F2FE]',
          textClass: 'text-[#0284C7]',
          isEstimated: false
        };
      case 'unknown':
      case 'missing':
      default:
        return {
          label: 'Preis unbekannt',
          badgeText: 'Preis fehlt',
          bgClass: 'bg-[#FEF3C7]',
          textClass: 'text-[#D97706]',
          isEstimated: true
        };
    }
  }

  /**
   * Berechnet den exakten anteiligen Zutatenpreis für ein Rezept.
   */
  calculatePortionPrice(productPrice: number | null, requiredGrams: number, packageGrams: number): number | null {
    if (productPrice === null || !packageGrams || isNaN(productPrice)) return null;
    return Math.round(((productPrice / packageGrams) * requiredGrams) * 100) / 100;
  }

  /**
   * Berechnet auf Wunsch einen zusätzlichen Budgetpuffer für Preisänderungen (z.B. 5%, 10%).
   */
  calculateBudgetWithBuffer(baseAmount: number, bufferPercent: number = 0): {
    baseAmount: number;
    bufferAmount: number;
    totalWithBuffer: number;
  } {
    const safeBase = Math.round(baseAmount * 100) / 100;
    const buffer = Math.round((safeBase * (bufferPercent / 100)) * 100) / 100;
    return {
      baseAmount: safeBase,
      bufferAmount: buffer,
      totalWithBuffer: Math.round((safeBase + buffer) * 100) / 100
    };
  }
}
