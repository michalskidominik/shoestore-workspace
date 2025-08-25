import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  User,
  AccessRequest,
  ApiResponse,
  PasswordChangeRequest,
  TokenResponse,
  UserValidationResponse,
  AddressUpdateRequest
} from '@shoestore/shared-models';
import { Observable, of, delay, throwError, switchMap, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  constructor() {
    // Note: This service now works with Firebase ID tokens
    // Token management is handled by FirebaseAuthService
  }

  /**
   * Validate user session with Firebase ID token
   * This method works with the backend /auth/validate endpoint
   */
  validateSession(idToken: string): Observable<User | null> {
    return this.http.get<UserValidationResponse>(`${this.apiUrl}/auth/validate`, {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    }).pipe(
      map((response) => {
        if (response.success && response.valid && response.user) {
          return response.user;
        }
        return null;
      }),
      catchError((error) => {
        console.error('Session validation error:', error);
        return of(null);
      })
    );
  }

  /**
   * Request password reset for the given email
   * TODO: Implement when backend endpoint is available
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  requestPasswordReset(_email: string): Observable<ApiResponse> {
    // TODO: Replace with real HTTP call when endpoint is implemented
    // return this.http.post<ApiResponse>(`${this.apiUrl}/auth/password-reset`, { email });

    return of({ success: true, message: 'Password reset functionality not yet implemented' }).pipe(delay(500));
  }

  /**
   * Submit access request for new B2B users
   * TODO: Implement when backend endpoint is available
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  requestAccess(_request: AccessRequest): Observable<ApiResponse> {
    // TODO: Replace with real HTTP call when endpoint is implemented
    // return this.http.post<ApiResponse>(`${this.apiUrl}/auth/request-access`, request);

    return of({ success: true, message: 'Access request functionality not yet implemented' }).pipe(delay(500));
  }

  /**
   * Update user address information
   * TODO: Implement when backend endpoint is available
   */
  updateAddress(addressUpdate: AddressUpdateRequest): Observable<User> {
    // TODO: Replace with real HTTP call when backend endpoint is implemented
    // return this.http.put<User>(`${this.apiUrl}/profile/address`, addressUpdate);

    return of(addressUpdate).pipe(
      delay(800), // Simulate API call
      switchMap(() => {
        const sessionRaw = localStorage.getItem('authSession');
        if (!sessionRaw) return throwError(() => new Error('User not authenticated'));
        try {
          const session = JSON.parse(sessionRaw) as { user: User; expiresAt: number };
          const updatedUser: User = {
            ...session.user,
            shippingAddress: addressUpdate.shippingAddress,
            billingAddress: addressUpdate.billingAddress
          };
          localStorage.setItem('authSession', JSON.stringify({ user: updatedUser, expiresAt: session.expiresAt }));
          return of(updatedUser);
        } catch {
          return throwError(() => new Error('Failed to update address'));
        }
      })
    );
  }

  /**
   * Change user password
   * TODO: Implement when backend endpoint is available
   */
  changePassword(passwordChange: PasswordChangeRequest): Observable<ApiResponse> {
    // TODO: Replace with real HTTP call when backend endpoint is implemented
    // return this.http.post<ApiResponse>(`${this.apiUrl}/profile/password`, passwordChange);

    return of(passwordChange).pipe(
      delay(1000), // Simulate API call
      switchMap((request) => {
        // Mock validation - in real implementation, backend would validate current password
        if (request.currentPassword === 'test123' ||
            request.currentPassword === 'admin123' ||
            request.currentPassword === 'user123') {
          return of({ success: true });
        }
        return throwError(() => new Error('Current password is incorrect'));
      })
    );
  }

  /**
   * Initiate email change process - Step 1: Request token for old email
   * TODO: Implement when backend endpoint is available
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  initiateEmailChange(_newEmail: string): Observable<TokenResponse> {
    // TODO: Replace with real HTTP call when backend endpoint is implemented
    // return this.http.post<TokenResponse>(`${this.apiUrl}/profile/email/initiate`, { newEmail });

    const token = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit token
    const expiresAt = Date.now() + (15 * 60 * 1000); // 15 minutes

    return of({
      success: true,
      token: token,
      expiresAt: expiresAt
    }).pipe(delay(500));
  }

  /**
   * Verify old email token and send token to new email - Step 2
   * TODO: Implement when backend endpoint is available
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  verifyOldEmailToken(token: string, _newEmail: string): Observable<TokenResponse> {
    // TODO: Replace with real HTTP call when backend endpoint is implemented
    // return this.http.post<TokenResponse>(`${this.apiUrl}/profile/email/verify-old`, { token, newEmail });

    // Mock validation - accept any 6-digit token for demo
    if (token.length === 6 && /^\d{6}$/.test(token)) {
      const newToken = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + (15 * 60 * 1000);

      return of({
        success: true,
        token: newToken,
        expiresAt: expiresAt
      }).pipe(delay(500));
    }

    return throwError(() => new Error('Invalid token'));
  }

  /**
   * Verify new email token and complete email change - Step 3
   * TODO: Implement when backend endpoint is available
   */
  verifyNewEmailToken(token: string, newEmail: string): Observable<User> {
    // TODO: Replace with real HTTP call when backend endpoint is implemented
    // return this.http.post<User>(`${this.apiUrl}/profile/email/verify-new`, { token, newEmail });

    return of({ token, newEmail }).pipe(
      delay(800),
      switchMap(() => {
        // Mock validation - accept any 6-digit token for demo
        if (token.length === 6 && /^\d{6}$/.test(token)) {
          const sessionRaw = localStorage.getItem('authSession');
            if (!sessionRaw) return throwError(() => new Error('User not authenticated'));
            try {
              const session = JSON.parse(sessionRaw) as { user: User; expiresAt: number };
              const updatedUser: User = { ...session.user, email: newEmail };
              localStorage.setItem('authSession', JSON.stringify({ user: updatedUser, expiresAt: session.expiresAt }));
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
