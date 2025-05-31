import { Route } from '@angular/router';
import { AppLayoutComponent } from './layout/component/app-layout.component';
import { ShoesComponent } from './pages/shoes/shoes.component';
import { NotfoundComponent } from './pages/shoes/notfound/notfound.component';
import { ShoeFormComponent } from './pages/shoes/components/shoe-form/shoe-form.component';
import { SizeTemplateListComponent } from './pages/size-templates/components/size-template-list.component';
import { SizeTemplateFormComponent } from './pages/size-templates/components/size-template-form-component/size-template-form.component';

export const appRoutes: Route[] = [
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      { path: '', component: ShoesComponent },
      { path: 'shoes/new', component: ShoeFormComponent },
      { path: 'shoes/:id/edit', component: ShoeFormComponent },
      { path: 'size-templates', component: SizeTemplateListComponent },
      { path: 'size-templates/new', component: SizeTemplateFormComponent },
      { path: 'size-templates/:id/edit', component: SizeTemplateFormComponent },
    ],
  },
  { path: 'notfound', component: NotfoundComponent },
  { path: '**', redirectTo: '/notfound' },
];
