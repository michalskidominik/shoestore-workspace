import { Injectable } from '@angular/core';
import { User, Address } from '@shoestore/shared-models';
import { Observable, of, delay, throwError, switchMap } from 'rxjs';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user: User;
}

export interface AccessRequest {
  email: string;
  company: string;
}

export interface ApiResponse {
  success: boolean;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface EmailChangeRequest {
  newEmail: string;
}

export interface EmailChangeStepRequest {
  step: 1 | 2 | 3;
  token?: string;
  newEmail?: string;
}

export interface TokenResponse {
  success: boolean;
  token: string;
  expiresAt: string;
}

export interface AddressUpdateRequest {
  shippingAddress: Address;
  billingAddress: Address;
}

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {

  /**
   * Authenticate user with email and password
   * TODO: Replace with real HTTP call to backend API
   */
  login(credentials: LoginCredentials): Observable<LoginResponse> {
    // TODO: Replace with real HTTP call
    // Example: return this.http.post<LoginResponse>('/api/auth/login', credentials);

    return of(credentials).pipe(
      delay(800), // Simulate API call
      switchMap((creds) => {
        // Mock authentication - accept specific credentials or any email with password 'password'
        if (creds.password === 'password' ||
            (creds.email === 'admin@sgats.com' && creds.password === 'admin123') ||
            (creds.email === 'user@sgats.com' && creds.password === 'user123') ||
            (creds.email === 'b2b-test@sgats.com' && creds.password === 'b2b123')) {

          const user: User = {
            id: 1,
            email: creds.email,
            contactName: creds.email.split('@')[0],
            phone: '+48 123 456 789',
            shippingAddress: {
              street: 'Default Street 123',
              city: 'Warsaw',
              postalCode: '00-001',
              country: 'PL'
            },
            billingAddress: {
              street: 'Default Street 123',
              city: 'Warsaw',
              postalCode: '00-001',
              country: 'PL'
            },
            invoiceInfo: {
              companyName: `${creds.email.split('@')[0]} Company`,
              vatNumber: 'PL1234567890'
            }
          };

          return of({ success: true, user });
        }
        return throwError(() => new Error('Invalid email or password'));
      })
    );
  }

  /**
   * Request password reset for the given email
   * TODO: Replace with real HTTP call to backend API
   */
  requestPasswordReset(email: string): Observable<ApiResponse> {
    // TODO: Replace with real HTTP call
    // Example: return this.http.post<ApiResponse>('/api/auth/password-reset', { email });

    return of({ success: true }).pipe(delay(500));
  }

  /**
   * Submit access request for new B2B users
   * TODO: Replace with real HTTP call to backend API
   */
  requestAccess(request: AccessRequest): Observable<ApiResponse> {
    // TODO: Replace with real HTTP call
    // Example: return this.http.post<ApiResponse>('/api/auth/request-access', request);

    return of({ success: true }).pipe(delay(500));
  }

  /**
   * Validate user session/token
   * TODO: Replace with real HTTP call to backend API
   */
  validateSession(): Observable<User | null> {
    // TODO: Replace with real HTTP call
    // Example: return this.http.get<User>('/api/auth/validate');

    // For now, just check localStorage (client-side validation only)
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        return of(user).pipe(delay(300));
      } catch {
        return of(null).pipe(delay(300));
      }
    }
    return of(null).pipe(delay(300));
  }

  /**
   * Store user session (for mock implementation)
   * TODO: Remove when using real backend authentication with JWT tokens
   */
  storeUserSession(user: User): void {
    localStorage.setItem('authUser', JSON.stringify(user));
  }

  /**
   * Clear user session
   * TODO: Replace with real token invalidation call
   */
  clearUserSession(): void {
    localStorage.removeItem('authUser');
  }

  /**
   * Update user address information
   * TODO: Replace with real HTTP call to backend API
   */
  updateAddress(addressUpdate: AddressUpdateRequest): Observable<User> {
    // TODO: Replace with real HTTP call
    // Example: return this.http.put<User>('/api/profile/address', addressUpdate);

    return of(addressUpdate).pipe(
      delay(800), // Simulate API call
      switchMap(() => {
        const storedUser = localStorage.getItem('authUser');
        if (!storedUser) {
          return throwError(() => new Error('User not authenticated'));
        }

        try {
          const user: User = JSON.parse(storedUser);
          const updatedUser: User = {
            ...user,
            shippingAddress: addressUpdate.shippingAddress,
            billingAddress: addressUpdate.billingAddress
          };

          // Store updated user
          localStorage.setItem('authUser', JSON.stringify(updatedUser));
          return of(updatedUser);
        } catch {
          return throwError(() => new Error('Failed to update address'));
        }
      })
    );
  }

  /**
   * Change user password
   * TODO: Replace with real HTTP call to backend API
   */
  changePassword(passwordChange: PasswordChangeRequest): Observable<ApiResponse> {
    // TODO: Replace with real HTTP call
    // Example: return this.http.post<ApiResponse>('/api/profile/password', passwordChange);

    return of(passwordChange).pipe(
      delay(1000), // Simulate API call
      switchMap((request) => {
        // Mock validation - in real implementation, backend would validate current password
        if (request.currentPassword === 'password' || 
            request.currentPassword === 'admin123' || 
            request.currentPassword === 'user123' || 
            request.currentPassword === 'b2b123') {
          return of({ success: true });
        }
        return throwError(() => new Error('Current password is incorrect'));
      })
    );
  }

  /**
   * Initiate email change process - Step 1: Request token for old email
   * TODO: Replace with real HTTP call to backend API
   */
  initiateEmailChange(newEmail: string): Observable<TokenResponse> {
    // TODO: Replace with real HTTP call
    // Example: return this.http.post<TokenResponse>('/api/profile/email/initiate', { newEmail });

    const token = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit token
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    return of({
      success: true,
      token,
      expiresAt
    }).pipe(delay(500));
  }

  /**
   * Verify old email token and send token to new email - Step 2
   * TODO: Replace with real HTTP call to backend API
   */
  verifyOldEmailToken(token: string, newEmail: string): Observable<TokenResponse> {
    // TODO: Replace with real HTTP call
    // Example: return this.http.post<TokenResponse>('/api/profile/email/verify-old', { token, newEmail });

    // Mock validation - accept any 6-digit token for demo
    if (token.length === 6 && /^\d{6}$/.test(token)) {
      const newToken = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      
      return of({
        success: true,
        token: newToken,
        expiresAt
      }).pipe(delay(500));
    }

    return throwError(() => new Error('Invalid token'));
  }

  /**
   * Verify new email token and complete email change - Step 3
   * TODO: Replace with real HTTP call to backend API
   */
  verifyNewEmailToken(token: string, newEmail: string): Observable<User> {
    // TODO: Replace with real HTTP call
    // Example: return this.http.post<User>('/api/profile/email/verify-new', { token, newEmail });

    return of({ token, newEmail }).pipe(
      delay(800),
      switchMap(() => {
        // Mock validation - accept any 6-digit token for demo
        if (token.length === 6 && /^\d{6}$/.test(token)) {
          const storedUser = localStorage.getItem('authUser');
          if (!storedUser) {
            return throwError(() => new Error('User not authenticated'));
          }

          try {
            const user: User = JSON.parse(storedUser);
            const updatedUser: User = {
              ...user,
              email: newEmail
            };

            // Store updated user
            localStorage.setItem('authUser', JSON.stringify(updatedUser));
            return of(updatedUser);
          } catch {
            return throwError(() => new Error('Failed to update email'));
          }
        }

        return throwError(() => new Error('Invalid token'));
      })
    );
  }
}
