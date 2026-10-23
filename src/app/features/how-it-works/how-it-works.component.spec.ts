import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HowItWorksComponent } from './how-it-works.component';
import { StorageService } from '../../core/services/storage.service';

describe('HowItWorksComponent', () => {
  let component: HowItWorksComponent;
  let fixture: ComponentFixture<HowItWorksComponent>;
  let router: Router;
  let storageService: StorageService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [HowItWorksComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    router = TestBed.inject(Router);
    storageService = TestBed.inject(StorageService);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(HowItWorksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the how-it-works component', () => {
    expect(component).toBeTruthy();
    expect(component.currentSceneIndex()).toBe(0);
    expect(component.totalScenes).toBe(5);
  });

  it('should step through scenes using nextScene and prevScene', () => {
    component.nextScene();
    expect(component.currentSceneIndex()).toBe(1);

    component.nextScene();
    expect(component.currentSceneIndex()).toBe(2);

    component.prevScene();
    expect(component.currentSceneIndex()).toBe(1);
  });

  it('should skip intro and navigate to /onboarding for new users', () => {
    component.skipIntro();
    expect(router.navigate).toHaveBeenCalledWith(['/onboarding']);
  });

  it('should complete intro on final scene next and navigate to /onboarding for new users', () => {
    component.goToScene(4);
    expect(component.currentSceneIndex()).toBe(4);

    component.finishIntro();
    expect(router.navigate).toHaveBeenCalledWith(['/onboarding']);
  });

  it('should navigate to dashboard if onboarding was already completed', () => {
    vi.spyOn(storageService, 'isOnboardingCompleted').mockReturnValue(true);
    component.finishIntro();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
