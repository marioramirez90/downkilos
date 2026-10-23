import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreMapComponent } from './store-map.component';
import { StoreBranch } from '../../../core/models/retailer.model';

describe('StoreMapComponent', () => {
  let component: StoreMapComponent;
  let fixture: ComponentFixture<StoreMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoreMapComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StoreMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the store-map component', () => {
    expect(component).toBeTruthy();
  });

  it('should emit storeSelected event when onSelectStore is called', () => {
    const store: StoreBranch = {
      id: 'netto-1',
      retailerId: 'netto',
      retailerName: 'Netto Marken-Discount',
      brand: 'Netto Marken-Discount',
      name: 'Netto Marken-Discount',
      street: 'Steinstraße 10',
      postalCode: '20095',
      city: 'Hamburg',
      formattedAddress: 'Steinstraße 10, 20095 Hamburg',
      lat: 53.55,
      lng: 10.0,
      isAvailable: true
    };

    let emitted: StoreBranch | undefined;
    component.storeSelected.subscribe((s) => (emitted = s));

    component.onSelectStore(store);
    expect(emitted?.id).toBe('netto-1');
  });
});
