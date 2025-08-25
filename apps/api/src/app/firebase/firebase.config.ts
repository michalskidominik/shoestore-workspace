import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export interface FirebaseConfig {
  projectId: string;
  privateKey: string;
  clientEmail: string;
  databaseURL?: string;
  storageBucket?: string;
}

@Injectable()
export class FirebaseConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * Creates Firebase configuration from environment variables
   * Supports both JSON string and individual environment variables
   */
  createFirebaseConfig(): FirebaseConfig {
    // Try to get Firebase config from JSON string first (Render.com preferred method)
    const firebaseConfigJson = this.configService.get<string>('FIREBASE_CONFIG');

    if (firebaseConfigJson) {
      try {
        const parsedConfig = JSON.parse(firebaseConfigJson);
        return {
          projectId: parsedConfig.project_id,
          privateKey: parsedConfig.private_key.replace(/\\n/g, '\n'),
          clientEmail: parsedConfig.client_email,
          databaseURL: this.configService.get<string>('FIREBASE_DATABASE_URL'),
          storageBucket: this.configService.get<string>('FIREBASE_STORAGE_BUCKET'),
        };
      } catch (error) {
        throw new Error(`Invalid FIREBASE_CONFIG JSON: ${error.message}`);
      }
    }

    // Fallback to individual environment variables
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');

    if (!projectId || !privateKey || !clientEmail) {
      throw new Error(
        'Firebase configuration is incomplete. Either provide FIREBASE_CONFIG JSON or all individual environment variables (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL)'
      );
    }

    return {
      projectId,
      privateKey: privateKey.replace(/\\n/g, '\n'),
      clientEmail,
      databaseURL: this.configService.get<string>('FIREBASE_DATABASE_URL'),
      storageBucket: this.configService.get<string>('FIREBASE_STORAGE_BUCKET'),
    };
  }

  /**
   * Creates Firebase Admin credential object
   */
  createFirebaseCredential(): admin.credential.Credential {
    const config = this.createFirebaseConfig();

    return admin.credential.cert({
      projectId: config.projectId,
      privateKey: config.privateKey,
      clientEmail: config.clientEmail,
    });
  }

  /**
   * Gets Firebase app initialization options
   */
  getFirebaseAppOptions(): admin.AppOptions {
    const config = this.createFirebaseConfig();

    const options: admin.AppOptions = {
      credential: this.createFirebaseCredential(),
      projectId: config.projectId,
    };

    if (config.databaseURL) {
      options.databaseURL = config.databaseURL;
    }

    if (config.storageBucket) {
      options.storageBucket = config.storageBucket;
    }

    return options;
  }
}
