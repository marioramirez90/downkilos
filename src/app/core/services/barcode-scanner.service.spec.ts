import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { BarcodeScannerService } from './barcode-scanner.service';

describe('BarcodeScannerService', () => {
  let service: BarcodeScannerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BarcodeScannerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should validate and normalize EAN barcodes correctly', () => {
    // EAN-13
    expect(service.isValidBarcode('4012345678901')).toBe(true);
    // EAN-8
    expect(service.isValidBarcode('40123455')).toBe(true);
    // UPC-A (12 digits)
    expect(service.isValidBarcode('012345678905')).toBe(true);
    // Formatted with spaces / dashes
    expect(service.isValidBarcode('401-2345-678901')).toBe(true);
    expect(service.normalizeBarcode(' 401-2345-678901 ')).toBe('4012345678901');

    // Invalid barcodes
    expect(service.isValidBarcode('12345')).toBe(false);
    expect(service.isValidBarcode('abcdefg')).toBe(false);
    expect(service.isValidBarcode('')).toBe(false);
  });

  it('should initialize with status idle and no error', () => {
    expect(service.status()).toBe('idle');
    expect(service.errorMessage()).toBeNull();
  });

  it('should reset lock and allow new scans', () => {
    service.resetLock();
    expect(service.status()).toBe('idle');
  });

  it('should report support status based on environment', async () => {
    const supported = await service.isSupported();
    // In Node / Vitest test environment, navigator.mediaDevices may not have full hardware
    expect(typeof supported).toBe('boolean');
  });
});
