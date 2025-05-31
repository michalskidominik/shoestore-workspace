import { Component } from '@angular/core';
import { SizeTemplateListComponent } from './components/size-template-list.component';

@Component({
  selector: 'app-size-templates',
  imports: [SizeTemplateListComponent],
  template: `<app-size-template-list />`,
})
export class SizeTemplatesComponent {}
