import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminGuard } from "@/components/AdminGuard";
import { ALL_PERMISSIONS, type PermissionKey } from "@/hooks/useAdminAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ShieldPlus, Pencil, Trash2, UserCheck, ShieldCheck, Info } from "lucide-react";

interface SubAdmin {
  id: string;
  userId: string;
  email: string;
  permissions: string[];
  createdAt: string;
  firstName?: string;
  lastName?: string;
}

const PERMISSION_SECTION_MAP: Record<PermissionKey, string> = {
  accounts:      "Users & Owners",
  subscriptions: "Subscription Plans",
  reports:       "Reports & Exports",
  properties:    "Properties",
  bookings:      "Bookings",
  kyc:           "KYC Verification",
  content:       "Content (Policies, Agreements, About, Contact)",
  support:       "Support Inbox",
  coming_soon:   "Coming Soon Mode",
};

function PermissionBadge({ perm }: { perm: string }) {
  const meta = ALL_PERMISSIONS.find((p) => p.key === perm);
  return (
    <Badge variant="secondary" className="text-xs">
      {meta?.label ?? perm}
    </Badge>
  );
}

function PermissionCheckboxes({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (key: string) => {
    onChange(
      selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key],
    );
  };

  return (
    <div className="grid grid-cols-1 gap-3">
      {ALL_PERMISSIONS.map(({ key, label, description }) => (
        <div key={key} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/40">
          <Checkbox
            id={`perm-${key}`}
            checked={selected.includes(key)}
            onCheckedChange={() => toggle(key)}
            className="mt-0.5"
          />
          <div className="flex-1">
            <label htmlFor={`perm-${key}`} className="font-medium text-sm cursor-pointer">
              {label}
            </label>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminSubAdmins() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SubAdmin | null>(null);
  const [email, setEmail] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  const { data: subAdmins = [], isLoading } = useQuery<SubAdmin[]>({
    queryKey: ["/api/admin/sub-admins"],
    queryFn: () =>
      fetch("/api/admin/sub-admins", { credentials: "include" }).then((r) => r.json()),
    staleTime: 0,
  });

  const grantMutation = useMutation({
    mutationFn: async (body: { email: string; permissions: string[] }) => {
      const res = await apiRequest("POST", "/api/admin/sub-admins", body);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sub-admins"] });
      toast({ title: "Access granted successfully" });
      closeDialog();
    },
    onError: (e: Error) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, permissions }: { id: string; permissions: string[] }) => {
      const res = await apiRequest("PATCH", `/api/admin/sub-admins/${id}`, { permissions });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sub-admins"] });
      toast({ title: "Permissions updated" });
      closeDialog();
    },
    onError: () =>
      toast({ title: "Error updating permissions", variant: "destructive" }),
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/sub-admins/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sub-admins"] });
      toast({ title: "Access revoked" });
    },
    onError: () =>
      toast({ title: "Error revoking access", variant: "destructive" }),
  });

  function openNew() {
    setEditing(null);
    setEmail("");
    setSelectedPerms([]);
    setDialogOpen(true);
  }

  function openEdit(sub: SubAdmin) {
    setEditing(sub);
    setEmail(sub.email);
    setSelectedPerms(sub.permissions);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
    setEmail("");
    setSelectedPerms([]);
  }

  function handleSave() {
    if (selectedPerms.length === 0) {
      toast({ title: "Select at least one permission", variant: "destructive" });
      return;
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, permissions: selectedPerms });
    } else {
      if (!email.endsWith("@zecoho.com")) {
        toast({ title: "Only @zecoho.com emails allowed", variant: "destructive" });
        return;
      }
      grantMutation.mutate({ email, permissions: selectedPerms });
    }
  }

  const isSaving = grantMutation.isPending || updateMutation.isPending;

  return (
    <AdminGuard>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Team Access</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Grant specific admin section access to Zecoho team members
              (&#64;zecoho.com emails only).
            </p>
          </div>
          <Button onClick={openNew} className="gap-2">
            <ShieldPlus className="h-4 w-4" />
            Add Team Member
          </Button>
        </div>

        {/* Info card */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex gap-3">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <p className="font-medium">How sub-admin access works</p>
                <p>
                  Sub-admins use their existing Zecoho account with a{" "}
                  <strong>@zecoho.com</strong> email. They can only see and use the
                  sections you grant them. Full admin rights (all sections) are
                  separate and can only be assigned via the Admin Access page.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sub-admins table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Current Team Members ({subAdmins.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 text-sm text-muted-foreground">Loading...</div>
            ) : subAdmins.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>No team members with sub-admin access yet.</p>
                <p className="text-xs mt-1">Click "Add Team Member" to grant access.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subAdmins.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {sub.firstName || sub.lastName
                              ? `${sub.firstName ?? ""} ${sub.lastName ?? ""}`.trim()
                              : "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">{sub.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {sub.permissions.length === 0 ? (
                            <span className="text-xs text-muted-foreground">None</span>
                          ) : (
                            sub.permissions.map((p) => (
                              <PermissionBadge key={p} perm={p} />
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {sub.createdAt
                          ? new Date(sub.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => openEdit(sub)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit permissions</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => revokeMutation.mutate(sub.id)}
                                disabled={revokeMutation.isPending}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Revoke access</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit dialog */}
        <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Permissions" : "Add Team Member"}
              </DialogTitle>
              <DialogDescription>
                {editing
                  ? `Update section access for ${editing.email}`
                  : "Grant admin section access to a @zecoho.com team member."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {!editing && (
                <div className="space-y-1.5">
                  <Label>Email address *</Label>
                  <Input
                    type="email"
                    placeholder="name@zecoho.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {email && !email.endsWith("@zecoho.com") && (
                    <p className="text-xs text-destructive">
                      Only @zecoho.com email addresses are allowed.
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    The user must already have a Zecoho account with this email.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Section permissions</Label>
                <PermissionCheckboxes
                  selected={selectedPerms}
                  onChange={setSelectedPerms}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={closeDialog} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || selectedPerms.length === 0}>
                {isSaving ? "Saving..." : editing ? "Update Permissions" : "Grant Access"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminGuard>
  );
}
