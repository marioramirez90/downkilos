import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  BarcodeScanner,
  BarcodeFormat,
  LensFacing
} from '@capacitor-mlkit/barcode-scanning';

export interface ScanResult {
  success: boolean;
  barcode: string | null;
  format?: string;
  errorMessage?: string;
}

export type ScannerStatus = 'idle' | 'requesting_permission' | 'scanning' | 'processing' | 'error';

@Injectable({
  providedIn: 'root'
})
export class BarcodeScannerService {
  readonly status = signal<ScannerStatus>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly hasTorch = signal<boolean>(false);
  readonly isTorchOn = signal<boolean>(false);

  private activeMediaStream: MediaStream | null = null;
  private scanLock = false;
  private lastScannedBarcode: string | null = null;
  private lastScanTimestamp = 0;

  /**
   * Prüft, ob native Barcode-Scanner-Unterstützung (ML Kit) oder Web-Kamera verfügbar ist.
   */
  async isSupported(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        const { supported } = await BarcodeScanner.isSupported();
        return supported;
      } catch {
        return false;
      }
    }
    // Web: Prüfe ob MediaDevices API vorhanden ist
    return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  }

  /**
   * Prüft und fordert ggf. Kameraberechtigungen an.
   */
  async checkAndRequestPermissions(): Promise<boolean> {
    this.status.set('requesting_permission');
    this.errorMessage.set(null);

    if (Capacitor.isNativePlatform()) {
      try {
        const status = await BarcodeScanner.checkPermissions();
        if (status.camera === 'granted') {
          return true;
        }

        const request = await BarcodeScanner.requestPermissions();
        const granted = request.camera === 'granted';
        if (!granted) {
          this.errorMessage.set('Kamerazugriff verweigert. Bitte erlaube den Zugriff in den Geräteeinstellungen.');
          this.status.set('error');
        }
        return granted;
      } catch (err) {
        console.warn('[BarcodeScannerService] Fehler bei Berechtigungsprüfung:', err);
        this.errorMessage.set('Kameraberechtigung konnte nicht abgefragt werden.');
        this.status.set('error');
        return false;
      }
    }

    // Web-Berechtigung
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        // Test-Stream direkt schließen
        stream.getTracks().forEach(track => track.stop());
        return true;
      } catch (err: any) {
        console.warn('[BarcodeScannerService] Web Kamera-Zugriff verweigert:', err);
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          this.errorMessage.set('Kamerazugriff im Browser verweigert. Bitte erlaube den Zugriff.');
        } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
          this.errorMessage.set('Keine geeignete Kamera gefunden.');
        } else {
          this.errorMessage.set('Kamera konnte nicht gestartet werden.');
        }
        this.status.set('error');
        return false;
      }
    }

    this.errorMessage.set('Kamera wird von diesem Gerät oder Browser nicht unterstützt.');
    this.status.set('error');
    return false;
  }

  /**
   * Startet den nativen ML Kit Scanvorgang (Capacitor) oder bereitet Web-Scan vor.
   */
  async scanBarcode(): Promise<ScanResult> {
    if (this.scanLock) {
      return { success: false, barcode: null, errorMessage: 'Scanvorgang läuft bereits.' };
    }

    const hasPermission = await this.checkAndRequestPermissions();
    if (!hasPermission) {
      return {
        success: false,
        barcode: null,
        errorMessage: this.errorMessage() || 'Kamerazugriff erforderlich.'
      };
    }

    this.scanLock = true;
    this.status.set('scanning');

    if (Capacitor.isNativePlatform()) {
      try {
        // Prüfe ob Google Barcode Scanner Modul vorhanden ist (Android)
        if (Capacitor.getPlatform() === 'android') {
          const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
          if (!available) {
            await BarcodeScanner.installGoogleBarcodeScannerModule();
          }
        }

        const { barcodes } = await BarcodeScanner.scan({
          formats: [
            BarcodeFormat.Ean13,
            BarcodeFormat.Ean8,
            BarcodeFormat.UpcA,
            BarcodeFormat.UpcE
          ]
        });

        this.scanLock = false;
        this.status.set('idle');

        if (barcodes && barcodes.length > 0) {
          const rawValue = barcodes[0].rawValue || barcodes[0].displayValue;
          if (rawValue) {
            const clean = rawValue.trim();
            // Debounce-Schutz: Verhindere doppeltes Verarbeiten innerhalb von 1,5 Sekunden
            const now = Date.now();
            if (this.lastScannedBarcode === clean && now - this.lastScanTimestamp < 1500) {
              return { success: false, barcode: null };
            }
            this.lastScannedBarcode = clean;
            this.lastScanTimestamp = now;

            return {
              success: true,
              barcode: clean,
              format: barcodes[0].format
            };
          }
        }

        return { success: false, barcode: null };
      } catch (err: any) {
        this.scanLock = false;
        this.status.set('error');
        const msg = err?.message || 'Fehler beim Scannen des Barcodes.';
        this.errorMessage.set(msg);
        return { success: false, barcode: null, errorMessage: msg };
      }
    }

    // Web Fallback (handled via attachWebVideoStream in Component)
    this.scanLock = false;
    this.status.set('idle');
    return { success: false, barcode: null, errorMessage: 'Web-Scan erfordert Video-Element.' };
  }

  /**
   * Startet einen Video-Stream für das Web-/HTML5-Kamera-Element.
   */
  async startWebCamera(videoElement: HTMLVideoElement): Promise<MediaStream | null> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.status.set('error');
      this.errorMessage.set('Kamerazugriff im Browser nicht verfügbar.');
      return null;
    }

    try {
      this.stopScanning();
      this.status.set('scanning');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      this.activeMediaStream = stream;
      videoElement.srcObject = stream;
      await videoElement.play();
      return stream;
    } catch (err) {
      console.warn('[BarcodeScannerService] Web-Kamera konnte nicht gestartet werden:', err);
      this.status.set('error');
      this.errorMessage.set('Kamerazugriff im Browser fehlgeschlagen.');
      return null;
    }
  }

  /**
   * Beendet den Scanvorgang und gibt sämtliche Kameraressourcen unverzüglich frei.
   */
  stopScanning(): void {
    this.scanLock = false;
    this.status.set('idle');

    // 1. Web MediaStream-Tracks beenden
    if (this.activeMediaStream) {
      this.activeMediaStream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      this.activeMediaStream = null;
    }

    // 2. Natives Capacitor ML Kit stoppen
    if (Capacitor.isNativePlatform()) {
      try {
        BarcodeScanner.stopScan();
      } catch {
        // ignore
      }
    }
  }

  /**
   * Schaltet die Taschenlampe (Torch) ein/aus, sofern unterstützt.
   */
  async toggleTorch(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        await BarcodeScanner.toggleTorch();
        this.isTorchOn.update(v => !v);
        return this.isTorchOn();
      } catch {
        return false;
      }
    }

    // Web Torch via track.applyConstraints
    if (this.activeMediaStream) {
      const track = this.activeMediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as any;
      if (capabilities && capabilities.torch) {
        try {
          const next = !this.isTorchOn();
          await track.applyConstraints({
            advanced: [{ torch: next } as any]
          });
          this.isTorchOn.set(next);
          return next;
        } catch {
          return false;
        }
      }
    }

    return false;
  }

  /**
   * Setzt den Scan-Lock zurück, um einen neuen Scanvorgang zu ermöglichen.
   */
  resetLock(): void {
    this.scanLock = false;
    this.status.set('idle');
  }

  /**
   * Bereinigt und normalisiert den Barcode.
   */
  normalizeBarcode(barcode: string): string {
    return (barcode || '').trim().replace(/[^0-9]/g, '');
  }

  /**
   * Validiert, ob ein Barcode ein gültiges EAN-8, EAN-13 oder UPC-Format besitzt.
   */
  isValidBarcode(barcode: string): boolean {
    const clean = this.normalizeBarcode(barcode);
    return clean.length >= 8 && clean.length <= 14;
  }
}

