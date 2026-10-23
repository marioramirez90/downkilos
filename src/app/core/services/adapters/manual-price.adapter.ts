import { Injectable } from '@angular/core';
import { PriceHistoryEntry, ProductItem } from '../../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ManualPriceAdapter {
  /**
   * Erzeugt einen verifizierten Preisverlaufs-Eintrag für eine manuelle Preisangabe.
   */
  createManualPriceEntry(
    product: ProductItem,
    newPrice: number,
    recordedBy: string = 'user_in_store',
    branchLocation: string = 'Netto Filiale vor Ort',
    note?: string
  ): { updatedProduct: ProductItem; historyEntry: PriceHistoryEntry } {
    const today = new Date().toISOString().split('T')[0];
    const roundedPrice = Math.round(newPrice * 100) / 100;

    const historyEntry: PriceHistoryEntry = {
      id: `price-hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: product.id,
      ean: product.ean,
      price: roundedPrice,
      priceStatus: 'user_reported',
      priceSource: `Manuelle Eingabe (${branchLocation})`,
      observedDate: today,
      regionBranch: branchLocation,
      recordedAt: new Date().toISOString(),
      notes: note || `Erfasst durch ${recordedBy}`
    };

    const updatedProduct: ProductItem = {
      ...product,
      price: roundedPrice,
      priceStatus: 'user_reported',
      dataSource: 'user_input',
      priceSource: `Selbst eingetragener Netto-Preis (${branchLocation})`,
      lastUpdated: today,
      regionBranch: branchLocation
    };

    return { updatedProduct, historyEntry };
  }
}
