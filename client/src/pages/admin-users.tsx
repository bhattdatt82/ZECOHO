import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Ban, RefreshCw, Users, UserCheck, UserX, Search, User, Home } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

const DEACTIVATION_REASONS = [
  { value: "fraud", label: "Fraudulent Activity" },
  { value: "abuse", label: "Platform Abuse / Harassment" },
  { value: "tos_violation", label: "Terms of Service Violation" },
  { value: "payment_issues", label: "Repeated Payment Issues" },
  { value: "fake_profile", label: "Fake / Duplicate Profile" },
  { value: "user_request", label: "User Requested Deactivation" },
  { value: "inactivity", label: "Extended Inactivity" },
  { value: "security", label: "Security Concern" },
  { value: "legal", label: "Legal / Compliance Issue" },
  { value: "other", label: "Other" },
];

export default function AdminUsers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "deactivated">("all");
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [deactivationReason, setDeactivationReason] = useState("");
  const [reasonCategory, setReasonCategory] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [activeTab, setActiveTab] = useState("users");

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalUsers: number;
    activeUsers: number;
    deactivatedUsers: number;
    guests: number;
    owners: number;
  }>({
    queryKey: ["/api/admin/stats/users"],
    enabled: !!user,
  });

  const { data: allUsers, isLoading: usersLoading } = useQuery<UserType[]>({
    queryKey: ["/api/admin/users", statusFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }
      return res.json();
    },
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
    metadata?: Record<string, any>;
    createdAt: string;
  }>>({
    queryKey: ["/api/admin/audit-logs"],
    enabled: !!user,
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      return apiRequest("POST", `/api/admin/users/${userId}/deactivate`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/audit-logs"] });
      toast({ title: "User deactivated", description: "The user account has been deactivated." });
      setDeactivateDialogOpen(false);
      setSelectedUser(null);
      setDeactivationReason("");
      setReasonCategory("");
      setAdditionalNotes("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const restoreUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/admin/users/${userId}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/audit-logs"] });
      toast({ title: "User restored", description: "The user account has been reactivated." });
      setRestoreDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
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
      deactivate_user: "Deactivated User",
      restore_user: "Restored User",
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
    if (action.includes("deactivate")) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    if (action.includes("restore")) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (action.includes("suspend")) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    if (action.includes("reinstate")) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (action.includes("cancel")) return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "guest":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const handleDeactivate = () => {
    if (!selectedUser) return;
    
    const selectedReason = DEACTIVATION_REASONS.find(r => r.value === reasonCategory);
    const fullReason = additionalNotes
      ? `${selectedReason?.label || reasonCategory}: ${additionalNotes}`
      : selectedReason?.label || reasonCategory;
    
    if (fullReason.length < 10) {
      toast({ title: "Error", description: "Please provide a complete reason (at least 10 characters)", variant: "destructive" });
      return;
    }
    
    deactivateUserMutation.mutate({ userId: selectedUser.id, reason: fullReason });
  };

  const filteredUsers = allUsers?.filter((u) => {
    if (searchQuery === "") return true;
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const userLogs = auditLogs?.filter(log => 
    log.action === "deactivate_user" || log.action === "restore_user"
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground">
          Manage user accounts and monitor deactivations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5 mb-8">
        <Card 
          className="cursor-pointer hover-elevate transition-all"
          onClick={() => setStatusFilter("all")}
          data-testid="card-total-users"
        >
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer hover-elevate transition-all ${statusFilter === "active" ? "ring-2 ring-green-500" : ""}`}
          onClick={() => setStatusFilter("active")}
          data-testid="card-active-users"
        >
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-green-600">{stats?.activeUsers || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer hover-elevate transition-all ${statusFilter === "deactivated" ? "ring-2 ring-red-500" : ""}`}
          onClick={() => setStatusFilter("deactivated")}
          data-testid="card-deactivated-users"
        >
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deactivated</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-red-600">{stats?.deactivatedUsers || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-guests">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guests</CardTitle>
            <User className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-blue-600">{stats?.guests || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-owners">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Owners</CardTitle>
            <Home className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-purple-600">{stats?.owners || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" data-testid="tab-users">All Users</TabsTrigger>
          <TabsTrigger value="logs" data-testid="tab-logs">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div>
                  <CardTitle>User Accounts</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    View and manage all user accounts
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                      data-testid="input-search-users"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | "active" | "deactivated")}>
                    <SelectTrigger className="w-40" data-testid="select-status-filter">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="deactivated">Deactivated Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredUsers && filteredUsers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                        <TableCell>
                          <div className="font-medium">
                            {u.firstName} {u.lastName}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {u.email || "No email"}
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(u.userRole || "guest")}>
                            {u.userRole === "owner" ? "Property Owner" : "Guest"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {u.isDeactivated ? (
                            <Badge variant="destructive">Deactivated</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(u.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          {u.isDeactivated ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(u);
                                setRestoreDialogOpen(true);
                              }}
                              data-testid={`button-restore-${u.id}`}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Restore
                            </Button>
                          ) : (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(u);
                                setDeactivateDialogOpen(true);
                              }}
                              data-testid={`button-deactivate-${u.id}`}
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Deactivate
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No users found matching your criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management Activity</CardTitle>
              <p className="text-sm text-muted-foreground">
                Recent user deactivation and restoration actions
              </p>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : userLogs && userLogs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge className={getActionBadgeColor(log.action)}>
                            {getActionLabel(log.action)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {log.metadata?.userName || "Unknown User"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {log.metadata?.userEmail || log.ownerId}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.reason || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(log.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No user management activity found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deactivate User Account</DialogTitle>
            <DialogDescription>
              This will prevent {selectedUser?.firstName} {selectedUser?.lastName} from logging in.
              Their data will be preserved and can be restored later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason-category">Reason Category</Label>
              <Select value={reasonCategory} onValueChange={setReasonCategory}>
                <SelectTrigger id="reason-category" data-testid="select-reason-category">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {DEACTIVATION_REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="additional-notes">Additional Notes (Optional)</Label>
              <Textarea
                id="additional-notes"
                placeholder="Add any additional context or details..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={3}
                data-testid="textarea-additional-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeactivateDialogOpen(false);
                setSelectedUser(null);
                setReasonCategory("");
                setAdditionalNotes("");
              }}
              data-testid="button-cancel-deactivate"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivate}
              disabled={!reasonCategory || deactivateUserMutation.isPending}
              data-testid="button-confirm-deactivate"
            >
              {deactivateUserMutation.isPending ? "Deactivating..." : "Deactivate Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Restore User Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to restore {selectedUser?.firstName} {selectedUser?.lastName}'s account?
              They will be able to log in and use the platform again.
            </DialogDescription>
          </DialogHeader>
          {selectedUser?.deactivationReason && (
            <div className="py-4">
              <Label className="text-muted-foreground">Original Deactivation Reason:</Label>
              <p className="mt-1 text-sm">{selectedUser.deactivationReason}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRestoreDialogOpen(false);
                setSelectedUser(null);
              }}
              data-testid="button-cancel-restore"
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedUser && restoreUserMutation.mutate(selectedUser.id)}
              disabled={restoreUserMutation.isPending}
              data-testid="button-confirm-restore"
            >
              {restoreUserMutation.isPending ? "Restoring..." : "Restore Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
