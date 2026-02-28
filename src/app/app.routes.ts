import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'reader',
    loadChildren: () =>
      import('./features/reader/reader.routes').then(m => m.READER_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
