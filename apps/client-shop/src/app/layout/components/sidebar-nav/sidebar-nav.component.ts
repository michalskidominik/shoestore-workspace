import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MenuItem } from '../../../shared/models/menu-item.interface';

@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar-nav.component.html',
  styleUrl: './sidebar-nav.component.scss',
})
export class SidebarNavComponent {
  menuItems = input.required<MenuItem[]>();
}
