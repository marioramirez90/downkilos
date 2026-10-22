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
    path: 'calculator',
    loadComponent: () =>
      import('./features/calculator/calculator.component').then((m) => m.CalculatorComponent),
    title: 'Down Kilos – Mein Kalorienbedarf',
  },
  {
    path: 'retailers',
    loadComponent: () =>
      import('./features/retailers/retailers.component').then((m) => m.RetailersComponent),
    title: 'Down Kilos – Dein Markt',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    title: 'Down Kilos – Dashboard',
  },
  {
    path: 'meal-planner',
    loadComponent: () =>
      import('./features/meal-planner/meal-planner.component').then((m) => m.MealPlannerComponent),
    title: 'Down Kilos – Mahlzeitenplan',
  },
  {
    path: 'shopping-list',
    loadComponent: () =>
      import('./features/shopping-list/shopping-list.component').then((m) => m.ShoppingListComponent),
    title: 'Down Kilos – Einkaufsliste',
  },
  {
    path: 'recipes',
    loadComponent: () =>
      import('./features/recipes/recipes.component').then((m) => m.RecipesComponent),
    title: 'Down Kilos – Rezepte',
  },
  {
    path: 'progress',
    loadComponent: () =>
      import('./features/progress/progress.component').then((m) => m.ProgressComponent),
    title: 'Down Kilos – Fortschritt',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
