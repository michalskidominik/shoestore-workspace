import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { ApiConfig, AppConfig, DEFAULT_API_CONFIG } from '@shoestore/shared-models';
import { environment } from '../../../environments/environment';

interface ConfigState {
  apiConfig: ApiConfig;
  appConfig: AppConfig;
  isLoaded: boolean;
}

const initialState: ConfigState = {
  apiConfig: DEFAULT_API_CONFIG,
  appConfig: {
    api: DEFAULT_API_CONFIG,
    features: {}
  },
  isLoaded: false
};

export const ConfigStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    loadConfig(): void {
      const apiConfig: ApiConfig = {
        baseUrl: environment.apiUrl,
        timeout: 30000,
        retryAttempts: 3
      };

      const appConfig: AppConfig = {
        api: apiConfig,
        features: {}
      };

      patchState(store, {
        apiConfig,
        appConfig,
        isLoaded: true
      });
    },

    updateApiConfig(apiConfig: Partial<ApiConfig>): void {
      patchState(store, {
        apiConfig: { ...store.apiConfig(), ...apiConfig },
        appConfig: {
          ...store.appConfig(),
          api: { ...store.apiConfig(), ...apiConfig }
        }
      });
    },

    getApiUrl(endpoint?: string): string {
      const baseUrl = store.apiConfig().baseUrl;
      return endpoint ? `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}` : baseUrl;
    }
  }))
);
