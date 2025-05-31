import { Route } from '@angular/router';
import { AppLayoutComponent } from './layout/component/app-layout.component';
import { ShoesComponent } from './pages/shoes/shoes.component';
import { NotfoundComponent } from './pages/shoes/notfound/notfound.component';

export const appRoutes: Route[] = [
  {
    path: '',
    component: AppLayoutComponent,
    children: [{ path: '', component: ShoesComponent }],
  },
      { path: 'notfound', component: NotfoundComponent },
  { path: '**', redirectTo: '/notfound' }
];
