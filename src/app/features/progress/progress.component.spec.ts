import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProgressComponent } from './progress.component';
import { StorageService } from '../../core/services/storage.service';
import { CalorieCalculatorService } from '../../core/services/calorie-calculator.service';
import { provideRouter } from '@angular/router';

describe('ProgressComponent', () => {
  let component: ProgressComponent;
  let fixture: ComponentFixture<ProgressComponent>;
  let storageService: StorageService;

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
    fixture = TestBed.createComponent(ProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the progress component', () => {
    expect(component).toBeTruthy();
  });

  it('should display progress metrics and current weight', () => {
    expect(component.currentWeight()).toBeGreaterThan(30);
    expect(component.targetWeight()).toBeGreaterThan(30);
    expect(component.progressPercent()).toBeGreaterThanOrEqual(0);
  });

  it('should calculate calorie and macro goals correctly', () => {
    expect(component.dailyCalories()).toBeGreaterThanOrEqual(1200);
    expect(component.proteinGrams()).toBeGreaterThan(0);
    expect(component.carbsGrams()).toBeGreaterThan(0);
    expect(component.fatGrams()).toBeGreaterThan(0);
  });

  it('should open and close the add weight modal', () => {
    expect(component.showAddModal).toBe(false);
    component.openAddWeightModal();
    expect(component.showAddModal).toBe(true);
    expect(component.newWeightVal).toBe(component.currentWeight());
  });

  it('should save a new weight entry', async () => {
    component.newWeightVal = 67.2;
    component.newWeightDate = '2026-10-25';
    component.newWeightNote = 'Gutes Training';

    await component.saveNewWeight();
    expect(component.showAddModal).toBe(false);

    const latest = component.weightEntries().find(e => e.date === '2026-10-25');
    expect(latest).toBeDefined();
    expect(latest?.weight).toBe(67.2);
  });

  it('should generate svg chart points for multiple entries', () => {
    const points = component.chartPoints();
    expect(points.length).toBeGreaterThanOrEqual(2);
    expect(component.chartLinePoints().length).toBeGreaterThan(0);
    expect(component.chartAreaPoints().length).toBeGreaterThan(0);
  });
});
