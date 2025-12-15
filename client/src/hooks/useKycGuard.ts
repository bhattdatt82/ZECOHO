import { useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "./useAuth";

// Routes allowed for authenticated users with rejected KYC
// Includes essential routes for navigation and fixing KYC
const ALLOWED_ROUTES_FOR_REJECTED = [
  "/",
  "/owner/dashboard",
  "/owner/kyc",
  "/owner/property",
  "/owner/settings",
  "/list-property",
  "/login",
  "/register",
  "/api/logout",
];

export function useKycGuard() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  // Check KYC status directly from user object - works regardless of current role/view
  const isKycRejected = user?.kycStatus === "rejected";
  const isKycPending = user?.kycStatus === "pending";
  const isKycNotStarted = user?.kycStatus === "not_started";
  const isKycVerified = user?.kycStatus === "verified";

  // User has rejected KYC - this is the key flag, not dependent on isOwner
  const hasRejectedKyc = !!user && isKycRejected;

  // Check if current route is in the allowed whitelist
  const isOnAllowedRoute = useMemo(() => {
    // Check exact matches and prefix matches for allowed routes
    return ALLOWED_ROUTES_FOR_REJECTED.some((route) => {
      return location === route || location.startsWith(route + "?") || location.startsWith(route + "/");
    });
  }, [location]);

  // Whitelist approach: block ANY route not explicitly allowed for rejected KYC users
  const shouldBlockAccess = hasRejectedKyc && !isOnAllowedRoute;

  return {
    isKycRejected,
    isKycPending,
    isKycNotStarted,
    isKycVerified,
    hasRejectedKyc,
    isOnAllowedRoute,
    shouldBlockAccess,
    isLoading,
  };
}
