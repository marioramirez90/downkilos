import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { WeightComponent } from './weight.component';
import { StorageService } from '../../core/services/storage.service';
import { UserProfile } from '../../core/models/user-profile.model';

describe('WeightComponent V2.0', () => {
  let component: WeightComponent;
  let fixture: ComponentFixture<WeightComponent>;
  let router: Router;
  let storageService: StorageService;

  const mockProfile: UserProfile = {
    id: 'guest_profile',
    name: 'Lisa',
    birthDate: '1992-06-15',
    gender: 'female',
    currentWeight: 98,
    height: 168,
    targetWeight: 88,
    activityLevel: 'moderate',
    goal: 'lose_weight',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [WeightComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    router = TestBed.inject(Router);
    storageService = TestBed.inject(StorageService);
    storageService.profile.set(mockProfile);
    vi.spyOn(storageService, 'loadProfile').mockImplementation(async () => {
      storageService.profile.set(mockProfile);
      return mockProfile;
    });
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(WeightComponent);
    component = fixture.componentInstance;
    await component.ngOnInit();
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('1. should create the weight component', () => {
    expect(component).toBeTruthy();
  });

  it('2. should display current weight and calculate remaining kg to target weight (98 kg - 88 kg = 10 kg)', () => {
    expect(component.currentWeight()).toBe(98);
    expect(component.targetWeight()).toBe(88);
    expect(component.remainingKg()).toBe(10);
    expect(component.remainingKgFormatted()).toBe('10');
    expect(component.goalStatus()).toBe('lose');

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Aktuelles Gewicht');
    expect(el.textContent).toContain('98 kg');
    expect(el.textContent).toContain('10 Kilo');
    expect(el.textContent).toContain('Wunschgewicht');
  });

  it('3. should NOT contain a pencil icon or "Neuen Eintrag" button in the top card', () => {
    const el = fixture.nativeElement as HTMLElement;
    const topCard = el.querySelector('.hero-weight-card');
    expect(topCard).toBeTruthy();
    expect(topCard?.textContent).not.toContain('Neuen Eintrag');
    expect(topCard?.textContent).not.toContain('✏️');
  });

  it('4. should render single prominent + button for new weight entry', () => {
    const el = fixture.nativeElement as HTMLElement;
    const addBtn = el.querySelector('#btn-add-new-weight');
    expect(addBtn).toBeTruthy();
    expect(addBtn?.textContent).toContain('Neues Gewicht eintragen');
  });

  it('5. should open modal when clicking + Neues Gewicht eintragen', () => {
    expect(component.showModal()).toBe(false);
    component.openNewWeightModal();
    expect(component.showModal()).toBe(true);
    expect(component.editingEntryId()).toBeNull();
  });

  it('6. should save new weight and automatically update current weight, remaining kg and chart', async () => {
    component.openNewWeightModal();
    component.inputWeight.set(96.5);
    const today = new Date().toISOString().split('T')[0];
    component.inputDate.set(today);
    await component.saveWeight();

    expect(component.currentWeight()).toBe(96.5);
    expect(component.remainingKg()).toBe(8.5);
    expect(component.remainingKgFormatted()).toBe('8,5');
    expect(component.showModal()).toBe(false);
    expect(component.toastMessage()).toContain('96.5');
  });

  it('7. should display Meine Einträge and toggle show all', async () => {
    await storageService.addWeightEntry(98, '2026-05-01');
    await storageService.addWeightEntry(97, '2026-05-08');

    fixture.detectChanges();
    expect(component.enrichedEntries().length).toBeGreaterThanOrEqual(2);

    expect(component.showAllEntries()).toBe(false);
    component.toggleShowAll();
    expect(component.showAllEntries()).toBe(true);
  });

  it('8. should calculate Dein Fortschritt correctly when weight is lost', () => {
    storageService.saveWeightHistory([
      { id: '1', date: '2026-10-01', weight: 98 },
      { id: '2', date: '2026-10-15', weight: 95 }
    ]);

    fixture.detectChanges();
    expect(component.lostSoFar()).toBe(3);
    expect(component.lostSoFarFormatted()).toBe('3,0');
  });

  it('9. should generate SVG chart data for entries', () => {
    storageService.saveWeightHistory([
      { id: '1', date: '2026-10-01', weight: 80 },
      { id: '2', date: '2026-10-15', weight: 78 }
    ]);

    const data = component.chartData();
    expect(data.points.length).toBeGreaterThanOrEqual(2);
    expect(data.polyLine).toBeTruthy();
    expect(data.areaPoints).toBeTruthy();
  });

  it('10. should navigate back to dashboard when clicking back button', () => {
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
