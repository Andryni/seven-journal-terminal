import { create } from 'zustand';

interface UIState {
  activeAccountId: string | null; // null = all accounts
  setActiveAccountId: (id: string | null) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  isDailySessionLocked: boolean;
  setDailySessionLocked: (locked: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeAccountId: null,
  setActiveAccountId: (id) => set({ activeAccountId: id }),
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  isDailySessionLocked: false,
  setDailySessionLocked: (locked) => set({ isDailySessionLocked: locked }),
}));
