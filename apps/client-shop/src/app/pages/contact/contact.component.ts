import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-contact',
  standalone: true,  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    InputTextarea,
    DropdownModule,
    MessageModule,
    DividerModule
  ],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent {
  private fb = inject(FormBuilder);

  // Form and state management
  contactForm: FormGroup;
  loading = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  readonly inquiryTypes = [
    { label: 'General Inquiry', value: 'general' },
    { label: 'Product Support', value: 'support' },
    { label: 'Order Status', value: 'order' },
    { label: 'Returns & Exchanges', value: 'returns' },
    { label: 'Business Partnership', value: 'partnership' },
    { label: 'Other', value: 'other' }
  ];

  readonly contactInfo = {
    email: 'support@sgats.com',
    phone: '+1 (555) 123-4567',
    address: '123 Shoe Street, Fashion District, New York, NY 10001',
    hours: {
      weekdays: 'Monday - Friday: 9:00 AM - 6:00 PM EST',
      weekends: 'Saturday - Sunday: 10:00 AM - 4:00 PM EST'
    }
  };

  readonly socialLinks = [
    { name: 'Facebook', icon: 'pi pi-facebook', url: '#' },
    { name: 'Twitter', icon: 'pi pi-twitter', url: '#' },
    { name: 'Instagram', icon: 'pi pi-instagram', url: '#' },
    { name: 'LinkedIn', icon: 'pi pi-linkedin', url: '#' }
  ];

  constructor() {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      inquiryType: ['', Validators.required],
      subject: ['', [Validators.required, Validators.minLength(5)]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));      this.successMessage.set('Thank you for your message! We will get back to you within 24 hours.');
      this.contactForm.reset();
    } catch {
      this.errorMessage.set('Sorry, there was an error sending your message. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  // Helper methods for form validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `${fieldName} must be at least ${requiredLength} characters`;
      }
    }
    return '';
  }
}
