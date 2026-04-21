import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

export const ALL_PERMISSIONS = [
  { key: "accounts",      label: "Accounts",      description: "Manage users and hotel owners" },
  { key: "subscriptions", label: "Subscriptions",  description: "View and manage subscription plans" },
  { key: "reports",       label: "Reports & Exports", description: "View reports and download CSV exports" },
  { key: "properties",    label: "Properties",     description: "Review and approve property listings" },
  { key: "bookings",      label: "Bookings",       description: "View and manage bookings" },
  { key: "kyc",           label: "KYC",            description: "Review KYC document submissions" },
  { key: "content",       label: "Content",        description: "Policies, agreements, about-us, contact settings" },
  { key: "support",       label: "Support",        description: "Customer support inbox" },
  { key: "coming_soon",   label: "Coming Soon",    description: "Control site access and tester whitelist" },
] as const;

export type PermissionKey = typeof ALL_PERMISSIONS[number]["key"];

interface AdminAccessData {
  isFullAdmin: boolean;
  permissions: string[];
}

export function useAdminAccess() {
  const { user, isAdmin } = useAuth();

  const { data, isLoading } = useQuery<AdminAccessData>({
    queryKey: ["/api/admin/my-permissions"],
    queryFn: () =>
      fetch("/api/admin/my-permissions", { credentials: "include" }).then((r) => r.json()),
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  const hasPermission = (key: PermissionKey): boolean => {
    if (!data) return isAdmin;
    if (data.isFullAdmin) return true;
    return data.permissions.includes(key);
  };

  const hasAnyAdminAccess = data
    ? data.isFullAdmin || data.permissions.length > 0
    : isAdmin;

  return {
    isFullAdmin: data?.isFullAdmin ?? isAdmin,
    permissions: data?.permissions ?? [],
    hasPermission,
    hasAnyAdminAccess,
    isLoading,
  };
}
