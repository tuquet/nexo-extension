import { create } from 'zustand';

interface ApiKeyStore {
  apiKey: string | null;
  setApiKey: (k: string | null) => void;
  isApiKeySet: () => boolean;
}

const useApiKey = create<ApiKeyStore>((set, get) => ({
  apiKey: null,
  setApiKey: k => set({ apiKey: k }),
  isApiKeySet: () => !!get().apiKey?.trim(),
}));

export { useApiKey };
