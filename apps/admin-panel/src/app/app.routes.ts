import { Route } from '@angular/router';
import { AppLayoutComponent } from './layout/component/app-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const appRoutes: Route[] = [
  {
    path: '',
    component: AppLayoutComponent,
    children: [{ path: '', component: DashboardComponent }],
  },
];
