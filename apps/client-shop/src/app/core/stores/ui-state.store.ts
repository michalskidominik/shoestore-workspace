import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';

interface UiState {
  isSidebarVisible: boolean;
}

const initialState: UiState = {
  isSidebarVisible: true
};

export const UiStateStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    toggleSidebar(): void {
      patchState(store, { 
        isSidebarVisible: !store.isSidebarVisible() 
      });
    },

    setSidebarVisibility(visible: boolean): void {
      patchState(store, { isSidebarVisible: visible });
    }
  }))
);