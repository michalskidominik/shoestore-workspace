import { Component } from '@angular/core';
import { ShoeListComponent } from './components/shoes-list/shoe-list.component';

@Component({
  selector: 'app-shoes',
  imports: [ShoeListComponent],
  template: `<app-shoe-list />`,
})
export class ShoesComponent {}
