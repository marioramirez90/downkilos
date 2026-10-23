import { Injectable } from '@angular/core';

export interface OpenPriceRecord {
  id: number;
  product_code?: string;
  product_name?: string;
  price: number;
  currency: string;
  date: string;
  location_osm_name?: string;
  location_name?: string;
  owner?: string;
  proof_type?: string;
}

export interface MatchedNettoPrice {
  ean: string;
  price: number;
  date: string;
  location: string;
  source: string;
  isNettoMarkenDiscount: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OpenPricesAdapter {
  private readonly baseUrl = 'https://prices.openfoodfacts.org/api/v1/prices';

  /**
   * Filtert und prüft, ob ein Standort tatsächlich zu Netto Marken-Discount (rot-gelb) gehört
   * und NICHT zu Netto mit dem Hund (Dänisches Netto / Scottie).
   */
  isNettoMarkenDiscountLocation(locationName?: string, locationOsmName?: string): boolean {
    const text = `${locationName || ''} ${locationOsmName || ''}`.toLowerCase();
    
    // Ausschluss von Dänischem Netto / Netto mit dem Hund
    if (text.includes('hund') || text.includes('scottie') || text.includes('netto aps') || text.includes('dänisch')) {
      return false;
    }

    // Bestätigung für Netto Marken-Discount
    return text.includes('netto') || text.includes('marken-discount') || text.includes('netto marken discount');
  }

  /**
   * Fragt Open Prices nach beobachteten Preisen für einen bestimmten Barcode ab.
   */
  async fetchPricesForBarcode(barcode: string): Promise<MatchedNettoPrice[]> {
    const cleanEan = barcode.trim();
    if (!cleanEan) return [];

    try {
      const url = `${this.baseUrl}?product_code=${encodeURIComponent(cleanEan)}&currency=EUR&size=10`;
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'DownKilosApp/1.0 (contact@downkilos.de)'
        }
      });

      if (!res.ok) {
        return [];
      }

      const data = await res.json();
      const items: OpenPriceRecord[] = data.items || [];
      
      const matched: MatchedNettoPrice[] = [];
      for (const item of items) {
        // Prüfen, ob der Eintrag Netto Marken-Discount zugeordnet werden kann
        const isNetto = this.isNettoMarkenDiscountLocation(item.location_name, item.location_osm_name);
        if (isNetto && item.price && item.price > 0) {
          matched.push({
            ean: cleanEan,
            price: Math.round(item.price * 100) / 100,
            date: item.date || new Date().toISOString().split('T')[0],
            location: item.location_osm_name || item.location_name || 'Netto Marken-Discount',
            source: `Open Prices (${item.owner || 'Community'})`,
            isNettoMarkenDiscount: true
          });
        }
      }

      return matched;
    } catch (err) {
      console.warn(`[OpenPricesAdapter] Konnte Open Prices für ${cleanEan} nicht abrufen:`, err);
      return [];
    }
  }

  /**
   * Ermittelt den zuletzt beobachteten Netto-Preis aus einer Liste von Datensätzen.
   */
  getLatestPrice(records: MatchedNettoPrice[]): MatchedNettoPrice | null {
    if (!records || records.length === 0) return null;
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }
}
