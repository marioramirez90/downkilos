import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { PrivacyComponent } from './privacy.component';

describe('PrivacyComponent', () => {
  let component: PrivacyComponent;
  let fixture: ComponentFixture<PrivacyComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacyComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(PrivacyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the privacy component', () => {
    expect(component).toBeTruthy();
  });

  it('should display legal privacy policy content and draft notice', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Datenschutzerklärung');
    expect(el.textContent).toContain('Mario Ramirez');
    expect(el.textContent).toContain('Gastmodus');
    expect(el.textContent).toContain('Open Food Facts');
  });

  it('should navigate back to settings when clicking back button', () => {
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/settings']);
  });
});
