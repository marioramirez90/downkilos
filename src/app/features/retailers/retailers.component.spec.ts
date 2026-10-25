import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RetailersComponent } from './retailers.component';
import { RetailerService } from '../../core/services/retailer.service';

describe('RetailersComponent', () => {
  let component: RetailersComponent;
  let fixture: ComponentFixture<RetailersComponent>;
  let router: Router;
  let retailerService: RetailerService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [RetailersComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    router = TestBed.inject(Router);
    retailerService = TestBed.inject(RetailerService);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(RetailersComponent);
    component = fixture.componentInstance;
    await component.ngOnInit();
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the retailers component', () => {
    expect(component).toBeTruthy();
  });

  it('should show Dein Markt and market selection with Netto and other retailers', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Dein Markt');
    expect(el.textContent).toContain('Wähle deinen Lieblingssupermarkt');
    expect(el.textContent).toContain('Netto');
    expect(el.textContent).toContain('Marken-Discount');
    expect(el.textContent).toContain('Weitere Märkte');
    expect(el.textContent).toContain('REWE');
    expect(el.textContent).toContain('EDEKA');
    expect(el.textContent).toContain('Lidl');
    expect(el.textContent).toContain('Coming soon');
  });

  it('should select Netto by default and clear any coming soon notice', () => {
    expect(component.selectedRetailer()).toBe('netto');
    expect(component.comingSoonNotice()).toBeNull();
  });

  it('should show a coming soon notice when selecting a non-Netto retailer', () => {
    component.selectRetailer('rewe');
    fixture.detectChanges();

    expect(component.comingSoonNotice()).toContain('REWE: Coming soon');
    expect(component.comingSoonNotice()).toContain('Netto Marken-Discount verfügbar');
  });

  it('should allow selecting Netto again after clicking another market', () => {
    component.selectRetailer('edeka');
    expect(component.comingSoonNotice()).not.toBeNull();

    component.selectRetailer('netto');
    expect(component.selectedRetailer()).toBe('netto');
    expect(component.comingSoonNotice()).toBeNull();
  });

  it('should save preference without inventing fake addresses and navigate to /loading', async () => {
    const saveSpy = vi.spyOn(retailerService, 'savePreference');
    component.weeklyBudget = 45;

    await component.confirmSelection();

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        retailerId: 'netto',
        retailerName: 'Netto Marken-Discount',
        weeklyBudget: 45
      })
    );
    expect(router.navigate).toHaveBeenCalledWith(['/dietary-profile']);
  });

  it('should navigate back to /calculator when clicking back button', () => {
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/calculator']);
  });

  it('should render the Weiter button in footer with full accessibility', () => {
    const el = fixture.nativeElement as HTMLElement;
    const btn = el.querySelector('#btn-confirm-retailer') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.disabled).toBe(false);
    expect(btn.textContent).toContain('Weiter');
  });

  it('should update weekly budget when modified', async () => {
    component.weeklyBudget = 60;
    await component.confirmSelection();
    expect(component.weeklyBudget).toBe(60);
  });
});
