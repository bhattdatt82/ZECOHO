// Referenced from blueprint:javascript_log_in_with_replit
import { useEffect } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useKycGuard } from "@/hooks/useKycGuard";

function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
}
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Search from "@/pages/search";
import SearchHistoryPage from "@/pages/search-history";
import PropertyDetails from "@/pages/property-details";
import Wishlist from "@/pages/wishlist";
import Messages from "@/pages/messages";
import OwnerProperties from "@/pages/owner-properties";
import AddProperty from "@/pages/add-property";
import Profile from "@/pages/profile";
import Destinations from "@/pages/destinations";
import DestinationDetails from "@/pages/destination-details";
import AdminDestinations from "@/pages/admin-destinations";
import AdminProperties from "@/pages/admin-properties";
import AdminKYC from "@/pages/admin-kyc";
import AdminAccess from "@/pages/admin-access";
import KYC from "@/pages/kyc";
import ListPropertyWizard from "@/pages/list-property-wizard";
import DevAdminLogin from "@/pages/dev-admin-login";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import NotFound from "@/pages/not-found";
import OwnerDashboard from "@/pages/owner-dashboard";
import OwnerBookings from "@/pages/owner-bookings";
import OwnerMessagesPage from "@/pages/owner-messages";
import OwnerProperty from "@/pages/owner-property";
import OwnerEarnings from "@/pages/owner-earnings";
import OwnerReviews from "@/pages/owner-reviews";
import OwnerSettings from "@/pages/owner-settings";
import OwnerKyc from "@/pages/owner-kyc";
import ChooseListingMode from "@/pages/choose-listing-mode";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {(!isAuthenticated || isLoading) && (
        <Route path="/" component={Landing} />
      )}
      {isAuthenticated && !isLoading && (
        <>
          <Route path="/" component={Home} />
          <Route path="/wishlist" component={Wishlist} />
          <Route path="/search-history" component={SearchHistoryPage} />
          <Route path="/messages" component={Messages} />
          <Route path="/owner/properties" component={OwnerProperties} />
          <Route path="/owner/properties/new" component={AddProperty} />
          <Route path="/owner/properties/:id/edit" component={AddProperty} />
          <Route path="/admin/destinations" component={AdminDestinations} />
          <Route path="/admin/properties" component={AdminProperties} />
          <Route path="/admin/kyc" component={AdminKYC} />
          <Route path="/profile" component={Profile} />
        </>
      )}
      <Route path="/owner/dashboard" component={OwnerDashboard} />
      <Route path="/owner/bookings" component={OwnerBookings} />
      <Route path="/owner/messages" component={OwnerMessagesPage} />
      <Route path="/owner/property" component={OwnerProperty} />
      <Route path="/owner/earnings" component={OwnerEarnings} />
      <Route path="/owner/reviews" component={OwnerReviews} />
      <Route path="/owner/settings" component={OwnerSettings} />
      <Route path="/owner/kyc" component={OwnerKyc} />
      <Route path="/owner/choose-mode" component={ChooseListingMode} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/list-property" component={ListPropertyWizard} />
      <Route path="/admin-access" component={AdminAccess} />
      <Route path="/dev-admin" component={DevAdminLogin} />
      <Route path="/kyc" component={KYC} />
      <Route path="/search" component={Search} />
      <Route path="/properties" component={Search} />
      <Route path="/properties/:id" component={PropertyDetails} />
      <Route path="/destinations" component={Destinations} />
      <Route path="/destinations/:id" component={DestinationDetails} />
      <Route component={NotFound} />
    </Switch>
  );
}

// KycGuard - prevents rendering blocked content for rejected KYC users
// Only blocks after auth resolves AND user has rejected KYC on non-whitelisted route
function KycGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { shouldBlockAccess, hasRejectedKyc } = useKycGuard();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Only redirect after auth resolves, user is authenticated, and has rejected KYC on blocked route
    if (!authLoading && isAuthenticated && shouldBlockAccess) {
      setLocation("/owner/dashboard?state=kyc_rejected");
    }
  }, [authLoading, isAuthenticated, shouldBlockAccess, setLocation]);

  // While loading auth, render children normally (allows Landing/Login to render)
  if (authLoading) return <>{children}</>;
  
  // If not authenticated, render children normally (public routes work)
  if (!isAuthenticated) return <>{children}</>;
  
  // If authenticated but not rejected KYC, render children
  if (!hasRejectedKyc) return <>{children}</>;
  
  // If blocked, don't render children - prevent queries from firing
  if (shouldBlockAccess) return null;

  return <>{children}</>;
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  const showHeader = location !== "/" || (isAuthenticated && !isLoading);

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      {showHeader && <Header />}
      <div className="flex-1">
        <KycGuard>
          <Router />
        </KycGuard>
      </div>
      <Footer />
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
