import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Workspace } from './types';

interface WorkspaceState {
  currentWorkspaceId: string | null;
  currentWorkspace: Workspace | null;

  // Actions
  setCurrentWorkspace: (workspace: Workspace) => void;
  setCurrentWorkspaceId: (id: string) => void;
  clearCurrentWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentWorkspaceId: null,
      currentWorkspace: null,

      setCurrentWorkspace: (workspace: Workspace) => {
        set({
          currentWorkspaceId: workspace.id,
          currentWorkspace: workspace,
        });
      },

      setCurrentWorkspaceId: (id: string) => {
        set({ currentWorkspaceId: id });
      },

      clearCurrentWorkspace: () => {
        set({
          currentWorkspaceId: null,
          currentWorkspace: null,
        });
      },
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({ currentWorkspaceId: state.currentWorkspaceId }),
    }
  )
);

// Hook to check if workspace store has hydrated from localStorage
export const useWorkspaceHydrated = () => {
  return useWorkspaceStore.persist.hasHydrated();
};

// Hook to get current workspace
export const useCurrentWorkspace = () => {
  const { currentWorkspaceId, currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  return { currentWorkspaceId, currentWorkspace, setCurrentWorkspace };
};
