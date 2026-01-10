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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle, Package, Wrench, RefreshCw, Building } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type InventoryHealthItem = {
  propertyId: string;
  propertyTitle: string;
  roomTypeId: string;
  roomTypeName: string;
  totalRooms: number;
  bookedRooms: number;
  availableRooms: number;
  hasNegativeInventory: boolean;
};

export default function AdminInventory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fixDialogOpen, setFixDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryHealthItem | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "healthy" | "issues">("all");

  const { data: inventoryHealth, isLoading, refetch } = useQuery<InventoryHealthItem[]>({
    queryKey: ["/api/admin/inventory/health"],
    enabled: !!user,
  });

  const fixInventoryMutation = useMutation({
    mutationFn: async ({ propertyId, roomTypeId, dryRun }: { propertyId: string; roomTypeId?: string; dryRun: boolean }): Promise<{ fixed: number; details: string[] }> => {
      const response = await apiRequest("POST", "/api/admin/inventory/fix", {
        propertyId,
        roomTypeId,
        dryRun,
      });
      return response.json();
    },
    onSuccess: (data: { fixed: number; details: string[] }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inventory/health"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/audit-logs"] });
      
      const message = dryRun 
        ? `Dry run complete. ${data.details.join("; ")}`
        : `Fixed ${data.fixed} issue(s). ${data.details.join("; ")}`;
      
      toast({ 
        title: dryRun ? "Dry Run Results" : "Inventory Fixed",
        description: message 
      });
      setFixDialogOpen(false);
      setSelectedItem(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const issuesCount = inventoryHealth?.filter(item => item.hasNegativeInventory).length || 0;
  const healthyCount = inventoryHealth?.filter(item => !item.hasNegativeInventory).length || 0;
  
  const filteredInventory = inventoryHealth?.filter(item => {
    if (statusFilter === "all") return true;
    if (statusFilter === "healthy") return !item.hasNegativeInventory;
    if (statusFilter === "issues") return item.hasNegativeInventory;
    return true;
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Inventory Health</h1>
        <p className="text-muted-foreground">
          Monitor and fix room availability issues across all properties
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card 
          className={`cursor-pointer hover-elevate transition-all ${statusFilter === "all" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setStatusFilter("all")}
          data-testid="card-total-room-types"
        >
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Room Types</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{inventoryHealth?.length || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer hover-elevate transition-all ${statusFilter === "healthy" ? "ring-2 ring-green-500" : ""}`}
          onClick={() => setStatusFilter("healthy")}
          data-testid="card-healthy"
        >
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-green-600">{healthyCount}</div>
            )}
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer hover-elevate transition-all ${statusFilter === "issues" ? "ring-2 ring-red-500" : ""}`}
          onClick={() => setStatusFilter("issues")}
          data-testid="card-issues"
        >
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-red-600">{issuesCount}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Room Inventory Status</CardTitle>
              <CardDescription>
                Shows room availability for the next 30 days across all properties
              </CardDescription>
            </div>
            <Button
              data-testid="button-refresh-inventory"
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredInventory?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{statusFilter === "all" ? "No room types found" : `No ${statusFilter} room types found`}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Room Type</TableHead>
                    <TableHead className="text-center">Total Rooms</TableHead>
                    <TableHead className="text-center">Booked</TableHead>
                    <TableHead className="text-center">Available</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory?.map((item) => (
                    <TableRow 
                      key={`${item.propertyId}-${item.roomTypeId}`}
                      data-testid={`row-inventory-${item.roomTypeId}`}
                      className={item.hasNegativeInventory ? "bg-red-50 dark:bg-red-950/20" : ""}
                    >
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={item.propertyTitle}>
                          {item.propertyTitle}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.roomTypeName}</TableCell>
                      <TableCell className="text-center">{item.totalRooms}</TableCell>
                      <TableCell className="text-center">{item.bookedRooms}</TableCell>
                      <TableCell className="text-center">
                        <span className={item.availableRooms < 0 ? "text-red-600 font-bold" : ""}>
                          {item.availableRooms}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.hasNegativeInventory ? (
                          <Badge variant="destructive">Overbooking</Badge>
                        ) : item.availableRooms === 0 ? (
                          <Badge variant="secondary">Full</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Available
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.hasNegativeInventory && (
                          <Button
                            data-testid={`button-fix-${item.roomTypeId}`}
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setFixDialogOpen(true);
                            }}
                          >
                            <Wrench className="h-4 w-4 mr-1" />
                            Fix
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={fixDialogOpen} onOpenChange={setFixDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fix Inventory Issue</DialogTitle>
            <DialogDescription>
              Analyze and fix the overbooking issue for this room type.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="font-medium">{selectedItem.propertyTitle}</p>
                <p className="text-sm text-muted-foreground">Room Type: {selectedItem.roomTypeName}</p>
                <div className="flex gap-4 text-sm">
                  <span>Total: {selectedItem.totalRooms}</span>
                  <span>Booked: {selectedItem.bookedRooms}</span>
                  <span className="text-red-600">Available: {selectedItem.availableRooms}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dry-run"
                  data-testid="checkbox-dry-run"
                  checked={dryRun}
                  onCheckedChange={(checked) => setDryRun(checked === true)}
                />
                <Label htmlFor="dry-run" className="text-sm">
                  Dry run (preview changes without applying them)
                </Label>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {dryRun 
                  ? "This will analyze the issue and show what would be fixed without making any changes."
                  : "This will automatically resolve the overbooking by adjusting conflicting bookings."}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFixDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              data-testid="button-confirm-fix"
              variant={dryRun ? "default" : "destructive"}
              onClick={() => {
                if (selectedItem) {
                  fixInventoryMutation.mutate({
                    propertyId: selectedItem.propertyId,
                    roomTypeId: selectedItem.roomTypeId,
                    dryRun,
                  });
                }
              }}
              disabled={fixInventoryMutation.isPending}
            >
              {fixInventoryMutation.isPending ? "Processing..." : dryRun ? "Run Analysis" : "Fix Issue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
