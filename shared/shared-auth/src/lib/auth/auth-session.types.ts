import { User } from '@shoestore/shared-models';

export interface AuthSession {
  user: User;
  expiresAt: number;
}

export interface SessionConfig {
  storageKey?: string;
  sessionHours?: number;
}

const DEFAULT_SESSION_CONFIG: Required<SessionConfig> = {
  storageKey: 'authSession',
  sessionHours: 8
};

/**
 * Session persistence utilities
 */
export class SessionManager {
  private config: Required<SessionConfig>;

  constructor(config: SessionConfig = {}) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
  }

  /**
   * Persist user session to localStorage
   */
  persistSession(user: User): void {
    try {
      const expiresAt = Date.now() + this.config.sessionHours * 60 * 60 * 1000;
      const payload: AuthSession = { user, expiresAt };
      localStorage.setItem(this.config.storageKey, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to persist auth session', e);
    }
  }

  /**
   * Retrieve user session from localStorage
   * Returns null if session is expired or doesn't exist
   */
  getSession(): User | null {
    try {
      const raw = localStorage.getItem(this.config.storageKey);
      if (!raw) return null;

      const session: AuthSession = JSON.parse(raw);
      if (session.expiresAt > Date.now()) {
        return session.user;
      } else {
        this.clearSession();
        return null;
      }
    } catch (e) {
      console.warn('Failed to retrieve auth session', e);
      this.clearSession();
      return null;
    }
  }

  /**
   * Clear user session from localStorage
   */
  clearSession(): void {
    try {
      localStorage.removeItem(this.config.storageKey);
    } catch (e) {
      console.warn('Failed to clear auth session', e);
    }
  }

  /**
   * Check if session exists and is valid
   */
  hasValidSession(): boolean {
    return this.getSession() !== null;
  }

  /**
   * Update existing session with new user data
   */
  updateSession(user: User): void {
    try {
      const raw = localStorage.getItem(this.config.storageKey);
      if (raw) {
        const session: AuthSession = JSON.parse(raw);
        session.user = user;
        localStorage.setItem(this.config.storageKey, JSON.stringify(session));
      } else {
        // If no existing session, create new one
        this.persistSession(user);
      }
    } catch (e) {
      console.warn('Failed to update auth session', e);
      // Fallback to creating new session
      this.persistSession(user);
    }
  }
}
