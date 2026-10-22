import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LogoComponent } from './logo.component';

describe('LogoComponent', () => {
  let component: LogoComponent;
  let fixture: ComponentFixture<LogoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogoComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LogoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the logo component', () => {
    expect(component).toBeTruthy();
  });

  it('should render "Down Kilos" text and leaf SVG', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Down Kilos');
    expect(el.querySelector('svg')).toBeTruthy();
  });
});
