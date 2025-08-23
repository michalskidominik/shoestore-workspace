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
import { AuthService, LoginCredentials } from '../../core/services/auth.service';

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
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  // Form and state management
  loginForm: FormGroup;
  passwordResetForm: FormGroup;

  // UI state
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  showPasswordResetDialog = signal(false);
  resetPasswordLoading = signal(false);
  successMessage = signal<string | null>(null);

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

    this.loading.set(true);
    this.errorMessage.set(null);

    const credentials: LoginCredentials = this.loginForm.value;
    const result = await this.authService.login(credentials);

    this.loading.set(false);

    if (result.success) {
      // Get return URL from query params or default to dashboard
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
      this.router.navigate([returnUrl]);
    } else {
      this.errorMessage.set(result.error || 'Login failed');
    }
  }

  async onMockB2BLogin(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    // Use predefined B2B test user credentials
    const mockCredentials: LoginCredentials = {
      email: 'b2b-test@sgats.com',
      password: 'b2b123'
    };

    const result = await this.authService.login(mockCredentials);

    this.loading.set(false);

    if (result.success) {
      // Get return URL from query params or default to dashboard
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
      this.router.navigate([returnUrl]);
    } else {
      this.errorMessage.set('Failed to login with test B2B account');
    }
  }

  async onPasswordReset(): Promise<void> {
    if (this.passwordResetForm.invalid) {
      this.passwordResetForm.markAllAsTouched();
      return;
    }

    this.resetPasswordLoading.set(true);
    const email = this.passwordResetForm.get('email')?.value;
    const result = await this.authService.requestPasswordReset(email);
    this.resetPasswordLoading.set(false);

    if (result.success) {
      this.successMessage.set(result.message);
      this.showPasswordResetDialog.set(false);
      this.passwordResetForm.reset();
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
