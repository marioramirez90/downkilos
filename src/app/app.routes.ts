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
    title: 'Down Kilos – Dein persönlicher Abnehmplan',
  },
  {
    path: 'plan',
    redirectTo: 'calculator',
    pathMatch: 'full',
  },
  {
    path: 'retailers',
    loadComponent: () =>
      import('./features/retailers/retailers.component').then((m) => m.RetailersComponent),
    title: 'Down Kilos – Dein Markt',
  },
  {
    path: 'how-it-works',
    loadComponent: () =>
      import('./features/how-it-works/how-it-works.component').then((m) => m.HowItWorksComponent),
    title: 'Down Kilos – So funktioniert Down Kilos',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    title: 'Down Kilos – Dashboard',
  },
  {
    path: 'discover',
    loadComponent: () =>
      import('./features/discover/discover.component').then((m) => m.DiscoverComponent),
    title: 'Down Kilos – Lebensmittel entdecken',
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
    title: 'Down Kilos – Rezepte & Netto-Sortiment',
  },
  {
    path: 'recipes/:id',
    loadComponent: () =>
      import('./features/recipes/recipe-detail/recipe-detail.component').then((m) => m.RecipeDetailComponent),
    title: 'Down Kilos – Rezeptdetails & Kochanleitung',
  },
  {
    path: 'netto-products',
    loadComponent: () =>
      import('./features/netto-products/netto-products.component').then((m) => m.NettoProductsComponent),
    title: 'Down Kilos – Netto-Produkte',
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/admin.component').then((m) => m.AdminComponent),
    title: 'Down Kilos – Administratorbereich',
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
