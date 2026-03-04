// utils/store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserData = {
  userId: number;
  orgId: number;
  isPlanValid: boolean;
  planExpiryDate: string;
  orgName: string;
  currentRole: string;
  assignedRoles: string[];
  assignedRolePermissions: Record<string, string>;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  profilePic: string | null;
  assignedBy: number;
  companySize: string;
  orgRoles: string[];
  orgRolesAccess: Record<string, string>;
  orgPlan: string;
};

export type AdminActions = {
  setUsetData: (data: Partial<UserData>) => void;
};

interface BannerState {
  isShowBanner: boolean;
  setIsShowBanner: (value: boolean) => void;
}

const initialUserData: UserData = {
  userId: 0,
  orgId: 0,
  isPlanValid: true,
  planExpiryDate: "",
  orgName: "",
  currentRole: "",
  assignedRoles: [],
  assignedRolePermissions: {},
  userEmail: "",
  userFirstName: "",
  userLastName: "",
  profilePic: null,
  assignedBy: 0,
  companySize: "",
  orgRoles: [],
  orgRolesAccess: {},
  orgPlan: "Trial",
};

export const useUserStore = create<{
  userData: UserData;
  setUserData: (data: Partial<UserData>) => void;
}>()(
  persist(
    (set) => ({
      userData: initialUserData,
      setUserData: (data) =>
        set((state) => ({
          userData: { ...state.userData, ...data },
        })),
    }),
    {
      name: "user-data",
    }
  )
);

export const useBannerStore = create<BannerState>((set) => ({
  isShowBanner: false,
  setIsShowBanner: (value) => set({ isShowBanner: value }),
}));
