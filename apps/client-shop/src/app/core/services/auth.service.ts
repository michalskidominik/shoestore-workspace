import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

export interface User {
  id: number;
  email: string;
  name: string;
  // All users are B2B - no need for userType field
}

export interface LoginCredentials {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly _currentUser = signal<User | null>(null);
  private readonly _isLoading = signal(false);

  // Public readonly signals
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isAuthenticated = computed(() => !!this._currentUser());
  // All users are B2B - no need for isB2BUser computed property

  constructor(private router: Router) {
    // Check if user is already logged in (from localStorage)
    this.checkExistingAuth();
  }

  private checkExistingAuth(): void {
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        this._currentUser.set(user);
      } catch (error) {
        localStorage.removeItem('authUser');
      }
    }
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
    this._isLoading.set(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));      // Mock authentication - accept specific credentials or any email with password 'password'
      if (credentials.password === 'password' ||
          (credentials.email === 'admin@sgats.com' && credentials.password === 'admin123') ||
          (credentials.email === 'user@sgats.com' && credentials.password === 'user123') ||
          (credentials.email === 'b2b-test@sgats.com' && credentials.password === 'b2b123')) {

        // All users are B2B customers
        const mockUser: User = {
          id: 1,
          email: credentials.email,
          name: credentials.email.split('@')[0]
        };

        this._currentUser.set(mockUser);
        localStorage.setItem('authUser', JSON.stringify(mockUser));
        this._isLoading.set(false);
        return { success: true };
      } else {
        this._isLoading.set(false);
        return { success: false, error: 'Invalid email or password' };
      }
    } catch (error) {
      this._isLoading.set(false);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  logout(): void {
    this._currentUser.set(null);
    localStorage.removeItem('authUser');
    this.router.navigate(['/dashboard']);
  }

  // Mock methods for password reset and access request
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      message: 'Password reset instructions have been sent to your email.'
    };
  }

  async requestAccess(email: string, company: string): Promise<{ success: boolean; message: string }> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      message: 'Your access request has been submitted and is under review.'
    };
  }
}
