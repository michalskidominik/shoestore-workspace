import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { AuthStore, LoginCredentials } from '../../core/stores/auth.store';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    MessageModule,
    DividerModule,
    DialogModule
  ],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  // Replace local signals with store signals
  protected readonly loading = this.authStore.isLoading;
  protected readonly errorMessage = this.authStore.error;

  // Keep local UI state for dialogs
  protected readonly showPasswordResetDialog = signal(false);
  protected readonly resetPasswordLoading = signal(false);
  protected readonly successMessage = signal<string | null>(null);

  // Form setup
  loginForm: FormGroup;
  passwordResetForm: FormGroup;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(1)]]
    });

    this.passwordResetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  async onLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const credentials: LoginCredentials = this.loginForm.value;
    this.authStore.login(credentials);
  }

  async onMockB2BLogin(): Promise<void> {
    // Use predefined B2B test user credentials
    const mockCredentials: LoginCredentials = {
      email: 'b2b-test@sgats.com',
      password: 'b2b123'
    };

    this.authStore.login(mockCredentials);
  }

  async onPasswordReset(): Promise<void> {
    if (this.passwordResetForm.invalid) {
      this.passwordResetForm.markAllAsTouched();
      return;
    }

    this.resetPasswordLoading.set(true);
    const email = this.passwordResetForm.get('email')?.value;
    if (email) {
      this.authStore.requestPasswordReset(email);
      // Simulate delay for UI feedback
      setTimeout(() => {
        this.resetPasswordLoading.set(false);
        this.successMessage.set('Password reset instructions have been sent to your email.');
        this.showPasswordResetDialog.set(false);
        this.passwordResetForm.reset();
      }, 500);
    }
  }

  onShowPasswordReset(): void {
    this.showPasswordResetDialog.set(true);
    this.passwordResetForm.reset();
  }

  onShowAccessRequest(): void {
    this.router.navigate(['/request-access']);
  }

  // Helper methods for form validation
  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${this.capitalize(fieldName)} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['minlength']) return `${this.capitalize(fieldName)} is too short`;
    }
    return '';
  }

  private capitalize(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}
