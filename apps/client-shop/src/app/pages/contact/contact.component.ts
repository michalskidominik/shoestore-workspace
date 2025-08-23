import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    ToastModule,
    InputTextModule,
    CardModule,
    DividerModule
  ],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  providers: [MessageService]
})
export class ContactComponent {
  readonly contactInfo = {
    email: 'contact@mandraime.com',
    phone: '+48 453 085 149',
    whatsapp: '+48 453 085 149',
    companyName: 'MANDRAIME SUPPLY'
  };

  readonly companyDetails = {
    name: 'MANDRAIME SUPPLY SP. Z O.O.',
    address: 'ul. Polna 4C, 32-043 Skała, Poland',
    vatId: '5130293109',
    regon: '528216748',
    krs: '0001097529'
  };

  readonly businessInfo = {
    hours: '24/7 - Always Available',
    languages: ['English', 'Polish'],
    specialization: 'B2B Footwear Wholesale',
    coverage: '27 Countries in Europe'
  };

  protected readonly isSubmitting = signal(false);
  protected contactForm: FormGroup;

  constructor(
    private messageService: MessageService,
    private fb: FormBuilder
  ) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      company: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      subject: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  get formattedPhoneNumber(): string {
    const phone = this.contactInfo.phone.replace(/\s/g, '');
    if (phone.startsWith('+48') && phone.length === 12) {
      return `+48 ${phone.substring(3, 5)} ${phone.substring(5, 8)} ${phone.substring(8, 10)} ${phone.substring(10, 12)}`;
    }
    return this.contactInfo.phone;
  }

  protected getPhoneLink(): string {
    return 'tel:' + this.contactInfo.phone.replace(/\s/g, '');
  }

  protected getWhatsAppLink(): string {
    return 'https://wa.me/' + this.contactInfo.whatsapp.replace(/[^\d]/g, '');
  }

  copyToClipboard(text: string, type: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copied!',
        detail: `${type} copied to clipboard.`
      });
    }).catch(err => {
      console.error('Could not copy text: ', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to copy to clipboard.'
      });
    });
  }

  protected onSubmitContactForm() {
    if (this.contactForm.valid) {
      this.isSubmitting.set(true);

      // Simulate form submission
      setTimeout(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Message Sent!',
          detail: 'Thank you for your inquiry. We will get back to you within 24 hours.'
        });
        this.contactForm.reset();
        this.isSubmitting.set(false);
      }, 2000);
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Form Invalid',
        detail: 'Please fill in all required fields correctly.'
      });
    }
  }
}
