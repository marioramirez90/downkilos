import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProgressComponent } from './progress.component';
import { StorageService } from '../../core/services/storage.service';
import { CalorieCalculatorService } from '../../core/services/calorie-calculator.service';
import { provideRouter, Router } from '@angular/router';
import { UserProfile } from '../../core/models/user-profile.model';

describe('ProgressComponent', () => {
  let component: ProgressComponent;
  let fixture: ComponentFixture<ProgressComponent>;
  let storageService: StorageService;
  let router: Router;

  const mockProfile: UserProfile = {
    id: 'guest_profile',
    name: 'Mario',
    birthDate: '1990-05-14',
    gender: 'male',
    currentWeight: 80.0,
    height: 180,
    targetWeight: 75.0,
    activityLevel: 'moderate',
    goal: 'lose_weight',
    createdAt: '',
    updatedAt: ''
  };

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [ProgressComponent],
      providers: [
        provideRouter([]),
        StorageService,
        CalorieCalculatorService
      ]
    }).compileComponents();

    storageService = TestBed.inject(StorageService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.spyOn(storageService, 'loadProfile').mockResolvedValue(mockProfile);
    await storageService.saveProfile(mockProfile);

    fixture = TestBed.createComponent(ProgressComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('1. should create the progress component', () => {
    expect(component).toBeTruthy();
  });

  it('2. should display progress metrics and weights based on profile', () => {
    expect(component.currentWeight()).toBe(80.0);
    expect(component.targetWeight()).toBe(75.0);
    expect(component.startWeight()).toBe(80.0);
    expect(component.progressPercent()).toBe(0);
    expect(component.remainingKg()).toBe(5.0);
  });

  it('3. should calculate calorie and macro goals correctly', () => {
    expect(component.dailyCalories()).toBeGreaterThanOrEqual(1200);
    expect(component.proteinGrams()).toBeGreaterThan(0);
    expect(component.carbsGrams()).toBeGreaterThan(0);
    expect(component.fatGrams()).toBeGreaterThan(0);
  });

  it('4. should open and close the add weight modal', () => {
    expect(component.showAddModal).toBe(false);
    component.openAddWeightModal();
    expect(component.showAddModal).toBe(true);
    expect(component.newWeightVal).toBe(component.currentWeight());
  });

  it('5. should save a new weight entry and sync with profile', async () => {
    component.openAddWeightModal();
    component.newWeightVal = 78.5;
    component.newWeightDate = '2026-10-25';
    component.newWeightNote = 'Morgens gewogen';

    await component.saveNewWeight();
    expect(component.showAddModal).toBe(false);

    const entries = component.weightEntries();
    const latest = entries.find(e => e.date === '2026-10-25');
    expect(latest).toBeDefined();
    expect(latest?.weight).toBe(78.5);
    expect(component.currentWeight()).toBe(78.5);
    expect(storageService.profile()?.currentWeight).toBe(78.5);
  });

  it('6. should edit an existing weight entry', async () => {
    await storageService.addWeightEntry(80.0, '2026-10-01', 'Start');
    const entries = component.enrichedWeightEntries();
    expect(entries.length).toBeGreaterThan(0);

    const first = entries[0];
    component.openEditWeightModal(first);
    expect(component.showAddModal).toBe(true);
    expect(component.editingEntryId).toBe(first.id);

    component.newWeightVal = 79.2;
    component.newWeightNote = 'Korrigiert';
    await component.saveNewWeight();

    expect(component.showAddModal).toBe(false);
    expect(component.editingEntryId).toBeNull();
    const updated = component.weightEntries().find(e => e.id === first.id);
    expect(updated?.weight).toBe(79.2);
    expect(updated?.note).toBe('Korrigiert');
  });

  it('7. should enrich entries with weekly labels and diffs', async () => {
    storageService.saveWeightHistory([]);
    await storageService.addWeightEntry(82.0, '2026-10-01', 'Woche 1 Start');
    await storageService.addWeightEntry(81.2, '2026-10-08', 'Woche 2 Wiegetag');
    fixture.detectChanges();

    const enriched = component.enrichedWeightEntries();
    expect(enriched.length).toBe(2);
    expect(enriched[0].weekLabel).toBe('Woche 1');
    expect(enriched[1].weekLabel).toBe('Woche 2');
    expect(enriched[1].diffFormatted).toBe('-0,8 kg');
  });

  it('8. should generate svg chart points for multiple entries', async () => {
    storageService.saveWeightHistory([]);
    await storageService.addWeightEntry(80.0, '2026-10-01');
    await storageService.addWeightEntry(78.5, '2026-10-08');
    fixture.detectChanges();

    const points = component.chartPoints();
    expect(points.length).toBe(2);
    expect(component.chartLinePoints().length).toBeGreaterThan(0);
    expect(component.chartAreaPoints().length).toBeGreaterThan(0);
  });

  it('9. should navigate to settings, calculator and how-it-works', () => {
    component.goToSettings();
    expect(router.navigate).toHaveBeenCalledWith(['/settings']);

    component.goToCaloriePlan();
    expect(router.navigate).toHaveBeenCalledWith(['/calculator']);

    component.goToHowItWorks();
    expect(router.navigate).toHaveBeenCalledWith(['/how-it-works']);
  });

  it('10. should delete weight entry', async () => {
    await storageService.addWeightEntry(77.0, '2026-10-15');
    const entry = component.weightEntries().find(e => e.date === '2026-10-15');
    expect(entry).toBeDefined();

    await component.deleteEntry(entry!.id);
    const deleted = component.weightEntries().find(e => e.id === entry!.id);
    expect(deleted).toBeUndefined();
  });
});
