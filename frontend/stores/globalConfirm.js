// frontend/stores/globalConfirm.js
import { create } from "zustand";

export const useGlobalConfirm = create((set) => ({
  visible: false,
  message: "",
  resolve: null,
  reject: null,

  showConfirm(message) {
    return new Promise((resolve, reject) => {
      set({
        visible: true,
        message,
        resolve,
        reject,
      });
    });
  },
  confirm() {
    set((state) => {
      state.resolve?.(true);
      return { visible: false, message: "", resolve: null, reject: null };
    });
  },
  cancel() {
    set((state) => {
      state.resolve?.(false);
      return { visible: false, message: "", resolve: null, reject: null };
    });
  },
  close() {
    set({ visible: false, message: "", resolve: null, reject: null });
  },
}));
