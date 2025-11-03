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
  scriptViewMode: 'formatted' | 'json';

  // Loading states
  isImporting: boolean;
  isZipping: boolean;

  // Modal states
  settingsModalOpen: boolean;
  modelSettingsModalOpen: boolean;

  // Actions
  setCurrentView: (view: 'script' | 'assets') => void;
  setScriptViewMode: (mode: 'formatted' | 'json') => void;
  setIsImporting: (loading: boolean) => void;
  setIsZipping: (loading: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  setModelSettingsModalOpen: (open: boolean) => void;
}

const useUIStateStore = create<UIState>(set => ({
  // Initial states
  currentView: 'script',
  scriptViewMode: 'formatted',
  isImporting: false,
  isZipping: false,
  settingsModalOpen: false,
  modelSettingsModalOpen: false,

  // Actions
  setCurrentView: view => set({ currentView: view }),
  setScriptViewMode: mode => set({ scriptViewMode: mode }),
  setIsImporting: loading => set({ isImporting: loading }),
  setIsZipping: loading => set({ isZipping: loading }),
  setSettingsModalOpen: open => set({ settingsModalOpen: open }),
  setModelSettingsModalOpen: open => set({ modelSettingsModalOpen: open }),
}));

export { useUIStateStore };
