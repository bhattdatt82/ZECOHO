import { useState, useEffect } from "react";
import { useLocation, Link, Redirect } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { OwnerWelcomeModal } from "@/components/OwnerWelcomeModal";
import { KycPromptModal, useKycPromptModal } from "@/components/KycPromptModal";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  CalendarCheck,
  MessageSquare,
  Building2,
  IndianRupee,
  Star,
  Settings,
  ArrowLeft,
  LogOut,
  FileText,
  HelpCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface OwnerLayoutProps {
  children: React.ReactNode;
}

const fullMenuItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/owner/dashboard" },
  { title: "Bookings", icon: CalendarCheck, path: "/owner/bookings" },
  { title: "Messages", icon: MessageSquare, path: "/owner/messages" },
  { title: "Property", icon: Building2, path: "/owner/property" },
  { title: "Earnings", icon: IndianRupee, path: "/owner/earnings" },
  { title: "Reviews", icon: Star, path: "/owner/reviews" },
  { title: "Settings", icon: Settings, path: "/owner/settings" },
];

const limitedMenuItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/owner/dashboard" },
  { title: "My Property", icon: Building2, path: "/owner/property" },
  { title: "Documents", icon: FileText, path: "/list-property" },
  { title: "Support", icon: HelpCircle, path: "/owner/settings" },
];

const rejectedMenuItems = [
  { title: "KYC Review", icon: AlertTriangle, path: "/owner/kyc" },
  { title: "My Property", icon: Building2, path: "/owner/property" },
  { title: "Support", icon: HelpCircle, path: "/owner/settings" },
];

const allowedPathsWhenRejected = ["/owner/kyc", "/owner/property", "/owner/settings", "/list-property"];

// Helper to check if a path is allowed for rejected users (handles query strings)
function isPathAllowedForRejected(currentPath: string): boolean {
  return allowedPathsWhenRejected.some(path => 
    currentPath === path || currentPath.startsWith(path + "?") || currentPath.startsWith(path + "/")
  );
}

export function OwnerLayout({ children }: OwnerLayoutProps) {
  const { user, isLoading, isOwner } = useAuth();
  const [location, setLocation] = useLocation();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const { showModal: showKycPrompt, setShowModal: setShowKycPrompt } = useKycPromptModal(isOwner, user?.kycStatus);

  useEffect(() => {
    if (user && isOwner && !(user as any).hasSeenOwnerModal) {
      setShowWelcomeModal(true);
    }
  }, [user, isOwner]);

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="owner-layout-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isOwner) {
    return <Redirect to="/" />;
  }

  // Redirect owners who haven't selected a listing mode yet
  const listingMode = (user as any).listingMode;
  if (listingMode === "not_selected" && location !== "/owner/choose-mode") {
    return <Redirect to="/owner/choose-mode" />;
  }

  const userInitials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "O";

  const isRejected = user.kycStatus === "rejected";
  const isVerified = user.kycStatus === "verified";
  const isQuickListing = listingMode === "quick";
  const isPreApproval = !isVerified;

  const menuItems = isRejected 
    ? rejectedMenuItems 
    : isPreApproval 
    ? limitedMenuItems 
    : fullMenuItems;

  if (isRejected && !isPathAllowedForRejected(location)) {
    return <Redirect to="/owner/kyc" />;
  }

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getBadgeContent = () => {
    if (isVerified) return "Verified Owner";
    if (isRejected) return "KYC Rejected";
    return "Pending Approval";
  };

  const getBadgeVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    if (isRejected) return "destructive";
    return "secondary";
  };

  return (
    <>
      <OwnerWelcomeModal 
        open={showWelcomeModal} 
        onClose={() => setShowWelcomeModal(false)} 
      />
      <KycPromptModal
        open={showKycPrompt && !showWelcomeModal}
        onClose={() => setShowKycPrompt(false)}
      />
      <SidebarProvider style={sidebarStyle}>
        <div className="flex h-screen w-full">
          <Sidebar>
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "Owner"} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm truncate" data-testid="owner-name">
                  {user.firstName} {user.lastName}
                </span>
                {isRejected ? (
                  <Badge 
                    variant="destructive" 
                    className="w-fit text-xs cursor-pointer hover:bg-red-700 dark:hover:bg-red-800 relative z-50" 
                    data-testid="owner-badge-rejected"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLocation("/list-property?mode=complete");
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setLocation("/list-property?mode=complete");
                      }
                    }}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    KYC Rejected - Fix Now
                  </Badge>
                ) : (
                  <Badge variant={getBadgeVariant()} className="w-fit text-xs" data-testid="owner-badge">
                    {getBadgeContent()}
                  </Badge>
                )}
              </div>
            </div>
          </SidebarHeader>
          
          <Separator className="mx-2" />
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.path}
                        tooltip={item.title}
                      >
                        <Link href={item.path} data-testid={`nav-${item.title.toLowerCase()}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-2">
            <Separator className="mb-2" />
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Back to Home">
                  <Link href="/" data-testid="nav-back-home">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  tooltip="Logout"
                  data-testid="nav-logout"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b px-4 lg:px-6">
            <SidebarTrigger data-testid="sidebar-toggle" />
            <div className="flex-1">
              <h1 className="text-lg font-semibold" data-testid="page-title">
                {menuItems.find((item) => item.path === location)?.title || "Owner Portal"}
              </h1>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            {children}
          </main>
        </SidebarInset>
        </div>
      </SidebarProvider>
    </>
  );
}
