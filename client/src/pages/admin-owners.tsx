import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Ban, RefreshCw, Users, UserCheck, UserX, Clock, Search, Shield, Building, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

export default function AdminOwners() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [reinstateDialogOpen, setReinstateDialogOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<UserType | null>(null);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [activeTab, setActiveTab] = useState("suspended");
  const [actionFilter, setActionFilter] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalOwners: number;
    activeOwners: number;
    suspendedOwners: number;
    pendingKyc: number;
  }>({
    queryKey: ["/api/admin/stats/owners"],
    enabled: !!user,
  });

  const { data: suspendedOwners, isLoading: suspendedLoading } = useQuery<UserType[]>({
    queryKey: ["/api/admin/owners/suspended"],
    enabled: !!user,
  });

  const { data: auditLogs, isLoading: logsLoading } = useQuery<Array<{
    id: string;
    adminId: string;
    action: string;
    ownerId?: string;
    bookingId?: string;
    propertyId?: string;
    reason?: string;
    createdAt: string;
  }>>({
    queryKey: ["/api/admin/audit-logs"],
    enabled: !!user,
  });

  const suspendOwnerMutation = useMutation({
    mutationFn: async ({ ownerId, reason }: { ownerId: string; reason: string }) => {
      return apiRequest("POST", `/api/admin/owners/${ownerId}/suspend`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats/owners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/owners/suspended"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/audit-logs"] });
      toast({ title: "Owner suspended", description: "The owner and their properties have been suspended." });
      setSuspendDialogOpen(false);
      setSelectedOwner(null);
      setSuspensionReason("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const reinstateOwnerMutation = useMutation({
    mutationFn: async (ownerId: string) => {
      return apiRequest("POST", `/api/admin/owners/${ownerId}/reinstate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats/owners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/owners/suspended"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/audit-logs"] });
      toast({ title: "Owner reinstated", description: "The owner and their properties have been reinstated." });
      setReinstateDialogOpen(false);
      setSelectedOwner(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      suspend_owner: "Suspended Owner",
      reinstate_owner: "Reinstated Owner",
      cancel_booking: "Cancelled Booking",
      mark_no_show: "Marked No-Show",
      force_check_in: "Force Check-In",
      force_check_out: "Force Check-Out",
      fix_inventory: "Fixed Inventory",
    };
    return labels[action] || action;
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes("suspend")) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    if (action.includes("reinstate")) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (action.includes("cancel")) return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
  };

  const filteredSuspendedOwners = suspendedOwners?.filter((owner) => {
    if (searchQuery === "") return true;
    const fullName = `${owner.firstName} ${owner.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || owner.email?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Owner Compliance</h1>
        <p className="text-muted-foreground">
          Manage property owners and monitor compliance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card 
          className={`cursor-pointer hover-elevate transition-all ${actionFilter === "total" ? "ring-2 ring-primary" : ""}`}
          onClick={() => {
            setActionFilter("total");
            setActiveTab("suspended");
          }}
          data-testid="card-total-owners"
        >
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Owners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalOwners || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer hover-elevate transition-all ${actionFilter === "active" ? "ring-2 ring-green-500" : ""}`}
          onClick={() => {
            setActionFilter("active");
            setActiveTab("suspended");
          }}
          data-testid="card-active-owners"
        >
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Owners</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-green-600">{stats?.activeOwners || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer hover-elevate transition-all ${actionFilter === "suspended" ? "ring-2 ring-red-500" : ""}`}
          onClick={() => {
            setActiveTab("suspended");
            setActionFilter("suspended");
          }}
          data-testid="card-suspended-owners"
        >
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-red-600">{stats?.suspendedOwners || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer hover-elevate transition-all ${actionFilter === "pending" ? "ring-2 ring-yellow-500" : ""}`}
          onClick={() => {
            setActionFilter("pending");
            setActiveTab("suspended");
          }}
          data-testid="card-pending-kyc"
        >
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-yellow-600">{stats?.pendingKyc || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="suspended" data-testid="tab-suspended">
            <Ban className="h-4 w-4 mr-2" />
            Suspended Owners
          </TabsTrigger>
          <TabsTrigger value="audit" data-testid="tab-audit">
            <Shield className="h-4 w-4 mr-2" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suspended">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Suspended Owners</CardTitle>
                  <CardDescription>Owners who have been suspended from the platform</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    data-testid="input-owner-search"
                    placeholder="Search owners..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full sm:w-[200px]"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {suspendedLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredSuspendedOwners?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No suspended owners</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Owner</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Suspended On</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuspendedOwners?.map((owner) => (
                      <TableRow key={owner.id} data-testid={`row-owner-${owner.id}`}>
                        <TableCell className="font-medium">
                          {owner.firstName} {owner.lastName}
                        </TableCell>
                        <TableCell>{owner.email}</TableCell>
                        <TableCell>
                          {owner.suspendedAt ? formatDate(owner.suspendedAt) : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate" title={owner.suspensionReason || undefined}>
                            {owner.suspensionReason || "No reason provided"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            data-testid={`button-reinstate-${owner.id}`}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOwner(owner);
                              setReinstateDialogOpen(true);
                            }}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Reinstate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Admin Audit Log</CardTitle>
              <CardDescription>History of administrative actions</CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : auditLogs?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No audit logs yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs?.map((log) => (
                      <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                        <TableCell>{formatDate(log.createdAt)}</TableCell>
                        <TableCell>
                          <Badge className={getActionBadgeColor(log.action)}>
                            {getActionLabel(log.action)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.ownerId && <span className="text-sm">Owner ID: {log.ownerId.slice(0, 8)}...</span>}
                          {log.bookingId && <span className="text-sm">Booking: {log.bookingId.slice(0, 8)}...</span>}
                          {log.propertyId && <span className="text-sm">Property: {log.propertyId.slice(0, 8)}...</span>}
                        </TableCell>
                        <TableCell>
                          {log.reason ? (
                            <div className="flex items-center gap-1">
                              <span className="max-w-[200px] truncate">{log.reason}</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-5 w-5">
                                    <Info className="h-3 w-3 text-muted-foreground" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[400px]">
                                  <p className="text-sm">{log.reason}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Owner</DialogTitle>
            <DialogDescription>
              This will suspend the owner and all their properties. They will not be able to accept bookings until reinstated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="suspend-reason">Reason for Suspension (min 10 characters)</Label>
              <Textarea
                id="suspend-reason"
                data-testid="textarea-suspend-reason"
                placeholder="Enter the reason for suspending this owner..."
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              data-testid="button-confirm-suspend"
              variant="destructive"
              onClick={() => {
                if (selectedOwner) {
                  suspendOwnerMutation.mutate({
                    ownerId: selectedOwner.id,
                    reason: suspensionReason,
                  });
                }
              }}
              disabled={suspendOwnerMutation.isPending || suspensionReason.length < 10}
            >
              {suspendOwnerMutation.isPending ? "Suspending..." : "Confirm Suspension"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reinstateDialogOpen} onOpenChange={setReinstateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reinstate Owner</DialogTitle>
            <DialogDescription>
              This will reinstate the owner and all their properties. They will be able to accept bookings again.
            </DialogDescription>
          </DialogHeader>
          {selectedOwner && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium">{selectedOwner.firstName} {selectedOwner.lastName}</p>
                <p className="text-sm text-muted-foreground">{selectedOwner.email}</p>
                {selectedOwner.suspensionReason && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Suspension Reason:</p>
                    <p className="text-sm text-muted-foreground">{selectedOwner.suspensionReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReinstateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              data-testid="button-confirm-reinstate"
              onClick={() => {
                if (selectedOwner) {
                  reinstateOwnerMutation.mutate(selectedOwner.id);
                }
              }}
              disabled={reinstateOwnerMutation.isPending}
            >
              {reinstateOwnerMutation.isPending ? "Reinstating..." : "Confirm Reinstatement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
