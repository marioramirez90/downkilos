import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HamburgerButtonComponent } from './hamburger-button.component';
import { MenuService } from '../../../core/services/menu.service';

describe('HamburgerButtonComponent', () => {
  let component: HamburgerButtonComponent;
  let fixture: ComponentFixture<HamburgerButtonComponent>;
  let menuService: MenuService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HamburgerButtonComponent],
      providers: [MenuService]
    }).compileComponents();

    menuService = TestBed.inject(MenuService);
    fixture = TestBed.createComponent(HamburgerButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create hamburger button', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle menu on click', () => {
    expect(menuService.isOpen()).toBe(false);

    const button = fixture.nativeElement.querySelector('button');
    button.click();
    expect(menuService.isOpen()).toBe(true);

    button.click();
    expect(menuService.isOpen()).toBe(false);
  });
});
