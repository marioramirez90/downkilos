import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BottomNavComponent } from './bottom-nav.component';

describe('BottomNavComponent', () => {
  let component: BottomNavComponent;
  let fixture: ComponentFixture<BottomNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomNavComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(BottomNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the bottom nav component', () => {
    expect(component).toBeTruthy();
  });

  it('should render all 5 navigation links (Home, Produkte, Einkaufsliste, Gewicht, Mehr)', () => {
    const el = fixture.nativeElement as HTMLElement;
    const links = el.querySelectorAll('a');
    expect(links.length).toBe(5);

    const text = el.textContent || '';
    expect(text).toContain('Home');
    expect(text).toContain('Produkte');
    expect(text).toContain('Einkaufsliste');
    expect(text).toContain('Gewicht');
    expect(text).toContain('Mehr');
  });
});
