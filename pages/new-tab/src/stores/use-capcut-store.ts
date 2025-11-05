/**
 * CapCut Store
 * Manages CapCut export state: draft ID, task status, progress tracking
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TaskStatus } from '@src/services/capcut-api';

// ============================================================================
// Types
// ============================================================================

interface CapCutExportState {
  // Current export state
  isExporting: boolean;
  currentStage: string; // 'Creating draft', 'Uploading assets', etc.
  progress: number; // 0-100
  error: string | null;

  // Draft & Task tracking
  currentDraftId: string | null;
  currentTaskId: string | null;
  taskStatus: TaskStatus | null;

  // Export history (persisted)
  exportHistory: ExportHistoryItem[];

  // Server configuration
  serverUrl: string;
  isServerConnected: boolean;
}

interface ExportHistoryItem {
  id: string;
  scriptId: number;
  scriptTitle: string;
  draftId: string;
  taskId: string;
  videoUrl?: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  createdAt: number;
  completedAt?: number;
  error?: string;
}

interface CapCutExportActions {
  // Export actions
  startExport: (scriptId: number, scriptTitle: string) => void;
  setStage: (stage: string, progress: number) => void;
  setDraftId: (draftId: string) => void;
  setTaskId: (taskId: string) => void;
  updateTaskStatus: (status: TaskStatus) => void;
  completeExport: (videoUrl: string) => void;
  failExport: (error: string) => void;
  cancelExport: () => void;
  resetExport: () => void;

  // History actions
  addHistoryItem: (item: Omit<ExportHistoryItem, 'id' | 'createdAt'>) => void;
  updateHistoryItem: (id: string, updates: Partial<ExportHistoryItem>) => void;
  clearHistory: () => void;

  // Server configuration
  setServerUrl: (url: string) => void;
  setServerConnected: (connected: boolean) => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: CapCutExportState = {
  isExporting: false,
  currentStage: '',
  progress: 0,
  error: null,
  currentDraftId: null,
  currentTaskId: null,
  taskStatus: null,
  exportHistory: [],
  serverUrl: 'http://localhost:9001',
  isServerConnected: false,
};

// ============================================================================
// Store
// ============================================================================

const useCapCutStore = create<CapCutExportState & CapCutExportActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Export actions
      startExport: (scriptId, scriptTitle) => {
        set({
          isExporting: true,
          currentStage: 'Initializing',
          progress: 0,
          error: null,
          currentDraftId: null,
          currentTaskId: null,
          taskStatus: null,
        });

        // Add to history
        const historyItem: Omit<ExportHistoryItem, 'id' | 'createdAt'> = {
          scriptId,
          scriptTitle,
          draftId: '',
          taskId: '',
          status: 'pending',
        };
        get().addHistoryItem(historyItem);
      },

      setStage: (stage, progress) => {
        set({ currentStage: stage, progress });
      },

      setDraftId: draftId => {
        set({ currentDraftId: draftId });

        // Update history
        const history = get().exportHistory;
        if (history.length > 0) {
          const lastItem = history[history.length - 1];
          get().updateHistoryItem(lastItem.id, { draftId });
        }
      },

      setTaskId: taskId => {
        set({ currentTaskId: taskId });

        // Update history
        const history = get().exportHistory;
        if (history.length > 0) {
          const lastItem = history[history.length - 1];
          get().updateHistoryItem(lastItem.id, {
            taskId,
            status: 'processing',
          });
        }
      },

      updateTaskStatus: status => {
        set({ taskStatus: status });
      },

      completeExport: videoUrl => {
        set({
          isExporting: false,
          currentStage: 'Complete',
          progress: 100,
          error: null,
        });

        // Update history
        const history = get().exportHistory;
        if (history.length > 0) {
          const lastItem = history[history.length - 1];
          get().updateHistoryItem(lastItem.id, {
            videoUrl,
            status: 'success',
            completedAt: Date.now(),
          });
        }
      },

      failExport: error => {
        set({
          isExporting: false,
          error,
        });

        // Update history
        const history = get().exportHistory;
        if (history.length > 0) {
          const lastItem = history[history.length - 1];
          get().updateHistoryItem(lastItem.id, {
            status: 'failed',
            error,
            completedAt: Date.now(),
          });
        }
      },

      cancelExport: () => {
        set({
          isExporting: false,
          currentStage: 'Cancelled',
          error: 'Export cancelled by user',
        });

        // Update history
        const history = get().exportHistory;
        if (history.length > 0) {
          const lastItem = history[history.length - 1];
          get().updateHistoryItem(lastItem.id, {
            status: 'failed',
            error: 'Cancelled by user',
            completedAt: Date.now(),
          });
        }
      },

      resetExport: () => {
        set({
          isExporting: false,
          currentStage: '',
          progress: 0,
          error: null,
          currentDraftId: null,
          currentTaskId: null,
          taskStatus: null,
        });
      },

      // History actions
      addHistoryItem: item => {
        const newItem: ExportHistoryItem = {
          ...item,
          id: `export_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          createdAt: Date.now(),
        };

        set(state => ({
          exportHistory: [...state.exportHistory, newItem],
        }));
      },

      updateHistoryItem: (id, updates) => {
        set(state => ({
          exportHistory: state.exportHistory.map(item => (item.id === id ? { ...item, ...updates } : item)),
        }));
      },

      clearHistory: () => {
        set({ exportHistory: [] });
      },

      // Server configuration
      setServerUrl: url => {
        set({ serverUrl: url });
      },

      setServerConnected: connected => {
        set({ isServerConnected: connected });
      },
    }),
    {
      name: 'capcut-store',
      partialize: state => ({
        exportHistory: state.exportHistory,
        serverUrl: state.serverUrl,
      }),
    },
  ),
);

// ============================================================================
// Selectors
// ============================================================================

const selectIsExporting = (state: CapCutExportState & CapCutExportActions) => state.isExporting;

const selectExportProgress = (state: CapCutExportState & CapCutExportActions) => ({
  stage: state.currentStage,
  progress: state.progress,
});

const selectExportHistory = (state: CapCutExportState & CapCutExportActions) => state.exportHistory;

const selectServerConfig = (state: CapCutExportState & CapCutExportActions) => ({
  url: state.serverUrl,
  connected: state.isServerConnected,
});

// ============================================================================
// Exports
// ============================================================================

export type { CapCutExportState, ExportHistoryItem, CapCutExportActions };
export { useCapCutStore, selectIsExporting, selectExportProgress, selectExportHistory, selectServerConfig };
