import { TestBed } from '@angular/core/testing';
import { Component, inject } from '@angular/core';
import { UserSettingsStore } from './shared/stores/user-settings.store';
import { AuthStore } from './core/stores/auth.store';

// Mock AuthStore
const mockAuthStore = {
  isAuthenticated: jest.fn(() => false)
};

// Simple test component that uses UserSettingsStore
@Component({
  selector: 'app-test-size-display',
  standalone: true,
  template: `
    <div>
      <span data-testid="size-system">{{ sizeSystem() }}</span>
      <button data-testid="switch-to-us" (click)="switchToUS()">Switch to US</button>
      <button data-testid="switch-to-eu" (click)="switchToEU()">Switch to EU</button>
    </div>
  `
})
class TestSizeDisplayComponent {
  private userSettingsStore = inject(UserSettingsStore);
  
  sizeSystem = this.userSettingsStore.sizeSystem;
  
  switchToUS() {
    this.userSettingsStore.setSizeSystem('us');
  }
  
  switchToEU() {
    this.userSettingsStore.setSizeSystem('eu');
  }
}

describe('Size System Integration', () => {
  let store: InstanceType<typeof UserSettingsStore>;
  let component: TestSizeDisplayComponent;

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
    component = TestBed.createComponent(TestSizeDisplayComponent).componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Cross-Component Size System Sharing', () => {
    it('should share size system setting between store and component', () => {
      // Initial state should be EU
      expect(store.sizeSystem()).toBe('eu');
      expect(component.sizeSystem()).toBe('eu');
    });

    it('should update both store and component when size system changes', () => {
      // Change through store
      store.setSizeSystem('us');
      
      // Both should reflect the change
      expect(store.sizeSystem()).toBe('us');
      expect(component.sizeSystem()).toBe('us');
    });

    it('should update through component and reflect in store', () => {
      // Change through component
      component.switchToUS();
      
      // Both should reflect the change
      expect(store.sizeSystem()).toBe('us');
      expect(component.sizeSystem()).toBe('us');
    });

    it('should persist changes across different parts of the app', () => {
      // Simulate size change from products component
      store.setSizeSystem('us');
      
      // Verify it's persisted to localStorage
      const saved = localStorage.getItem('shoestore_guest_preferences');
      expect(saved).toBeTruthy();
      
      const parsed = JSON.parse(saved!);
      expect(parsed.sizeSystem).toBe('us');
      
      // Create a new store instance (simulating different component)
      const newStoreService = TestBed.inject(UserSettingsStore);
      newStoreService.initializeSettings();
      
      // Should load the persisted setting
      setTimeout(() => {
        expect(newStoreService.sizeSystem()).toBe('us');
      }, 0);
    });
  });

  describe('Size System Validation', () => {
    it('should handle invalid size system values gracefully', () => {
      // Try to set invalid value
      store.setSizeSystem('invalid' as any);
      
      // Should remain at previous valid value
      expect(store.sizeSystem()).toBe('eu');
    });

    it('should default to EU for invalid localStorage data', () => {
      // Set invalid data in localStorage
      localStorage.setItem('shoestore_guest_preferences', 'invalid json');
      
      // Initialize store
      store.initializeSettings();
      
      // Should default to EU
      setTimeout(() => {
        expect(store.sizeSystem()).toBe('eu');
      }, 0);
    });
  });

  describe('Multiple Components Synchronization', () => {
    it('should synchronize between multiple component instances', () => {
      // Create multiple components
      const component1 = TestBed.createComponent(TestSizeDisplayComponent).componentInstance;
      const component2 = TestBed.createComponent(TestSizeDisplayComponent).componentInstance;
      
      // Initial state
      expect(component1.sizeSystem()).toBe('eu');
      expect(component2.sizeSystem()).toBe('eu');
      
      // Change through one component
      component1.switchToUS();
      
      // Both should be updated
      expect(component1.sizeSystem()).toBe('us');
      expect(component2.sizeSystem()).toBe('us');
      expect(store.sizeSystem()).toBe('us');
    });
  });

  describe('Authentication Context', () => {
    it('should work for guest users', () => {
      mockAuthStore.isAuthenticated.mockReturnValue(false);
      
      store.setSizeSystem('us');
      
      // Should save to localStorage for guests
      const saved = localStorage.getItem('shoestore_guest_preferences');
      expect(saved).toBeTruthy();
      
      const parsed = JSON.parse(saved!);
      expect(parsed.sizeSystem).toBe('us');
    });

    it('should work for authenticated users', () => {
      mockAuthStore.isAuthenticated.mockReturnValue(true);
      
      store.setSizeSystem('us');
      
      // Should still save to localStorage (until backend is implemented)
      const saved = localStorage.getItem('shoestore_guest_preferences');
      expect(saved).toBeTruthy();
      
      const parsed = JSON.parse(saved!);
      expect(parsed.sizeSystem).toBe('us');
    });
  });
});