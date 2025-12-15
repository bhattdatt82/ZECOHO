import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

// KYC Status types
type KycStatus = "not_started" | "incomplete" | "pending" | "verified" | "rejected";

// Routes that rejected users CAN access
const ALLOWED_ROUTES_FOR_REJECTED = [
  "/owner/kyc",
  "/owner/dashboard",
  "/owner/property",
  "/owner/settings",
  "/list-property",
  "/",
  "/search",
  "/properties",
  "/destinations",
  "/login",
  "/register",
  "/profile",
];

// Routes blocked for submitted/pending KYC (read-only dashboard)
const BLOCKED_ROUTES_FOR_SUBMITTED = [
  "/owner/bookings",
  "/owner/earnings",
  "/owner/messages",
  "/owner/reviews",
];

// Routes that require verified KYC for full access
const RESTRICTED_OWNER_ACTIONS = [
  "/owner/bookings",
  "/owner/earnings", 
  "/owner/messages",
  "/owner/reviews",
];

function isPathMatch(currentPath: string, routes: string[]): boolean {
  return routes.some(route => 
    currentPath === route || 
    currentPath.startsWith(route + "?") || 
    currentPath.startsWith(route + "/")
  );
}

function isOwnerRoute(path: string): boolean {
  return path.startsWith("/owner/");
}

interface KycRouteGuardProps {
  children: React.ReactNode;
}

export function KycRouteGuard({ children }: KycRouteGuardProps) {
  const [location, setLocation] = useLocation();
  const { user, isLoading, isOwner } = useAuth();
  const lastLocationRef = useRef<string>(location);
  const hasRedirectedRef = useRef<boolean>(false);

  useEffect(() => {
    // Skip during loading
    if (isLoading) {
      return;
    }

    // Skip if no user or not an owner
    if (!user || !isOwner) {
      lastLocationRef.current = location;
      return;
    }

    // Only run guard logic when location actually changes
    if (location === lastLocationRef.current && hasRedirectedRef.current) {
      return;
    }

    const kycStatus = user.kycStatus as KycStatus;
    const targetRoute = location;

    // Reset redirect flag on new navigation
    if (location !== lastLocationRef.current) {
      hasRedirectedRef.current = false;
    }

    // Only apply guards on owner routes
    if (!isOwnerRoute(targetRoute)) {
      lastLocationRef.current = location;
      return;
    }

    // REJECTED: Block all except allowed routes
    if (kycStatus === "rejected") {
      if (!isPathMatch(targetRoute, ALLOWED_ROUTES_FOR_REJECTED)) {
        console.log(`[KYC Guard] Redirecting: REJECTED user trying to access ${targetRoute} → /owner/kyc`);
        hasRedirectedRef.current = true;
        setLocation("/owner/kyc");
        return;
      }
    }

    // SUBMITTED/PENDING: Allow dashboard, block restricted routes
    if (kycStatus === "pending") {
      if (isPathMatch(targetRoute, BLOCKED_ROUTES_FOR_SUBMITTED)) {
        console.log(`[KYC Guard] Redirecting: SUBMITTED user trying to access ${targetRoute} → /owner/dashboard`);
        hasRedirectedRef.current = true;
        setLocation("/owner/dashboard");
        return;
      }
    }

    // NOT_STARTED or INCOMPLETE: Allow navigation, only block on restricted actions
    // (The blocking for specific actions is handled by action handlers, not route guard)
    if (kycStatus === "not_started" || kycStatus === "incomplete") {
      // These users can browse freely
      // Restricted action redirects happen via shouldBlockAction() helper
    }

    // VERIFIED: Full access
    if (kycStatus === "verified") {
      // No restrictions
    }

    lastLocationRef.current = location;
  }, [location, user, isLoading, isOwner, setLocation]);

  return <>{children}</>;
}

// Helper hook for components to check if an action should be blocked
export function useKycActionGuard() {
  const { user, isOwner } = useAuth();
  const [, setLocation] = useLocation();

  const kycStatus = user?.kycStatus as KycStatus | undefined;

  const shouldBlockAction = (actionType: "publish" | "pricing" | "bookings" | "messages"): boolean => {
    if (!isOwner || !kycStatus) return false;

    // Rejected users are blocked from most actions
    if (kycStatus === "rejected") {
      return true;
    }

    // Submitted users can't do certain actions
    if (kycStatus === "pending") {
      return ["publish", "pricing", "bookings", "messages"].includes(actionType);
    }

    // Not started/incomplete users are blocked from owner actions
    if (kycStatus === "not_started" || kycStatus === "incomplete") {
      return ["publish", "pricing", "bookings"].includes(actionType);
    }

    return false;
  };

  const redirectToKyc = (reason: string) => {
    console.log(`[KYC Action Guard] Redirecting: ${reason} → /owner/kyc`);
    setLocation("/owner/kyc");
  };

  const handleRestrictedAction = (actionType: "publish" | "pricing" | "bookings" | "messages"): boolean => {
    if (shouldBlockAction(actionType)) {
      redirectToKyc(`Action "${actionType}" blocked for KYC status: ${kycStatus}`);
      return true; // Action was blocked
    }
    return false; // Action allowed
  };

  return {
    kycStatus,
    isVerified: kycStatus === "verified",
    isRejected: kycStatus === "rejected",
    isPending: kycStatus === "pending",
    isNotStarted: kycStatus === "not_started",
    isIncomplete: kycStatus === "incomplete",
    shouldBlockAction,
    handleRestrictedAction,
    redirectToKyc,
  };
}
