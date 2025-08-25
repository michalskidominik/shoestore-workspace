import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { inject, computed } from '@angular/core';
import { AuthStore } from '../../core/stores/auth.store';

// User preferences interface
export interface UserPreferences {
  sizeSystem: 'eu' | 'us';
  currency: string;
  language: string;
}

interface UserSettingsState {
  preferences: UserPreferences;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

const defaultPreferences: UserPreferences = {
  sizeSystem: 'eu', // Default to EU sizing
  currency: 'EUR',
  language: 'en'
};

const initialState: UserSettingsState = {
  preferences: defaultPreferences,
  isLoading: false,
  error: null,
  isInitialized: false
};

// Local storage key for guest preferences
const GUEST_PREFERENCES_KEY = 'shoestore_guest_preferences';

export const UserSettingsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ preferences }) => ({
    // Main size system signal - this is what components will use
    sizeSystem: computed(() => preferences().sizeSystem),
    
    // Currency preference (can be used in future)
    currency: computed(() => preferences().currency),
    
    // Language preference (can be used in future)
    language: computed(() => preferences().language)
  })),
  withMethods((store, authStore = inject(AuthStore)) => {
    // Helper functions
    const loadFromLocalStorage = (): UserPreferences => {
      try {
        const saved = localStorage.getItem(GUEST_PREFERENCES_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Validate the parsed preferences
          return {
            sizeSystem: (parsed.sizeSystem === 'eu' || parsed.sizeSystem === 'us') ? parsed.sizeSystem : 'eu',
            currency: parsed.currency || 'EUR',
            language: parsed.language || 'en'
          };
        }
      } catch (error) {
        console.warn('Failed to load preferences from localStorage:', error);
      }
      
      return defaultPreferences;
    };

    const saveToLocalStorage = (preferences: UserPreferences): void => {
      try {
        localStorage.setItem(GUEST_PREFERENCES_KEY, JSON.stringify(preferences));
      } catch (error) {
        console.warn('Failed to save preferences to localStorage:', error);
      }
    };

    const persistPreferences = (preferences: UserPreferences): void => {
      const isAuthenticated = authStore.isAuthenticated();
      
      if (isAuthenticated) {
        // TODO: Save to backend API when available
        // For now, also save to localStorage as backup
        saveToLocalStorage(preferences);
        
        // TODO: Call backend API to save user preferences
        // userPreferencesApiService.updatePreferences(preferences).subscribe({
        //   next: () => console.log('Preferences saved to backend'),
        //   error: (error) => console.error('Failed to save preferences to backend:', error)
        // });
      } else {
        // Save guest preferences to localStorage
        saveToLocalStorage(preferences);
      }
    };

    return {
      // Initialize user settings - load from localStorage for guests, backend for authenticated users
      initializeSettings: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(() => {
            // For now, just load from localStorage
            // TODO: When backend API is ready, load from user profile for authenticated users
            const isAuthenticated = authStore.isAuthenticated();
            
            if (isAuthenticated) {
              // TODO: Load from backend API
              // For now, still use localStorage but plan for backend integration
              const savedPreferences = loadFromLocalStorage();
              return Promise.resolve(savedPreferences);
            } else {
              // Load guest preferences from localStorage
              const guestPreferences = loadFromLocalStorage();
              return Promise.resolve(guestPreferences);
            }
          }),
          tapResponse({
            next: (preferences: UserPreferences) => {
              patchState(store, {
                preferences,
                isLoading: false,
                isInitialized: true,
                error: null
              });
            },
            error: (error: Error) => {
              console.warn('Failed to load user preferences:', error);
              // Fall back to default preferences
              patchState(store, {
                preferences: defaultPreferences,
                isLoading: false,
                isInitialized: true,
                error: error.message
              });
            }
          })
        )
      ),

      // Update size system preference
      setSizeSystem(sizeSystem: 'eu' | 'us'): void {
        const currentPreferences = store.preferences();
        const updatedPreferences = {
          ...currentPreferences,
          sizeSystem
        };
        
        patchState(store, { preferences: updatedPreferences });
        
        // Persist the change
        persistPreferences(updatedPreferences);
      },

      // Update currency preference
      setCurrency(currency: string): void {
        const currentPreferences = store.preferences();
        const updatedPreferences = {
          ...currentPreferences,
          currency
        };
        
        patchState(store, { preferences: updatedPreferences });
        
        // Persist the change
        persistPreferences(updatedPreferences);
      },

      // Update language preference
      setLanguage(language: string): void {
        const currentPreferences = store.preferences();
        const updatedPreferences = {
          ...currentPreferences,
          language
        };
        
        patchState(store, { preferences: updatedPreferences });
        
        // Persist the change
        persistPreferences(updatedPreferences);
      },

      // Update all preferences at once
      updatePreferences(newPreferences: Partial<UserPreferences>): void {
        const currentPreferences = store.preferences();
        const updatedPreferences = {
          ...currentPreferences,
          ...newPreferences
        };
        
        patchState(store, { preferences: updatedPreferences });
        
        // Persist the changes
        persistPreferences(updatedPreferences);
      },

      // Expose helper methods for testing
      loadFromLocalStorage,
      saveToLocalStorage,
      persistPreferences,

      // Reset preferences to defaults
      resetPreferences(): void {
        patchState(store, { preferences: defaultPreferences });
        persistPreferences(defaultPreferences);
      }
    };
  })
);