import { Routes } from '@angular/router';
import { SearchPage } from './pages/search/search.page';

export const routes: Routes = [
   {
    path: '',
    redirectTo: 'search',
    pathMatch: 'full'
  },
  {
    path: 'search',
    component: SearchPage
  },
];
