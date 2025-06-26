// frontend/stores/globalLoading.js
import { create } from "zustand";

const useGlobalLoading = create((set) => ({
  isLoading: false,
  showLoading: () => set({ isLoading: true }),
  hideLoading: () => set({ isLoading: false }),
}));

export default useGlobalLoading;
