import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface FirebaseInitOptions {
  config: FirebaseConfig;
  useEmulator?: boolean;
  emulatorUrl?: string;
}

/**
 * Initialize Firebase with the provided configuration
 * Returns the Auth instance that can be used with FirebaseAuthService
 */
export function initializeFirebaseAuth(options: FirebaseInitOptions): Auth {
  // Initialize Firebase
  const app = initializeApp(options.config);

  // Initialize Firebase Authentication and get a reference to the service
  const auth = getAuth(app);

  // Connect to the Authentication emulator only if explicitly requested
  if (options.useEmulator === true && options.emulatorUrl) {
    try {
      connectAuthEmulator(auth, options.emulatorUrl, { disableWarnings: true });
      console.log('Connected to Firebase Auth emulator at', options.emulatorUrl);
    } catch (error) {
      // Emulator already connected or not available
      console.warn('Could not connect to Auth emulator:', error);
    }
  }

  return auth;
}
