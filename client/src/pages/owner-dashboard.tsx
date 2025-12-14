import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { OwnerLayout } from "@/components/OwnerLayout";
import { PreApprovalDashboard } from "@/components/PreApprovalDashboard";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  CalendarCheck,
  IndianRupee,
  Building2,
  Star,
  TrendingUp,
  Eye,
  Edit,
  MessageSquare,
  CheckCircle2,
  FileEdit,
  ArrowRight,
  Pause,
  Power,
  Play,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

interface OwnerStats {
  bookingsToday: number;
  bookingsThisMonth: number;
  revenueToday: number;
  revenueThisMonth: number;
  propertyStatus: string;
  avgRating: number;
  reviewCount: number;
  properties: { id: string; title: string; status: string; pricePerNight: string }[];
  hasDraftProperty?: boolean;
  draftPropertyId?: string;
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: stats, isLoading } = useQuery<OwnerStats>({
    queryKey: ["/api/owner/stats"],
  });

  const pauseMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      return apiRequest("PATCH", `/api/properties/${propertyId}/pause`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/stats"] });
      toast({ title: "Property paused", description: "Your property is now hidden from search results." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to pause property", variant: "destructive" });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      return apiRequest("PATCH", `/api/properties/${propertyId}/resume`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/stats"] });
      toast({ title: "Property resumed", description: "Your property is now visible in search results." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to resume property", variant: "destructive" });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      return apiRequest("PATCH", `/api/properties/${propertyId}/deactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/stats"] });
      toast({ title: "Property deactivated", description: "Your property has been deactivated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to deactivate property", variant: "destructive" });
    },
  });

  const isPreApproval = user && user.kycStatus !== "verified";

  if (isPreApproval) {
    return (
      <OwnerLayout>
        <PreApprovalDashboard user={user} />
      </OwnerLayout>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      published: { variant: "default", label: "Published" },
      draft: { variant: "secondary", label: "Draft" },
      pending: { variant: "outline", label: "Pending Review" },
      rejected: { variant: "destructive", label: "Rejected" },
      paused: { variant: "outline", label: "Paused" },
      deactivated: { variant: "destructive", label: "Deactivated" },
      none: { variant: "secondary", label: "No Property" },
    };
    const config = statusConfig[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const hasPublishedProperty = stats?.properties?.some(p => p.status === "published");
  const hasDraftProperty = stats?.properties?.some(p => p.status === "draft");
  const hasPausedProperty = stats?.properties?.some(p => p.status === "paused");
  const draftProperty = stats?.properties?.find(p => p.status === "draft");

  return (
    <OwnerLayout>
      <div className="space-y-6" data-testid="owner-dashboard">
        {hasPublishedProperty && (
          <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" data-testid="banner-property-live">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-800 dark:text-green-200">Your property is live!</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">
              Guests can now discover and book your property. Make sure your calendar and pricing are up to date.
            </AlertDescription>
          </Alert>
        )}

        {hasPausedProperty && (
          <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" data-testid="banner-property-paused">
            <Pause className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">Property paused</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              Your property is currently hidden from search results. Resume listing to start receiving bookings again.
            </AlertDescription>
          </Alert>
        )}

        {hasDraftProperty && draftProperty && (
          <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" data-testid="banner-resume-draft">
            <FileEdit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-200">Complete your property listing</AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-300 flex flex-col sm:flex-row sm:items-center gap-2">
              <span>You have an incomplete property draft: "{draftProperty.title}"</span>
              <Link href="/list-property">
                <Button size="sm" variant="outline" className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover-elevate" data-testid="btn-resume-draft">
                  Resume <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card data-testid="card-bookings">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bookings</CardTitle>
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="bookings-today">
                    {stats?.bookingsToday || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {stats?.bookingsThisMonth || 0} this month
                    </span>
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-revenue">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="revenue-today">
                    {formatCurrency(stats?.revenueToday || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {formatCurrency(stats?.revenueThisMonth || 0)} this month
                    </span>
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-property-status">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Property Status</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="property-count">
                    {stats?.properties?.length || 0}
                  </div>
                  <div className="mt-1">
                    {getStatusBadge(stats?.propertyStatus || "none")}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-rating">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold flex items-center gap-1" data-testid="avg-rating">
                    {stats?.avgRating?.toFixed(1) || "0.0"}
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.reviewCount || 0} review{stats?.reviewCount !== 1 ? "s" : ""}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card data-testid="quick-actions">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/owner/bookings">
                <Button className="w-full justify-start" variant="outline" data-testid="action-view-bookings">
                  <CalendarCheck className="mr-2 h-4 w-4" />
                  View Bookings
                </Button>
              </Link>
              <Link href="/owner/messages">
                <Button className="w-full justify-start" variant="outline" data-testid="action-messages">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Check Messages
                </Button>
              </Link>
              <Link href="/owner/property">
                <Button className="w-full justify-start" variant="outline" data-testid="action-edit-property">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Property
                </Button>
              </Link>
              <Link href="/owner/reviews">
                <Button className="w-full justify-start" variant="outline" data-testid="action-view-reviews">
                  <Star className="mr-2 h-4 w-4" />
                  View Reviews
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card data-testid="properties-list">
            <CardHeader>
              <CardTitle>Your Properties</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : stats?.properties && stats.properties.length > 0 ? (
                <div className="space-y-3">
                  {stats.properties.map((property) => (
                    <div
                      key={property.id}
                      className="flex items-center justify-between p-3 rounded-md border"
                      data-testid={`property-item-${property.id}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{property.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(parseFloat(property.pricePerNight))} / night
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {getStatusBadge(property.status)}
                        <Link href={`/properties/${property.id}`}>
                          <Button size="icon" variant="ghost" data-testid={`view-property-${property.id}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" data-testid={`property-menu-${property.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <Link href={`/owner/property`}>
                              <DropdownMenuItem data-testid={`edit-property-${property.id}`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Property
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator />
                            {property.status === "published" && (
                              <DropdownMenuItem
                                onClick={() => pauseMutation.mutate(property.id)}
                                disabled={pauseMutation.isPending}
                                data-testid={`pause-property-${property.id}`}
                              >
                                <Pause className="h-4 w-4 mr-2" />
                                Pause Listing
                              </DropdownMenuItem>
                            )}
                            {property.status === "paused" && (
                              <DropdownMenuItem
                                onClick={() => resumeMutation.mutate(property.id)}
                                disabled={resumeMutation.isPending}
                                data-testid={`resume-property-${property.id}`}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Resume Listing
                              </DropdownMenuItem>
                            )}
                            {property.status !== "deactivated" && (
                              <DropdownMenuItem
                                onClick={() => deactivateMutation.mutate(property.id)}
                                disabled={deactivateMutation.isPending}
                                className="text-destructive focus:text-destructive"
                                data-testid={`deactivate-property-${property.id}`}
                              >
                                <Power className="h-4 w-4 mr-2" />
                                Deactivate Listing
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No properties yet</p>
                  <Link href="/list-property">
                    <Button className="mt-4" data-testid="add-property">
                      List Your Property
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </OwnerLayout>
  );
}
