import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/welcome/welcome.component').then((m) => m.WelcomeComponent),
    title: 'Down Kilos – Willkommen',
  },
  {
    path: 'welcome',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: 'onboarding',
    loadComponent: () =>
      import('./features/onboarding/onboarding.component').then((m) => m.OnboardingComponent),
    title: 'Down Kilos – Profil erstellen',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
