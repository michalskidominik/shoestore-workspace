import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button'; // Import ButtonModule

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule // Add ButtonModule to imports
  ],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent {
  readonly contactInfo = {
    email: 'contact@mandraime.comost',
    phone: '+48 812 121 121',
    whatsapp: '+48 812 121 121',
    companyName: 'MANDRAIME'
  };
}
