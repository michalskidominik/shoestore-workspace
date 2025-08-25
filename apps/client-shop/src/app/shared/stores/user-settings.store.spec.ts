import { TestBed } from '@angular/core/testing';
import { UserSettingsStore, UserPreferences } from './user-settings.store';
import { AuthStore } from '../../core/stores/auth.store';

// Mock AuthStore
const mockAuthStore = {
  isAuthenticated: jest.fn(() => false)
};

describe('UserSettingsStore', () => {
  let store: InstanceType<typeof UserSettingsStore>;
  let authStore: any;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    TestBed.configureTestingModule({
      providers: [
        UserSettingsStore,
        { provide: AuthStore, useValue: mockAuthStore }
      ]
    });

    store = TestBed.inject(UserSettingsStore);
    authStore = TestBed.inject(AuthStore);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should have default preferences', () => {
      expect(store.sizeSystem()).toBe('eu');
      expect(store.currency()).toBe('EUR');
      expect(store.language()).toBe('en');
      expect(store.isInitialized()).toBe(false);
    });

    it('should have loading state false initially', () => {
      expect(store.isLoading()).toBe(false);
    });

    it('should have no error initially', () => {
      expect(store.error()).toBeNull();
    });
  });

  describe('Size System Management', () => {
    it('should update size system preference', () => {
      store.setSizeSystem('us');
      expect(store.sizeSystem()).toBe('us');
    });

    it('should persist size system change to localStorage', () => {
      store.setSizeSystem('us');
      
      const saved = localStorage.getItem('shoestore_guest_preferences');
      expect(saved).toBeTruthy();
      
      const parsed = JSON.parse(saved!);
      expect(parsed.sizeSystem).toBe('us');
    });

    it('should switch between eu and us', () => {
      // Start with default EU
      expect(store.sizeSystem()).toBe('eu');
      
      // Switch to US
      store.setSizeSystem('us');
      expect(store.sizeSystem()).toBe('us');
      
      // Switch back to EU
      store.setSizeSystem('eu');
      expect(store.sizeSystem()).toBe('eu');
    });
  });

  describe('Currency Management', () => {
    it('should update currency preference', () => {
      store.setCurrency('USD');
      expect(store.currency()).toBe('USD');
    });

    it('should persist currency change to localStorage', () => {
      store.setCurrency('USD');
      
      const saved = localStorage.getItem('shoestore_guest_preferences');
      expect(saved).toBeTruthy();
      
      const parsed = JSON.parse(saved!);
      expect(parsed.currency).toBe('USD');
    });
  });

  describe('Language Management', () => {
    it('should update language preference', () => {
      store.setLanguage('de');
      expect(store.language()).toBe('de');
    });

    it('should persist language change to localStorage', () => {
      store.setLanguage('de');
      
      const saved = localStorage.getItem('shoestore_guest_preferences');
      expect(saved).toBeTruthy();
      
      const parsed = JSON.parse(saved!);
      expect(parsed.language).toBe('de');
    });
  });

  describe('Bulk Preferences Update', () => {
    it('should update multiple preferences at once', () => {
      const newPreferences: Partial<UserPreferences> = {
        sizeSystem: 'us',
        currency: 'USD',
        language: 'de'
      };

      store.updatePreferences(newPreferences);

      expect(store.sizeSystem()).toBe('us');
      expect(store.currency()).toBe('USD');
      expect(store.language()).toBe('de');
    });

    it('should persist bulk changes to localStorage', () => {
      const newPreferences: Partial<UserPreferences> = {
        sizeSystem: 'us',
        currency: 'USD'
      };

      store.updatePreferences(newPreferences);
      
      const saved = localStorage.getItem('shoestore_guest_preferences');
      expect(saved).toBeTruthy();
      
      const parsed = JSON.parse(saved!);
      expect(parsed.sizeSystem).toBe('us');
      expect(parsed.currency).toBe('USD');
      expect(parsed.language).toBe('en'); // Should remain default
    });
  });

  describe('Local Storage Integration', () => {
    it('should load preferences from localStorage', () => {
      // Set up preferences in localStorage
      const preferences: UserPreferences = {
        sizeSystem: 'us',
        currency: 'USD',
        language: 'de'
      };
      localStorage.setItem('shoestore_guest_preferences', JSON.stringify(preferences));

      // Load preferences
      const loaded = store.loadFromLocalStorage();
      
      expect(loaded.sizeSystem).toBe('us');
      expect(loaded.currency).toBe('USD');
      expect(loaded.language).toBe('de');
    });

    it('should handle invalid localStorage data gracefully', () => {
      // Set invalid data in localStorage
      localStorage.setItem('shoestore_guest_preferences', 'invalid json');

      // Should fall back to defaults
      const loaded = store.loadFromLocalStorage();
      
      expect(loaded.sizeSystem).toBe('eu');
      expect(loaded.currency).toBe('EUR');
      expect(loaded.language).toBe('en');
    });

    it('should validate size system values from localStorage', () => {
      // Set invalid size system in localStorage
      const invalidPreferences = {
        sizeSystem: 'invalid',
        currency: 'USD',
        language: 'de'
      };
      localStorage.setItem('shoestore_guest_preferences', JSON.stringify(invalidPreferences));

      // Should fall back to valid default
      const loaded = store.loadFromLocalStorage();
      
      expect(loaded.sizeSystem).toBe('eu'); // Should default to 'eu'
      expect(loaded.currency).toBe('USD'); // Should keep valid values
      expect(loaded.language).toBe('de');
    });

    it('should return defaults when localStorage is empty', () => {
      const loaded = store.loadFromLocalStorage();
      
      expect(loaded.sizeSystem).toBe('eu');
      expect(loaded.currency).toBe('EUR');
      expect(loaded.language).toBe('en');
    });
  });

  describe('Reset Functionality', () => {
    it('should reset preferences to defaults', () => {
      // Change some preferences
      store.setSizeSystem('us');
      store.setCurrency('USD');
      store.setLanguage('de');

      // Reset
      store.resetPreferences();

      // Should be back to defaults
      expect(store.sizeSystem()).toBe('eu');
      expect(store.currency()).toBe('EUR');
      expect(store.language()).toBe('en');
    });

    it('should clear localStorage when resetting', () => {
      // Set some preferences
      store.setSizeSystem('us');
      
      // Verify localStorage has data
      expect(localStorage.getItem('shoestore_guest_preferences')).toBeTruthy();

      // Reset
      store.resetPreferences();

      // Should have default preferences in localStorage
      const saved = localStorage.getItem('shoestore_guest_preferences');
      const parsed = JSON.parse(saved!);
      expect(parsed.sizeSystem).toBe('eu');
    });
  });

  describe('Authentication Integration', () => {
    it('should handle guest user preferences', () => {
      authStore.isAuthenticated.mockReturnValue(false);
      
      store.setSizeSystem('us');
      
      // Should save to localStorage for guests
      const saved = localStorage.getItem('shoestore_guest_preferences');
      expect(saved).toBeTruthy();
    });

    it('should handle authenticated user preferences', () => {
      authStore.isAuthenticated.mockReturnValue(true);
      
      store.setSizeSystem('us');
      
      // Should still save to localStorage (until backend API is implemented)
      const saved = localStorage.getItem('shoestore_guest_preferences');
      expect(saved).toBeTruthy();
    });
  });
});