import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { RegistrationRequestService, RegistrationRequest } from '../../core/services/registration-request.service';

@Component({
  selector: 'app-request-access',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    InputTextModule,
    MessageModule,
    CheckboxModule,
    SelectModule
  ],
  templateUrl: './request-access.component.html',
  styleUrl: './request-access.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RequestAccessComponent {
  private registrationService = inject(RegistrationRequestService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Form
  requestForm: FormGroup;

  // State
  readonly loading = this.registrationService.loading;
  readonly error = this.registrationService.error;
  errorMessage = signal<string | null>(null);

  // Country options for dropdown
  readonly countries = [
    { label: 'Austria', value: 'AT' },
    { label: 'Belgium', value: 'BE' },
    { label: 'Bulgaria', value: 'BG' },
    { label: 'Croatia', value: 'HR' },
    { label: 'Cyprus', value: 'CY' },
    { label: 'Czech Republic', value: 'CZ' },
    { label: 'Denmark', value: 'DK' },
    { label: 'Estonia', value: 'EE' },
    { label: 'Finland', value: 'FI' },
    { label: 'France', value: 'FR' },
    { label: 'Germany', value: 'DE' },
    { label: 'Greece', value: 'GR' },
    { label: 'Hungary', value: 'HU' },
    { label: 'Ireland', value: 'IE' },
    { label: 'Italy', value: 'IT' },
    { label: 'Latvia', value: 'LV' },
    { label: 'Lithuania', value: 'LT' },
    { label: 'Luxembourg', value: 'LU' },
    { label: 'Malta', value: 'MT' },
    { label: 'Netherlands', value: 'NL' },
    { label: 'Poland', value: 'PL' },
    { label: 'Portugal', value: 'PT' },
    { label: 'Romania', value: 'RO' },
    { label: 'Slovakia', value: 'SK' },
    { label: 'Slovenia', value: 'SI' },
    { label: 'Spain', value: 'ES' },
    { label: 'Sweden', value: 'SE' }
  ];

  constructor() {
    this.requestForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      companyName: ['', [Validators.required, Validators.minLength(2)]],
      vatId: ['', [Validators.required, Validators.minLength(5)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[+]?[\d\s\-()]+$/)]],
      street: ['', [Validators.required]],
      city: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      country: ['', [Validators.required]],
      acceptsTerms: [false, [Validators.requiredTrue]]
    });

    // Clear service state when component loads
    this.registrationService.clearState();
  }

  async onSubmit(): Promise<void> {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);

    const formValue = this.requestForm.value;
    const request: RegistrationRequest = {
      email: formValue.email,
      companyName: formValue.companyName,
      vatId: formValue.vatId,
      phoneNumber: formValue.phoneNumber,
      deliveryAddress: {
        street: formValue.street,
        city: formValue.city,
        postalCode: formValue.postalCode,
        country: formValue.country
      },
      acceptsTerms: formValue.acceptsTerms
    };

    const result = await this.registrationService.submitRegistrationRequest(request);

    if (result.success) {
      this.router.navigate(['/request-access-success']);
    } else {
      this.errorMessage.set(result.message);
    }
  }

  // Helper methods for form validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.requestForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.requestForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${this.capitalize(fieldName)} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['minlength']) return `${this.capitalize(fieldName)} is too short`;
      if (field.errors['pattern']) return 'Please enter a valid phone number';
      if (field.errors['requiredTrue']) return 'You must accept the terms and conditions';
    }
    return '';
  }

  private capitalize(text: string): string {
    if (!text) return '';
    // Convert camelCase to readable text
    const readable = text.replace(/([A-Z])/g, ' $1').toLowerCase();
    return readable.charAt(0).toUpperCase() + readable.slice(1);
  }
}
