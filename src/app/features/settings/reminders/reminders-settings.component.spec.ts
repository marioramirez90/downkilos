import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RemindersSettingsComponent } from './reminders-settings.component';
import { MealReminderService } from '../../../core/services/meal-reminder.service';

describe('RemindersSettingsComponent (V5.1)', () => {
  let component: RemindersSettingsComponent;
  let fixture: ComponentFixture<RemindersSettingsComponent>;
  let router: Router;
  let reminderService: MealReminderService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [RemindersSettingsComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    router = TestBed.inject(Router);
    reminderService = TestBed.inject(MealReminderService);

    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.spyOn(reminderService, 'requestPermission').mockResolvedValue(true);

    fixture = TestBed.createComponent(RemindersSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('1. should create the reminders settings component', () => {
    expect(component).toBeTruthy();
  });

  it('2. should toggle master reminder switch and request permission if enabled', async () => {
    expect(component.enabled()).toBe(false);

    await component.toggleMasterEnabled();
    expect(component.enabled()).toBe(true);
    expect(reminderService.settings().enabled).toBe(true);
  });

  it('3. should update customized reminder times', async () => {
    component.breakfastTime.set('11:00');
    component.lunchTime.set('16:00');
    component.dinnerTime.set('20:00');

    await component.onSettingChange();

    expect(reminderService.settings().breakfastTime).toBe('11:00');
    expect(reminderService.settings().lunchTime).toBe('16:00');
    expect(reminderService.settings().dinnerTime).toBe('20:00');
  });

  it('4. should trigger test reminder when clicking test button', async () => {
    const spy = vi.spyOn(reminderService, 'simulateTestReminder').mockResolvedValue();
    await component.testReminderNow('breakfast');
    expect(spy).toHaveBeenCalledWith('breakfast');
  });

  it('5. should navigate back to settings when clicking back button', () => {
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/settings']);
  });
});
