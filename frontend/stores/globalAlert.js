// stores/globalAlert.js
import { create } from "zustand";
export const useGlobalAlert = create((set) => ({
  show: false,
  message: "",
  type: "toast", // "toast" | "bottomsheet"
  showAlert: (message, type = "toast") => set({ show: true, message, type }),
  hideAlert: () => set({ show: false, message: "", type: "toast" }),
}));
