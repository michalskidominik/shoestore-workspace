import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { FirebaseConfigService } from './firebase.config';

@Injectable()
export class FirebaseAdminService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private app: admin.app.App;
  private readonly appName = 'shoestore-admin';

  constructor(
    private configService: ConfigService,
    private firebaseConfigService: FirebaseConfigService
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.initializeFirebaseAdmin();
      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK', error.stack);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.app) {
      try {
        await this.app.delete();
        this.logger.log('Firebase Admin SDK app deleted successfully');
      } catch (error) {
        this.logger.error('Error deleting Firebase Admin SDK app', error.stack);
      }
    }
  }

  /**
   * Initialize Firebase Admin SDK
   */
  private async initializeFirebaseAdmin(): Promise<void> {
    // Check if app already exists
    try {
      this.app = admin.app(this.appName);
      this.logger.log('Firebase Admin app already exists, reusing');
      return;
    } catch {
      // App doesn't exist, create new one
    }

    const options = this.firebaseConfigService.getFirebaseAppOptions();
    
    this.app = admin.initializeApp(options, this.appName);
    
    // Test the connection
    await this.testConnection();
  }

  /**
   * Test Firebase connection
   */
  private async testConnection(): Promise<void> {
    try {
      // Try to access Firestore to test connection
      const firestore = this.getFirestore();
      await firestore.collection('_test').limit(1).get();
      this.logger.log('Firebase connection test successful');
    } catch (error) {
      this.logger.warn('Firebase connection test failed, but app is initialized', error.message);
    }
  }

  /**
   * Get Firebase Auth instance
   */
  getAuth(): admin.auth.Auth {
    if (!this.app) {
      throw new Error('Firebase Admin SDK not initialized');
    }
    return this.app.auth();
  }

  /**
   * Get Firestore instance
   */
  getFirestore(): admin.firestore.Firestore {
    if (!this.app) {
      throw new Error('Firebase Admin SDK not initialized');
    }
    return this.app.firestore();
  }

  /**
   * Get Firebase Storage instance
   */
  getStorage(): admin.storage.Storage {
    if (!this.app) {
      throw new Error('Firebase Admin SDK not initialized');
    }
    return this.app.storage();
  }

  /**
   * Get Firebase Realtime Database instance
   */
  getDatabase(): admin.database.Database {
    if (!this.app) {
      throw new Error('Firebase Admin SDK not initialized');
    }
    return this.app.database();
  }

  /**
   * Get Firebase Messaging instance
   */
  getMessaging(): admin.messaging.Messaging {
    if (!this.app) {
      throw new Error('Firebase Admin SDK not initialized');
    }
    return this.app.messaging();
  }

  /**
   * Verify Firebase ID token
   */
  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      return await this.getAuth().verifyIdToken(idToken);
    } catch (error) {
      this.logger.error('Failed to verify Firebase ID token', error.message);
      throw error;
    }
  }

  /**
   * Get user by UID
   */
  async getUser(uid: string): Promise<admin.auth.UserRecord> {
    try {
      return await this.getAuth().getUser(uid);
    } catch (error) {
      this.logger.error(`Failed to get user with UID: ${uid}`, error.message);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<admin.auth.UserRecord> {
    try {
      return await this.getAuth().getUserByEmail(email);
    } catch (error) {
      this.logger.error(`Failed to get user with email: ${email}`, error.message);
      throw error;
    }
  }

  /**
   * Create custom token for user
   */
  async createCustomToken(uid: string, additionalClaims?: object): Promise<string> {
    try {
      return await this.getAuth().createCustomToken(uid, additionalClaims);
    } catch (error) {
      this.logger.error(`Failed to create custom token for UID: ${uid}`, error.message);
      throw error;
    }
  }

  /**
   * Set custom user claims
   */
  async setCustomUserClaims(uid: string, customClaims: object): Promise<void> {
    try {
      await this.getAuth().setCustomUserClaims(uid, customClaims);
      this.logger.log(`Custom claims set for user: ${uid}`);
    } catch (error) {
      this.logger.error(`Failed to set custom claims for UID: ${uid}`, error.message);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(uid: string): Promise<void> {
    try {
      await this.getAuth().deleteUser(uid);
      this.logger.log(`User deleted: ${uid}`);
    } catch (error) {
      this.logger.error(`Failed to delete user with UID: ${uid}`, error.message);
      throw error;
    }
  }

  /**
   * Health check for Firebase services
   */
  async healthCheck(): Promise<{
    firestore: boolean;
    auth: boolean;
    storage: boolean;
    authEnabled?: boolean;
    timestamp: string;
  }> {
    const result = {
      firestore: false,
      auth: false,
      storage: false,
      authEnabled: false,
      timestamp: new Date().toISOString(),
    };

    // Test Firestore
    try {
      await this.getFirestore().collection('_health').limit(1).get();
      result.firestore = true;
    } catch (error) {
      this.logger.warn('Firestore health check failed', error.message);
    }

    // Test Auth - check if it's enabled first
    try {
      const auth = this.getAuth();
      // Try to list users - this will fail gracefully if auth is not enabled
      await auth.listUsers(1);
      result.auth = true;
      result.authEnabled = true;
    } catch (error) {
      // Check if this is specifically about auth not being enabled
      if (error.message?.includes('no configuration corresponding') || 
          error.message?.includes('auth/configuration-not-found') ||
          error.code === 'auth/configuration-not-found') {
        this.logger.debug('Firebase Authentication is not enabled in this project');
        result.authEnabled = false;
        result.auth = false; // Not enabled, so considered "unavailable" but not an error
      } else {
        this.logger.warn('Auth health check failed', error.message);
        result.authEnabled = true; // Enabled but failing
        result.auth = false;
      }
    }

    // Test Storage
    try {
      await this.getStorage().bucket().exists();
      result.storage = true;
    } catch (error) {
      this.logger.warn('Storage health check failed', error.message);
    }

    return result;
  }
}
