import { create } from 'zustand';

interface XPNotificationState {
  visible: boolean;
  xpAmount: number;
  showXPNotification: (amount: number) => void;
  hideXPNotification: () => void;
}

export const useXPNotificationStore = create<XPNotificationState>((set) => ({
  visible: false,
  xpAmount: 0,
  showXPNotification: (amount: number) => {
    set({ visible: true, xpAmount: amount });
  },
  hideXPNotification: () => {
    set({ visible: false, xpAmount: 0 });
  },
}));
