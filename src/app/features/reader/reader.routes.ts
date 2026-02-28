import { Routes } from '@angular/router';

export const READER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./reader.component').then(m => m.ReaderComponent),
  },
];
