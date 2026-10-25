import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MoreComponent } from './more.component';

describe('MoreComponent', () => {
  let component: MoreComponent;
  let fixture: ComponentFixture<MoreComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoreComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(MoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('1. should create the MoreComponent', () => {
    expect(component).toBeTruthy();
  });

  it('2. should display the "Mehr entdecken" title and subtitle', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.page-title')?.textContent).toContain('Mehr entdecken');
    expect(el.querySelector('.page-subtitle')?.textContent).toContain('Deine weiteren Down-Kilos-Funktionen.');
  });

  it('3. should render the primary cards including Produkte entdecken', () => {
    const el = fixture.nativeElement as HTMLElement;
    const cards = el.querySelectorAll('.primary-card');
    expect(cards.length).toBe(5);

    const cardTexts = Array.from(cards).map(c => c.textContent || '');
    expect(cardTexts[0]).toContain('Produkte entdecken');
    expect(cardTexts[1]).toContain('Rezepte entdecken');
    expect(cardTexts[2]).toContain('Meine Fortschritte');
    expect(cardTexts[3]).toContain('Mein Profil & Ziele');
    expect(cardTexts[4]).toContain('Einstellungen');
  });

  it('4. should navigate to /discover when clicking Produkte card', () => {
    const el = fixture.nativeElement as HTMLElement;
    const prodCard = el.querySelector('#card-products') as HTMLElement;
    prodCard.click();
    expect(router.navigate).toHaveBeenCalledWith(['/discover']);
  });

  it('4b. should navigate to /recipes when clicking Rezepte card', () => {
    const el = fixture.nativeElement as HTMLElement;
    const recipeCard = el.querySelector('#card-recipes') as HTMLElement;
    recipeCard.click();
    expect(router.navigate).toHaveBeenCalledWith(['/recipes']);
  });

  it('5. should navigate to /progress when clicking Fortschritte card', () => {
    const el = fixture.nativeElement as HTMLElement;
    const progressCard = el.querySelector('#card-progress') as HTMLElement;
    progressCard.click();
    expect(router.navigate).toHaveBeenCalledWith(['/progress']);
  });

  it('6. should navigate to /settings/profile (NOT onboarding) when clicking Profil & Ziele card', () => {
    const el = fixture.nativeElement as HTMLElement;
    const profileCard = el.querySelector('#card-profile') as HTMLElement;
    profileCard.click();
    expect(router.navigate).toHaveBeenCalledWith(['/settings/profile']);
    expect(router.navigate).not.toHaveBeenCalledWith(['/onboarding']);
  });

  it('7. should navigate to /settings when clicking Einstellungen card', () => {
    const el = fixture.nativeElement as HTMLElement;
    const settingsCard = el.querySelector('#card-settings') as HTMLElement;
    settingsCard.click();
    expect(router.navigate).toHaveBeenCalledWith(['/settings']);
  });

  it('7b. should navigate to /dietary-profile when clicking Ernährungsprofil card', () => {
    const el = fixture.nativeElement as HTMLElement;
    const dietaryCard = el.querySelector('#card-dietary') as HTMLElement;
    dietaryCard.click();
    expect(router.navigate).toHaveBeenCalledWith(['/dietary-profile'], {
      queryParams: { returnUrl: '/more' }
    });
  });

  it('8. should render bottom navigation', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-bottom-nav')).toBeTruthy();
  });
});
