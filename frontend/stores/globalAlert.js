// stores/globalAlert.js
import { create } from "zustand";
export const useGlobalAlert = create((set) => ({
  show: false,
  message: "",
  type: "toast", // "toast" | "bottomsheet"
  isHtml: false, // ★ 추가

  showAlert: (message, options = {}) =>
    set({
      show: true,
      message,
      type: options.type || "toast",
      isHtml: options.isHtml || false, // ★ 옵션으로 HTML 허용 여부
    }),

  hideAlert: () =>
    set({ show: false, message: "", type: "toast", isHtml: false }),
}));
