import { Injectable, inject } from '@angular/core';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser, Auth } from 'firebase/auth';
import { Observable, BehaviorSubject, from, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import {
  LoginCredentials,
  LoginResponse,
  ApiResponse,
  User,
  UserValidationResponse
} from '@shoestore/shared-models';

export interface FirebaseAuthConfig {
  auth: Auth; // Firebase auth instance
  apiUrl: string;
  roleValidation?: (user: User) => boolean; // Optional role validation function
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {
  private readonly http = inject(HttpClient);
  private config: FirebaseAuthConfig | null = null;

  private readonly currentUserSubject = new BehaviorSubject<FirebaseUser | null>(null);
  public readonly currentUser$ = this.currentUserSubject.asObservable();

  private readonly userProfileSubject = new BehaviorSubject<User | null>(null);
  public readonly userProfile$ = this.userProfileSubject.asObservable();

  /**
   * Initialize the service with configuration
   * This must be called before using the service
   */
  initialize(config: FirebaseAuthConfig): void {
    this.config = config;

    // Listen to auth state changes
    onAuthStateChanged(config.auth, (user) => {
      this.currentUserSubject.next(user);
      if (user) {
        // Get user profile from backend when authenticated
        this.getUserProfile().subscribe();
      } else {
        this.userProfileSubject.next(null);
      }
    });
  }

  /**
   * Sign in with email and password
   */
  login(credentials: LoginCredentials): Observable<LoginResponse> {
    if (!this.config) {
      throw new Error('FirebaseAuthService not initialized. Call initialize() first.');
    }

    return from(signInWithEmailAndPassword(this.config.auth, credentials.email, credentials.password)).pipe(
      switchMap((userCredential) => {
        // Get ID token and send to backend for verification
        return from(userCredential.user.getIdToken()).pipe(
          switchMap((idToken) => this.verifyTokenWithBackend(idToken))
        );
      }),
      catchError((error) => {
        console.error('Firebase login error:', error);
        let message = 'Login failed';

        switch (error.code) {
          case 'auth/user-not-found':
            message = 'No account found with this email';
            break;
          case 'auth/wrong-password':
            message = 'Invalid password';
            break;
          case 'auth/invalid-email':
            message = 'Invalid email address';
            break;
          case 'auth/user-disabled':
            message = 'This account has been disabled';
            break;
          case 'auth/too-many-requests':
            message = 'Too many failed attempts. Try again later';
            break;
          default:
            message = error.message || 'Login failed';
        }

        return of({
          success: false,
          message
        } as LoginResponse);
      })
    );
  }

  /**
   * Sign out the current user
   */
  logout(): Observable<ApiResponse> {
    if (!this.config) {
      throw new Error('FirebaseAuthService not initialized. Call initialize() first.');
    }

    return from(signOut(this.config.auth)).pipe(
      map(() => {
        this.userProfileSubject.next(null);
        return {
          success: true,
          message: 'Logged out successfully'
        };
      }),
      catchError((error) => {
        console.error('Logout error:', error);
        // Even if logout fails, clear local state
        this.userProfileSubject.next(null);
        return of({
          success: true,
          message: 'Logged out'
        });
      })
    );
  }

  /**
   * Get current user's ID token
   */
  getCurrentIdToken(): Observable<string | null> {
    const user = this.currentUserSubject.value;
    if (!user) {
      return of(null);
    }

    return from(user.getIdToken()).pipe(
      catchError((error) => {
        console.error('Error getting ID token:', error);
        return of(null);
      })
    );
  }

  /**
   * Refresh current user's ID token
   */
  refreshToken(): Observable<string | null> {
    const user = this.currentUserSubject.value;
    if (!user) {
      return of(null);
    }

    return from(user.getIdToken(true)).pipe(
      catchError((error) => {
        console.error('Error refreshing token:', error);
        return of(null);
      })
    );
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const user = this.userProfileSubject.value;
    return !!user && (!this.config?.roleValidation || this.config.roleValidation(user));
  }

  /**
   * Get current Firebase user
   */
  getCurrentUser(): FirebaseUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get current user profile
   */
  getCurrentUserProfile(): User | null {
    return this.userProfileSubject.value;
  }

  /**
   * Verify ID token with backend and get user profile
   */
  private verifyTokenWithBackend(idToken: string): Observable<LoginResponse> {
    if (!this.config) {
      throw new Error('FirebaseAuthService not initialized');
    }

    return this.http.post<UserValidationResponse>(`${this.config.apiUrl}/auth/verify-token`, { idToken }).pipe(
      switchMap((response) => {
        if (response.success && response.user) {
          // Apply role validation if configured
          if (this.config?.roleValidation && !this.config.roleValidation(response.user)) {
            // Sign out from Firebase if role validation fails
            signOut(this.config.auth);
            return of({
              success: false,
              message: 'Access denied. Insufficient privileges.'
            });
          }

          this.userProfileSubject.next(response.user);
          return of({
            success: true,
            user: response.user,
            message: 'Login successful'
          });
        }
        return of({ success: false, message: response.message || 'Authentication failed' });
      }),
      catchError((error) => {
        console.error('Backend verification error:', error);
        // Sign out from Firebase if backend verification fails
        if (this.config) {
          signOut(this.config.auth);
        }
        return of({
          success: false,
          message: error.error?.message || 'Authentication failed'
        });
      })
    );
  }

  /**
   * Get user profile from backend
   */
  private getUserProfile(): Observable<User | null> {
    if (!this.config) {
      return of(null);
    }

    return this.getCurrentIdToken().pipe(
      switchMap((idToken) => {
        if (!idToken || !this.config) {
          return of(null);
        }

        return this.http.get<UserValidationResponse>(`${this.config.apiUrl}/auth/validate`, {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        }).pipe(
          map((response) => {
            if (response.success && response.user) {
              // Apply role validation if configured
              if (this.config?.roleValidation && !this.config.roleValidation(response.user)) {
                // Sign out if role validation fails
                if (this.config?.auth) {
                  signOut(this.config.auth);
                }
                return null;
              }

              this.userProfileSubject.next(response.user);
              return response.user;
            }
            return null;
          }),
          catchError((error) => {
            console.error('Error getting user profile:', error);
            return of(null);
          })
        );
      })
    );
  }
}
