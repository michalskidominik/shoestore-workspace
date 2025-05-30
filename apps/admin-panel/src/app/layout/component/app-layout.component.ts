import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterModule],
  template: `<div class="layout-wrapper">
    <div class="layout-main-container">
      <div class="layout-main">
        <router-outlet></router-outlet>
      </div>
    </div>
  </div> `,
})
export class AppLayoutComponent {}
