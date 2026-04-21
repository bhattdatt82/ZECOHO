import { useAdminAccess, type PermissionKey } from "@/hooks/useAdminAccess";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldOff } from "lucide-react";

interface AdminGuardProps {
  children: React.ReactNode;
  permission?: PermissionKey;
}

export function AdminGuard({ children, permission }: AdminGuardProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isFullAdmin, hasPermission, hasAnyAdminAccess, isLoading } = useAdminAccess();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  if (authLoading || isLoading) {
    return (
      <div className="p-8 space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!hasAnyAdminAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center p-8">
        <ShieldOff className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground max-w-sm">
          You don't have permission to access the admin panel.
        </p>
      </div>
    );
  }

  // If a specific permission is required and the user isn't a full admin
  if (permission && !hasPermission(permission)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center p-8">
        <ShieldOff className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Section Restricted</h2>
        <p className="text-muted-foreground max-w-sm">
          You don't have permission to access this section. Contact your administrator.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
