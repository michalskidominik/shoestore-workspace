export interface ApiConfig {
  baseUrl: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface AppConfig {
  api: ApiConfig;
  firebase?: {
    projectId: string;
    apiKey: string;
    authDomain: string;
  };
  features?: {
    [key: string]: boolean;
  };
}

export const DEFAULT_API_CONFIG: ApiConfig = {
  // Use env override if provided (e.g., injected at build time) otherwise default to production API to prevent accidental localhost calls in deployed builds
  baseUrl: ((): string => {
    interface GlobalWithApiVar { API_BASE_URL?: string }
    const g = globalThis as GlobalWithApiVar;
    return g.API_BASE_URL || 'https://shoestore-api.onrender.com/api';
  })(),
  timeout: 30000,
  retryAttempts: 3
};
