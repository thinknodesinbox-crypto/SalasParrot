import { create } from 'zustand';

interface AssistantUiState {
  isDrawerOpen: boolean;
  selectedThreadId: string | null;
  openDrawer: (threadId?: string | null) => void;
  closeDrawer: () => void;
  setSelectedThreadId: (threadId: string | null) => void;
}

export const useAssistantUiStore = create<AssistantUiState>((set) => ({
  isDrawerOpen: false,
  selectedThreadId: null,
  openDrawer: (threadId) =>
    set((state) => ({
      isDrawerOpen: true,
      selectedThreadId: threadId ?? state.selectedThreadId,
    })),
  closeDrawer: () => set({ isDrawerOpen: false }),
  setSelectedThreadId: (threadId) => set({ selectedThreadId: threadId }),
}));
