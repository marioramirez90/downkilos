import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { WeightComponent } from './weight.component';
import { StorageService } from '../../core/services/storage.service';

describe('WeightComponent', () => {
  let component: WeightComponent;
  let fixture: ComponentFixture<WeightComponent>;
  let router: Router;
  let storageService: StorageService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [WeightComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    router = TestBed.inject(Router);
    storageService = TestBed.inject(StorageService);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(WeightComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the weight component', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate back to dashboard when clicking back button', () => {
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should save a new weight entry and persist in storage', async () => {
    component.inputWeight = 74.2;
    component.inputDate = '2026-10-24';
    component.inputNote = 'Test Messung';

    await component.saveWeight();

    expect(storageService.weightHistory().length).toBeGreaterThan(0);
    const latest = storageService.weightHistory()[storageService.weightHistory().length - 1];
    expect(latest.weight).toBe(74.2);
    expect(component.toastMessage()).toContain('erfolgreich gespeichert');
  });

  it('should delete a weight entry', async () => {
    await storageService.addWeightEntry(73.5, '2026-10-23');
    const entry = storageService.weightHistory()[0];

    await component.deleteEntry(entry.id);
    expect(storageService.weightHistory().find(e => e.id === entry.id)).toBeUndefined();
  });
});
