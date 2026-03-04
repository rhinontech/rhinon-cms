import { create } from "zustand";
import { ReactNode } from "react";
import { useUserStore } from "@/utils/store";

interface BannerState {
  isVisible: boolean;
  content: ReactNode | null;
  type: "info" | "warning" | "error" | "success";

  showBanner: (
    content: ReactNode,
    type?: "info" | "warning" | "error" | "success"
  ) => void;
  hideBanner: () => void;
  initBanner: () => void;
}

export const useBannerStore = create<BannerState>((set) => ({
  isVisible: false,
  content: null,
  type: "info",

  showBanner: (content, type = "info") =>
    set({ isVisible: true, content, type }),

  hideBanner: () => set({ isVisible: false }),

  initBanner: () => {
    const { orgPlan, planExpiryDate, isPlanValid } =
      useUserStore.getState().userData;

    if (!planExpiryDate) {
      set({ isVisible: false });
      return;
    }

    const expiry = new Date(planExpiryDate);
    const today = new Date();
    const diffMs = expiry.getTime() - today.getTime();
    const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (!isPlanValid) {
      set({
        isVisible: true,
        content: "Your plan has expired.",
        type: "error",
      });
      return;
    }

    if (orgPlan === "Free" || orgPlan === "Trial") {
      set({
        isVisible: true,
        content: `Your ${orgPlan} plan expires in ${remainingDays} days.`,
        type: remainingDays <= 3 ? "warning" : "info",
      });
      return;
    }

    if (remainingDays <= 15) {
      set({
        isVisible: true,
        content: `Your ${orgPlan} plan is ending in ${remainingDays} days.`,
        type: remainingDays <= 3 ? "warning" : "info",
      });
      return;
    }

    set({ isVisible: false });
  },
}));
