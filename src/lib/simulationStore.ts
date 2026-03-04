import { create } from 'zustand';

interface SimulationState {
  tick: number;
  isPaused: boolean;

  // Stats shared across panels
  stats: {
    totalReplies: number;
    meetingsBooked: number;
    activeCampaigns: number;
  };

  // Actions
  advanceTick: () => void;
  setPaused: (paused: boolean) => void;
  updateStats: (updates: Partial<SimulationState['stats']>) => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  tick: 0,
  isPaused: false,
  stats: {
    totalReplies: 0,
    meetingsBooked: 0,
    activeCampaigns: 12,
  },

  advanceTick: () => set((state) => ({ tick: state.tick + 1 })),
  setPaused: (paused) => set({ isPaused: paused }),
  updateStats: (updates) => set((state) => ({ stats: { ...state.stats, ...updates } })),
}));

// Global interval manager
let intervalId: ReturnType<typeof setInterval> | null = null;

export const startGlobalSimulation = () => {
  if (intervalId) return;

  intervalId = setInterval(() => {
    const state = useSimulationStore.getState();
    if (!state.isPaused) {
      state.advanceTick();
    }
  }, 1000); // 1 tick per second
};

export const stopGlobalSimulation = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};
