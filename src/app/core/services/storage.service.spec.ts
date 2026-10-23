import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';
import { UserProfile } from '../models/user-profile.model';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should save and retrieve profile correctly', async () => {
    const dummyProfile: UserProfile = {
      id: 'guest_profile',
      name: 'Lisa Müller',
      birthDate: '1990-05-14',
      gender: 'female',
      currentWeight: 78,
      height: 168,
      activityLevel: 'sedentary',
      goal: 'lose_weight',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await service.saveProfile(dummyProfile);
    expect(service.profile()?.name).toBe('Lisa Müller');
    expect(service.profile()?.currentWeight).toBe(78);

    const loaded = await service.loadProfile();
    expect(loaded?.name).toBe('Lisa Müller');
  });

  it('should delete profile correctly', async () => {
    const dummyProfile: UserProfile = {
      id: 'guest_profile',
      name: 'Lisa Müller',
      birthDate: '1990-05-14',
      gender: 'female',
      currentWeight: 78,
      height: 168,
      activityLevel: 'sedentary',
      goal: 'lose_weight',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await service.saveProfile(dummyProfile);
    expect(service.profile()).not.toBeNull();

    await service.deleteProfile();
    expect(service.profile()).toBeNull();
  });

  it('should track weight entries and update history', async () => {
    const initialCount = service.weightHistory().length;
    await service.addWeightEntry(67.5, '2026-10-23', 'Testgewicht');

    const updated = service.weightHistory();
    const entry = updated.find(e => e.date === '2026-10-23');
    expect(entry).toBeDefined();
    expect(entry?.weight).toBe(67.5);
    expect(entry?.note).toBe('Testgewicht');
  });

  it('should export all data as valid JSON', async () => {
    const exported = service.exportDataJson();
    const parsed = JSON.parse(exported);
    expect(parsed.app).toBe('Down Kilos');
    expect(parsed.version).toBe('1.0.0');
    expect(Array.isArray(parsed.weightHistory)).toBe(true);
  });

  it('should reset all local data', async () => {
    await service.addWeightEntry(65.0, '2026-10-24');
    await service.resetAllData();
    expect(service.profile()).toBeNull();
    expect(service.weightHistory().length).toBe(0);
  });
});
