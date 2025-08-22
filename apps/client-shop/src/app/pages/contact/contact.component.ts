import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast'; // Import ToastModule
import { MessageService } from 'primeng/api'; // Import MessageService

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ToastModule // Add ToastModule to imports
  ],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  providers: [MessageService] // Add MessageService to providers
})
export class ContactComponent {
  readonly contactInfo = {
    email: 'contact@mandraime.com',
    phone: '+48 812 121 121', // Raw phone number for copying
    whatsapp: '+48 812 121 121', // Raw WhatsApp number for copying
    companyName: 'MANDRAIME'
  };

  readonly companyDetails = {
    name: 'MANDRAIME SUPPLY SP. Z O.O.',
    address: 'ul. Polna 4C, 32-043 Skała, Poland',
    vatId: '5130293109',
    regon: '528216748',
    krs: '0001097529'
  };

  constructor(private messageService: MessageService) {} // Inject MessageService

  get formattedPhoneNumber(): string {
    const phone = this.contactInfo.phone.replace(/\s/g, ''); // Remove spaces for consistent formatting
    if (phone.startsWith('+48') && phone.length === 12) {
      return `+48 ${phone.substring(3, 5)} ${phone.substring(5, 8)} ${phone.substring(8, 10)} ${phone.substring(10, 12)}`;
    }
    return this.contactInfo.phone; // Return original if not in expected format
  }

  copyToClipboard(text: string, type: string) {
    navigator.clipboard.writeText(text).then(() => {
      let detailMessage = '';
      if (type === 'Email') {
        detailMessage = 'Adres email skopiowany do schowka.';
      } else if (type === 'Numer telefonu') {
        detailMessage = 'Numer telefonu skopiowany do schowka.';
      } else if (type === 'Numer WhatsApp') {
        detailMessage = 'Numer WhatsApp skopiowany do schowka.';
      } else {
        detailMessage = `${type} skopiowany do schowka.`;
      }
      this.messageService.add({ severity: 'success', summary: 'Skopiowano!', detail: detailMessage });
    }).catch(err => {
      console.error('Could not copy text: ', err);
      this.messageService.add({ severity: 'error', summary: 'Błąd', detail: 'Nie udało się skopiować.' });
    });
  }
}
