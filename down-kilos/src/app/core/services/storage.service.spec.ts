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
});
