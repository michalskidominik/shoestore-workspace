import { Injectable } from '@angular/core';
import { User } from '@shoestore/shared-models';
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
}
