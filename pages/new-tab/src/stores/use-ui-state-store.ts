/**
 * UI State Store
 *
 * Purpose: Manage UI-only state (views, modes, modals)
 * Responsibilities:
 * - Current view (script/assets)
 * - Script view mode (formatted/json)
 * - Modal open/close states
 * - Loading states (importing, zipping)
 *
 * Benefits:
 * - Separation of UI state from business logic
 * - Easier to test UI state changes
 * - Clear single responsibility
 * - No persistence needed (ephemeral UI state)
 */

import { create } from 'zustand';

interface UIState {
  // View states
  currentView: 'script' | 'assets';

  // Loading states
  isImporting: boolean;
  isZipping: boolean;

  // Modal states
  settingsModalOpen: boolean;

  // Actions
  setCurrentView: (view: 'script' | 'assets') => void;
  setIsImporting: (loading: boolean) => void;
  setIsZipping: (loading: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
}

const useUIStateStore = create<UIState>(set => ({
  // Initial states
  currentView: 'script',
  isImporting: false,
  isZipping: false,
  settingsModalOpen: false,

  // Actions
  setCurrentView: view => set({ currentView: view }),
  setIsImporting: loading => set({ isImporting: loading }),
  setIsZipping: loading => set({ isZipping: loading }),
  setSettingsModalOpen: open => set({ settingsModalOpen: open }),
}));

export { useUIStateStore };
