import { Component, input } from '@angular/core';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from '../../../shared/models/menu-item.interface';

@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  imports: [PanelMenuModule],  template: `
    <nav class="sidebar-nav">
      <p-panelMenu
        [model]="menuItems()"
        [multiple]="false"
        styleClass="w-full">
      </p-panelMenu>
    </nav>
  `,
  styles: [`
    .sidebar-nav {
      height: 100%;
      overflow-y: auto;
    }
  `]
})
export class SidebarNavComponent {
  menuItems = input.required<MenuItem[]>();
}
