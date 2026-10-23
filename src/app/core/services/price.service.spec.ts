import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { PriceService } from './price.service';

describe('PriceService', () => {
  let service: PriceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PriceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should format numbers into German currency notation (e.g. 2,99 €)', () => {
    expect(service.formatPrice(2.99)).toBe('2,99 €');
    expect(service.formatPrice(0.89)).toBe('0,89 €');
  });

  it('should return "Preis unbekannt" when price is null without inventing numbers', () => {
    expect(service.formatPrice(null)).toBe('Preis unbekannt');
    expect(service.formatPrice(undefined)).toBe('Preis unbekannt');
  });

  it('should calculate portion price accurately', () => {
    // 2.99 € for 400g package, recipe uses 150g
    // (2.99 / 400) * 150 = 1.12125 -> 1.12 €
    const portionPrice = service.calculatePortionPrice(2.99, 150, 400);
    expect(portionPrice).toBe(1.12);
  });

  it('should return correct badges for all 5 required price statuses', () => {
    expect(service.getStatusBadge('confirmed_offer').badgeText).toBe('Netto-Angebot');
    expect(service.getStatusBadge('last_observed').badgeText).toBe('Zuletzt bekannt');
    expect(service.getStatusBadge('user_reported').badgeText).toBe('Selbst erfasst');
    expect(service.getStatusBadge('licensed_data').badgeText).toBe('Lizenzierte Daten');
    expect(service.getStatusBadge('unknown').badgeText).toBe('Preis fehlt');
  });

  it('should flag expired promotion prices as estimated/last_observed', () => {
    const badge = service.getStatusBadge('confirmed_offer', '2020-01-01');
    expect(badge.isEstimated).toBe(true);
    expect(badge.label).toContain('Aktion abgelaufen');
  });

  it('should calculate budget with buffer percentages', () => {
    const res5 = service.calculateBudgetWithBuffer(100.0, 5);
    expect(res5.bufferAmount).toBe(5.0);
    expect(res5.totalWithBuffer).toBe(105.0);

    const res10 = service.calculateBudgetWithBuffer(25.50, 10);
    expect(res10.bufferAmount).toBe(2.55);
    expect(res10.totalWithBuffer).toBe(28.05);
  });

  it('should format observation dates properly', () => {
    expect(service.formatObservationDate('2026-10-22')).toBe('22.10.2026');
  });
});
