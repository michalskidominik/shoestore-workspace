import { Component, inject, signal, ChangeDetectionStrategy, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// PrimeNG imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';
import { TabsModule } from 'primeng/tabs';

// Store imports
import { AuthStore, PasswordChangeRequest, AddressUpdateRequest } from '../../core/stores/auth.store';
import { ToastStore } from '../../shared/stores/toast.store';
import { AuthApiService } from '../../core/services/auth-api.service';

// Email change step type
type EmailChangeStep = 'initial' | 'verify-old' | 'verify-new' | 'complete';

// Countries constant to avoid recreation
const EU_COUNTRIES = [
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

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    SelectModule,
    MessageModule,
    ProgressSpinnerModule,
    DividerModule,
    TabsModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnDestroy {
  // Injected services
  private authStore = inject(AuthStore);
  private toastStore = inject(ToastStore);
  private authApiService = inject(AuthApiService);
  private fb = inject(FormBuilder);

  // State signals
  readonly currentUser = this.authStore.user;
  readonly addressUpdateLoading = this.authStore.addressUpdateLoading;
  readonly passwordChangeLoading = this.authStore.passwordChangeLoading;
  readonly emailChangeLoading = this.authStore.emailChangeLoading;

  // Email change state
  readonly emailChangeStep = signal<EmailChangeStep>('initial');
  readonly emailChangeData = signal<{
    newEmail: string;
    oldEmailToken: string;
    newEmailToken: string;
    oldTokenExpiry?: Date;
    newTokenExpiry?: Date;
  }>({
    newEmail: '',
    oldEmailToken: '',
    newEmailToken: ''
  });

  // Timer states
  readonly oldTokenTimeLeft = signal<number>(0);
  readonly newTokenTimeLeft = signal<number>(0);
  readonly canResendOldToken = signal<boolean>(true);
  readonly canResendNewToken = signal<boolean>(true);
  readonly resendOldCooldown = signal<number>(0);
  readonly resendNewCooldown = signal<number>(0);

  // Timer interval reference for cleanup
  private timerInterval?: ReturnType<typeof setInterval>;

  // Forms
  addressForm!: FormGroup;
  passwordForm!: FormGroup;
  emailForm!: FormGroup;
  oldTokenForm!: FormGroup;
  newTokenForm!: FormGroup;

  // Country options
  readonly countries = EU_COUNTRIES;

  constructor() {
    this.initializeForms();
    this.setupTimers();
    this.populateAddressForm();
  }

  // Form validation methods
  isAddressFormDirty(): boolean {
    return this.addressForm?.dirty || false;
  }

  isPasswordFormValid(): boolean {
    return this.passwordForm?.valid || false;
  }

  isEmailFormValid(): boolean {
    return this.emailForm?.valid || false;
  }

  private initializeForms(): void {
    // Address form (shipping and billing)
    this.addressForm = this.fb.group({
      shippingStreet: ['', [Validators.required]],
      shippingCity: ['', [Validators.required]],
      shippingPostalCode: ['', [Validators.required]],
      shippingCountry: ['', [Validators.required]],
      billingStreet: ['', [Validators.required]],
      billingCity: ['', [Validators.required]],
      billingPostalCode: ['', [Validators.required]],
      billingCountry: ['', [Validators.required]]
    });

    // Password change form
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    // Email change forms
    this.emailForm = this.fb.group({
      newEmail: ['', [Validators.required, Validators.email]]
    });

    this.oldTokenForm = this.fb.group({
      token: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });

    this.newTokenForm = this.fb.group({
      token: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  private passwordMatchValidator(group: FormGroup): { passwordMismatch: boolean } | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  private populateAddressForm(): void {
    effect(() => {
      const user = this.currentUser();
      if (user && this.addressForm) {
        this.addressForm.patchValue({
          shippingStreet: user.shippingAddress.street,
          shippingCity: user.shippingAddress.city,
          shippingPostalCode: user.shippingAddress.postalCode,
          shippingCountry: user.shippingAddress.country,
          billingStreet: user.billingAddress.street,
          billingCity: user.billingAddress.city,
          billingPostalCode: user.billingAddress.postalCode,
          billingCountry: user.billingAddress.country
        });
        this.addressForm.markAsPristine();
      }
    });
  }

  private setupTimers(): void {
    // Setup token expiry timers
    this.timerInterval = setInterval(() => {
      const data = this.emailChangeData();
      
      if (data.oldTokenExpiry) {
        const timeLeft = Math.max(0, Math.floor((data.oldTokenExpiry.getTime() - Date.now()) / 1000));
        this.oldTokenTimeLeft.set(timeLeft);
      }
      
      if (data.newTokenExpiry) {
        const timeLeft = Math.max(0, Math.floor((data.newTokenExpiry.getTime() - Date.now()) / 1000));
        this.newTokenTimeLeft.set(timeLeft);
      }

      // Update resend cooldowns
      if (this.resendOldCooldown() > 0) {
        this.resendOldCooldown.update(val => Math.max(0, val - 1));
        if (this.resendOldCooldown() === 0) {
          this.canResendOldToken.set(true);
        }
      }

      if (this.resendNewCooldown() > 0) {
        this.resendNewCooldown.update(val => Math.max(0, val - 1));
        if (this.resendNewCooldown() === 0) {
          this.canResendNewToken.set(true);
        }
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  // Address update methods
  copyShippingToBilling(): void {
    const shippingValues = {
      billingStreet: this.addressForm.get('shippingStreet')?.value,
      billingCity: this.addressForm.get('shippingCity')?.value,
      billingPostalCode: this.addressForm.get('shippingPostalCode')?.value,
      billingCountry: this.addressForm.get('shippingCountry')?.value
    };
    this.addressForm.patchValue(shippingValues);
  }

  onSaveAddress(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    const formValue = this.addressForm.value;
    const addressUpdate: AddressUpdateRequest = {
      shippingAddress: {
        street: formValue.shippingStreet,
        city: formValue.shippingCity,
        postalCode: formValue.shippingPostalCode,
        country: formValue.shippingCountry
      },
      billingAddress: {
        street: formValue.billingStreet,
        city: formValue.billingCity,
        postalCode: formValue.billingPostalCode,
        country: formValue.billingCountry
      }
    };

    this.authStore.updateAddress(addressUpdate);
  }

  // Password change methods
  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const formValue = this.passwordForm.value;
    const passwordChange: PasswordChangeRequest = {
      currentPassword: formValue.currentPassword,
      newPassword: formValue.newPassword
    };

    // Clear any previous errors
    this.passwordForm.get('currentPassword')?.setErrors(null);
    
    // Use store method which handles loading state automatically
    this.authStore.changePassword(passwordChange);
    
    // Reset form on success (we could also listen to store state changes)
    setTimeout(() => {
      if (!this.passwordChangeLoading()) {
        this.passwordForm.reset();
      }
    }, 100);
  }

  // Email change methods
  onInitiateEmailChange(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    const newEmail = this.emailForm.value.newEmail;
    this.authStore.setEmailChangeLoading(true);
    
    this.authApiService.initiateEmailChange(newEmail).subscribe({
      next: (response) => {
        this.authStore.setEmailChangeLoading(false);
        this.emailChangeData.update(data => ({
          ...data,
          newEmail,
          oldEmailToken: response.token,
          oldTokenExpiry: new Date(response.expiresAt)
        }));
        this.emailChangeStep.set('verify-old');
        
        // Show token in alert for development
        alert(`Token sent to your current email: ${response.token}`);
        this.toastStore.showInfo(`Verification code sent to your current email`);
      },
      error: (error: unknown) => {
        this.authStore.setEmailChangeLoading(false);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        this.toastStore.showError(errorMessage || 'Failed to initiate email change');
      }
    });
  }

  onVerifyOldToken(): void {
    if (this.oldTokenForm.invalid) {
      this.oldTokenForm.markAllAsTouched();
      return;
    }

    const token = this.oldTokenForm.value.token;
    const data = this.emailChangeData();
    
    this.authStore.setEmailChangeLoading(true);
    
    this.authApiService.verifyOldEmailToken(token, data.newEmail).subscribe({
      next: (response) => {
        this.authStore.setEmailChangeLoading(false);
        this.emailChangeData.update(current => ({
          ...current,
          newEmailToken: response.token,
          newTokenExpiry: new Date(response.expiresAt)
        }));
        this.emailChangeStep.set('verify-new');
        
        // Show token in alert for development
        alert(`Token sent to your new email (${data.newEmail}): ${response.token}`);
        this.toastStore.showInfo(`Verification code sent to ${data.newEmail}`);
      },
      error: (error: unknown) => {
        this.authStore.setEmailChangeLoading(false);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        this.toastStore.showError(errorMessage || 'Invalid verification code');
      }
    });
  }

  onVerifyNewToken(): void {
    if (this.newTokenForm.invalid) {
      this.newTokenForm.markAllAsTouched();
      return;
    }

    const token = this.newTokenForm.value.token;
    const data = this.emailChangeData();
    
    this.authStore.setEmailChangeLoading(true);
    
    this.authApiService.verifyNewEmailToken(token, data.newEmail).subscribe({
      next: () => {
        this.authStore.setEmailChangeLoading(false);
        this.authStore.updateUserEmail(data.newEmail);
        this.emailChangeStep.set('complete');
        this.toastStore.showSuccess('Email address updated successfully');
        
        // Reset email change flow after 3 seconds
        setTimeout(() => {
          this.resetEmailChangeFlow();
        }, 3000);
      },
      error: (error: unknown) => {
        this.authStore.setEmailChangeLoading(false);
        const errorMessage = error instanceof Error ? error.message : 'Invalid verification code';
        this.toastStore.showError(errorMessage);
      }
    });
  }

  onResendOldToken(): void {
    if (!this.canResendOldToken()) return;
    
    const data = this.emailChangeData();
    this.authStore.setEmailChangeLoading(true);
    
    this.authApiService.initiateEmailChange(data.newEmail).subscribe({
      next: (response) => {
        this.authStore.setEmailChangeLoading(false);
        this.emailChangeData.update(current => ({
          ...current,
          oldEmailToken: response.token,
          oldTokenExpiry: new Date(response.expiresAt)
        }));
        
        // Start cooldown
        this.canResendOldToken.set(false);
        this.resendOldCooldown.set(60);
        
        alert(`New token sent to your current email: ${response.token}`);
        this.toastStore.showInfo('New verification code sent to your current email');
      },
      error: (error: unknown) => {
        this.authStore.setEmailChangeLoading(false);
        const errorMessage = error instanceof Error ? error.message : 'Failed to resend verification code';
        this.toastStore.showError(errorMessage);
      }
    });
  }

  onResendNewToken(): void {
    if (!this.canResendNewToken()) return;
    
    const data = this.emailChangeData();
    const token = this.oldTokenForm.value.token;
    
    this.authStore.setEmailChangeLoading(true);
    
    this.authApiService.verifyOldEmailToken(token, data.newEmail).subscribe({
      next: (response) => {
        this.authStore.setEmailChangeLoading(false);
        this.emailChangeData.update(current => ({
          ...current,
          newEmailToken: response.token,
          newTokenExpiry: new Date(response.expiresAt)
        }));
        
        // Start cooldown
        this.canResendNewToken.set(false);
        this.resendNewCooldown.set(60);
        
        alert(`New token sent to ${data.newEmail}: ${response.token}`);
        this.toastStore.showInfo(`New verification code sent to ${data.newEmail}`);
      },
      error: (error: unknown) => {
        this.authStore.setEmailChangeLoading(false);
        const errorMessage = error instanceof Error ? error.message : 'Failed to resend verification code';
        this.toastStore.showError(errorMessage);
      }
    });
  }

  resetEmailChangeFlow(): void {
    this.emailChangeStep.set('initial');
    this.emailChangeData.set({
      newEmail: '',
      oldEmailToken: '',
      newEmailToken: ''
    });
    this.emailForm.reset();
    this.oldTokenForm.reset();
    this.newTokenForm.reset();
    this.oldTokenTimeLeft.set(0);
    this.newTokenTimeLeft.set(0);
    this.canResendOldToken.set(true);
    this.canResendNewToken.set(true);
    this.resendOldCooldown.set(0);
    this.resendNewCooldown.set(0);
  }

  // Utility methods
  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    const fieldInvalid = !!(field && field.invalid && (field.dirty || field.touched));
    
    // Check for form-level errors (like password mismatch) for confirm password field
    if (fieldName === 'confirmPassword') {
      const formInvalid = !!(form.errors?.['passwordMismatch'] && field && (field.dirty || field.touched));
      return fieldInvalid || formInvalid;
    }
    
    return fieldInvalid;
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${this.capitalize(fieldName)} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['minlength']) return `${this.capitalize(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['pattern']) return 'Please enter a valid 6-digit code';
      if (field.errors['incorrectPassword']) return 'Current password is incorrect';
    }
    
    // Check for form-level errors (like password mismatch)
    if (fieldName === 'confirmPassword' && form.errors?.['passwordMismatch']) {
      return 'Passwords do not match';
    }
    
    return '';
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  private capitalize(text: string): string {
    if (!text) return '';
    // Convert camelCase to readable text
    const readable = text.replace(/([A-Z])/g, ' $1').toLowerCase();
    return readable.charAt(0).toUpperCase() + readable.slice(1);
  }
}
