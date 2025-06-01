import { Component } from '@angular/core';
import { UserListComponent } from './components/user-list/user-list.component';

@Component({
  selector: 'app-users',
  imports: [UserListComponent],
  template: `<app-user-list />`,
})
export class UsersComponent {}
