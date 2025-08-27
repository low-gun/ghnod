// frontend/stores/globalAgreements.js
import { create } from "zustand";

export const useGlobalAgreements = create((set, get) => ({
  visible: false,
  initial: { terms: false, privacy: false, marketing: false },
  onConfirm: null,
  onCancel: null,

  // 열기
  open: ({ initial = {}, onConfirm = null, onCancel = null }) => {
    set({
      visible: true,
      initial: {
        terms: !!initial.terms,
        privacy: !!initial.privacy,
        marketing: !!initial.marketing,
      },
      onConfirm,
      onCancel,
    });
  },

  // 확인
  confirm: (result) => {
    const fn = get().onConfirm;
    if (typeof fn === "function") fn(result);
    set({ visible: false, onConfirm: null, onCancel: null });
  },

  // 취소
  cancel: () => {
    const fn = get().onCancel;
    if (typeof fn === "function") fn();
    set({ visible: false, onConfirm: null, onCancel: null });
  },
}));
