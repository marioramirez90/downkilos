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

  it('should display Netto Marken-Discount as active selected card', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Netto Marken-Discount');
    expect(el.textContent).toContain('Aktiv ausgewählt');
  });

  it('should show coming soon alert when clicking other retailers', () => {
    const rewe = component.otherRetailers.find(r => r.id === 'rewe')!;
    component.onSelectOtherRetailer(rewe);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Coming soon – REWE wird bald unterstützt.');
  });

  it('should update location when searching', () => {
    component.searchLocationQuery = 'Hamburg';
    component.applyLocationSearch();
    fixture.detectChanges();

    expect(component.currentBranch().city).toContain('Hamburg');
  });

  it('should save retailer preference and navigate to /dashboard on confirm', async () => {
    const saveSpy = vi.spyOn(retailerService, 'savePreference');
    await component.confirmSelection();

    expect(saveSpy).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
