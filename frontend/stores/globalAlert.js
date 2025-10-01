// stores/globalAlert.js
import { create } from "zustand";
export const useGlobalAlert = create((set) => ({
  show: false,
  message: "",
  type: "toast", // "toast" | "bottomsheet"
  isHtml: false, // ★ 추가

  showAlert: (message, options = {}) => {
    return set({
      show: true,
      message,
      type: options.type || "toast",
      isHtml: options.isHtml || false,
    });
  },
  
  hideAlert: () => {
    return set({ show: false, message: "", type: "toast", isHtml: false });
  },
}));
