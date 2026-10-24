import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ImprintComponent } from './imprint.component';

describe('ImprintComponent', () => {
  let component: ImprintComponent;
  let fixture: ComponentFixture<ImprintComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImprintComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(ImprintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the imprint component', () => {
    expect(component).toBeTruthy();
  });

  it('should display provider identification and disclaimers', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Impressum');
    expect(el.textContent).toContain('Mario Ramirez');
    expect(el.textContent).toContain('Wichtiger medizinischer Hinweis');
    expect(el.textContent).toContain('Marken- und Händlerunabhängigkeit');
    expect(el.textContent).toContain('Netto Marken-Discount');
  });

  it('should navigate back to settings when clicking back button', () => {
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/settings']);
  });
});
