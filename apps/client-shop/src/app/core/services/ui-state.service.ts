import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiStateService {
  private readonly _isSidebarVisible = signal(true);

  readonly isSidebarVisible = this._isSidebarVisible.asReadonly();

  toggleSidebar(): void {
    this._isSidebarVisible.update(visible => !visible);
  }

  setSidebarVisibility(visible: boolean): void {
    this._isSidebarVisible.set(visible);
  }
}
