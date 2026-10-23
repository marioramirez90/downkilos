import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { WelcomeComponent } from './welcome.component';

describe('WelcomeComponent', () => {
  let component: WelcomeComponent;
  let fixture: ComponentFixture<WelcomeComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WelcomeComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(WelcomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the welcome screen component', () => {
    expect(component).toBeTruthy();
  });

  it('should display the main headline', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Gesünder essen.');
    expect(el.textContent).toContain('Einfacher abnehmen.');
  });

  it('should display the primary CTA button "Kostenlos starten"', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Kostenlos starten');
  });

  it('should navigate to onboarding on clicking "Kostenlos starten"', () => {
    component.startOnboarding();
    expect(router.navigate).toHaveBeenCalledWith(['/onboarding']);
  });
});
