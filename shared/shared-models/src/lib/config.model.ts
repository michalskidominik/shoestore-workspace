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
  baseUrl: 'http://localhost:3000/api',
  timeout: 30000,
  retryAttempts: 3
};
