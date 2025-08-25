import { Injectable, Logger } from '@nestjs/common';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { FirestoreService } from '../firebase/firestore.service';
import { LoginResponse, UserValidationResponse, User } from '@shoestore/shared-models';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly firestore: FirestoreService
  ) {}

  async verifyToken(idToken: string): Promise<LoginResponse> {
    try {
      this.logger.log('Verifying Firebase ID token');

      // Get Firebase Auth service
      const auth = this.firebaseAdmin.getAuth();

      // Verify the ID token
      const decodedToken = await auth.verifyIdToken(idToken);
      this.logger.log(`Token verified for user: ${decodedToken.email}`);

      // Get user from Firestore using the Firebase UID
      let userDoc = await this.firestore.findById('users', decodedToken.uid);

      if (!userDoc) {
        this.logger.log(`Creating new user document for UID: ${decodedToken.uid}`);

        // Create a user document if it doesn't exist
        const newUser: User = {
          id: parseInt(decodedToken.uid.slice(-8), 16), // Generate numeric ID from UID
          email: decodedToken.email || '',
          contactName: decodedToken.name || decodedToken.email?.split('@')[0] || '',
          phone: decodedToken.phone_number || '',
          role: 'user', // Default role is 'user', can be changed in Firebase custom claims or Firestore
          shippingAddress: {
            street: '',
            city: '',
            postalCode: '',
            country: ''
          },
          billingAddress: {
            street: '',
            city: '',
            postalCode: '',
            country: ''
          },
          invoiceInfo: {
            companyName: '',
            vatNumber: ''
          }
        };

        // Store user in Firestore with Firebase UID as document ID
        await this.firestore.create('users', newUser, decodedToken.uid);
        userDoc = newUser;

        this.logger.log(`Created user document for UID: ${decodedToken.uid}`);
      }

      const user = userDoc as User;
      this.logger.log(`Token verification successful for user: ${user.email}`);

      return {
        success: true,
        user
      };

    } catch (error) {
      this.logger.error(`Token verification error: ${error.message}`, error.stack);

      if (error.code === 'auth/id-token-expired') {
        return {
          success: false,
          message: 'Token has expired. Please log in again.'
        };
      }

      if (error.code === 'auth/argument-error' || error.code === 'auth/id-token-revoked') {
        return {
          success: false,
          message: 'Invalid token. Please log in again.'
        };
      }

      return {
        success: false,
        message: 'Authentication failed'
      };
    }
  }

  async validateUser(token: string): Promise<UserValidationResponse> {
    try {
      const auth = this.firebaseAdmin.getAuth();

      // Verify the Firebase ID token
      const decodedToken = await auth.verifyIdToken(token);

      // Get user from Firestore
      const userDoc = await this.firestore.findById('users', decodedToken.uid);

      if (!userDoc) {
        this.logger.warn(`User document not found for UID: ${decodedToken.uid}`);
        return {
          success: false,
          valid: false,
          message: 'User not found'
        };
      }

      const user = userDoc as User;

      this.logger.log(`Token validated for user: ${user.email}`);

      return {
        success: true,
        valid: true,
        user
      };
    } catch (error) {
      this.logger.error(`Token validation error: ${error.message}`, error.stack);

      if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
        return {
          success: false,
          valid: false,
          message: 'Invalid or expired token'
        };
      }

      return {
        success: false,
        valid: false,
        message: 'Token validation failed'
      };
    }
  }
}
