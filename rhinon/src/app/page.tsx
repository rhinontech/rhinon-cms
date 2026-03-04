"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Cookies from "js-cookie";
import Loading from "./loading";
import { useUserStore } from "@/utils/store";
import { toast } from "sonner";

export default function Home() {
  const router = useRouter();
  const setUserData = useUserStore((state) => state.setUserData);

  const redirectAccToUserRole = (userRole: string) => {
    router.push(`/${userRole}/dashboard`);
  };

  const getUserDetailsFn = async () => {
    try {
      const response = {
        current_role: "superadmin",
        subscription_end_date: "2029-01-01T00:00:00Z",
        user_id: "usr_123",
        email: "superadmin@example.com",
        assigned_by: undefined,
        first_name: "Superadmin",
        last_name: "User",
        assigned_roles: ["superadmin"],
        permissions: {},
        organization_id: 1,
        organization_name: "Dummy Org",
        company_size: "1-10",
        roles: ["superadmin"],
        access: {
          dashboard: "true",
          settings: "true"
        },
        image_url: null,
        subscription_tier: "Premium",
        seo_compliance_trigger_count: 0,
        seo_performance_trigger_count: 0,
        chatbot_id: undefined,
        chat_count: 0,
        ticket_count: 0,
        totalVisitorsNow: 0,
        onboarding: {
          tours_completed: {},
          banners_seen: {},
          installation_guide: { syncWebsite: false, customizeChatbot: false },
          chatbot_installed: false,
        }
      };

      // console.log(response);
      if (!response?.current_role) {
        toast.error("You don't have any roles");
        Cookies.remove("authToken");
        Cookies.remove("currentRole");
        router.push("/auth/login");
        return;
      }

      Cookies.set("currentRole", response.current_role);

      // Calculate if plan is still valid
      const trialEndDate = new Date(response.subscription_end_date);
      const currentDate = new Date();
      const isPlanValid = trialEndDate > currentDate;

      Cookies.set("isPlanValid", isPlanValid ? "true" : "false");

      // Save in Zustand
      setUserData({
        userId: 1,
        userEmail: response.email,
        assignedBy: response.assigned_by,
        userFirstName: response.first_name,
        userLastName: response.last_name,
        currentRole: response.current_role,
        assignedRoles: response.assigned_roles,
        assignedRolePermissions: response.permissions,
        orgId: Number(response.organization_id),
        orgName: response.organization_name,
        companySize: response.company_size,
        isPlanValid,
        planExpiryDate: response.subscription_end_date,
        orgRoles: response.roles,
        orgRolesAccess: response.access,
        profilePic: response.image_url ?? null,
        orgPlan: response.subscription_tier,
      });

      Cookies.set("roleAccess", JSON.stringify(response.access));
      redirectAccToUserRole(response.current_role);
    } catch (err) {
      console.error("Error fetching user details:", err);
      Cookies.remove("authToken");
      Cookies.remove("currentRole");
      router.push("/auth/login");
    }
  };
  useEffect(() => {
    const init = async () => {
      try {
        // await getUserFn(); // fetch both Google & Microsoft tokens
        await getUserDetailsFn(); // fetch user details
      } catch (error) {
        console.error("User is not authenticated", error);
        Cookies.remove("authToken");
        Cookies.remove("currentRole");
        router.push("/auth/login");
      }
    };

    init();
  }, []);

  return <Loading />;
}
