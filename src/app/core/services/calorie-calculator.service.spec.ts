import { TestBed } from '@angular/core/testing';
import { CalorieCalculatorService } from './calorie-calculator.service';
import { UserProfile } from '../models/user-profile.model';

describe('CalorieCalculatorService', () => {
  let service: CalorieCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CalorieCalculatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should calculate age correctly from birthdate', () => {
    // A person born in 1990 is around 36 in 2026
    const age = service.calculateAge('1990-05-14');
    expect(age).toBeGreaterThanOrEqual(35);
    expect(age).toBeLessThanOrEqual(37);
  });

  it('should calculate BMR accurately using Mifflin-St. Jeor for women and men', () => {
    // 78kg, 168cm, 36 years old
    // Female formula: 10*78 + 6.25*168 - 5*36 - 161 = 780 + 1050 - 180 - 161 = 1489
    const bmrFemale = service.calculateBmr(78, 168, 36, 'female');
    expect(bmrFemale).toBe(1489);

    // Male formula: 10*78 + 6.25*168 - 5*36 + 5 = 780 + 1050 - 180 + 5 = 1655
    const bmrMale = service.calculateBmr(78, 168, 36, 'male');
    expect(bmrMale).toBe(1655);
  });

  it('should calculate TDEE based on physical activity multipliers', () => {
    const bmr = 1500;
    expect(service.calculateTdee(bmr, 'sedentary')).toBe(1800); // 1.2
    expect(service.calculateTdee(bmr, 'light')).toBe(2063);     // 1.375
    expect(service.calculateTdee(bmr, 'moderate')).toBe(2325);  // 1.55
    expect(service.calculateTdee(bmr, 'very_active')).toBe(2588); // 1.725
  });

  it('should enforce safe minimum calorie limits against crash diets', () => {
    const veryLowCalorieProfile: UserProfile = {
      id: 'test',
      name: 'Anna',
      birthDate: '1995-01-01',
      gender: 'female',
      currentWeight: 45,
      height: 150,
      activityLevel: 'sedentary',
      goal: 'lose_weight',
      createdAt: '',
      updatedAt: ''
    };

    const result = service.calculate(veryLowCalorieProfile);
    expect(result.dailyTargetKcal).toBeGreaterThanOrEqual(service.MIN_SAFE_KCAL_FEMALE);
  });

  it('should calculate balanced macronutrients (protein, carbs, fat)', () => {
    const macros = service.calculateMacros(2000, 78);
    expect(macros.proteinGrams).toBeGreaterThan(0);
    expect(macros.fatGrams).toBeGreaterThan(0);
    expect(macros.carbsGrams).toBeGreaterThan(0);

    const totalKcal = macros.proteinKcal + macros.fatKcal + macros.carbsKcal;
    expect(Math.abs(totalKcal - 2000)).toBeLessThanOrEqual(5);
  });

  it('should calculate weekly and monthly weight loss forecast', () => {
    const forecast = service.calculateForecast(300);
    expect(forecast.weeklyLossKg).toBeCloseTo(0.3, 1);
    expect(forecast.monthlyLossMinKg).toBeGreaterThan(0);
  });
});
