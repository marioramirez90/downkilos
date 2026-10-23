import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarMenuComponent } from './sidebar-menu.component';
import { MenuService } from '../../../core/services/menu.service';
import { StorageService } from '../../../core/services/storage.service';
import { provideRouter } from '@angular/router';

describe('SidebarMenuComponent', () => {
  let component: SidebarMenuComponent;
  let fixture: ComponentFixture<SidebarMenuComponent>;
  let menuService: MenuService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [SidebarMenuComponent],
      providers: [
        provideRouter([]),
        MenuService,
        StorageService
      ]
    }).compileComponents();

    menuService = TestBed.inject(MenuService);
    fixture = TestBed.createComponent(SidebarMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create sidebar menu component', () => {
    expect(component).toBeTruthy();
  });

  it('should close menu when closeMenu is called', () => {
    menuService.open();
    expect(menuService.isOpen()).toBe(true);

    component.closeMenu();
    expect(menuService.isOpen()).toBe(false);
  });
});
