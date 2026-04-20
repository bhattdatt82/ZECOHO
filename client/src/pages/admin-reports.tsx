import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye,
  TrendingUp,
  XCircle,
  Search,
  Bell,
  MessageSquare,
  Phone,
  Shield,
  Download,
  Calendar,
} from "lucide-react";

// ─── helpers ─────────────────────────────────────────────────────────────────

function defaultFrom(days = 30) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
function defaultTo() {
  return new Date().toISOString().slice(0, 10);
}

interface DateRangeProps {
  range: string;
  setRange: (r: string) => void;
  from: string;
  setFrom: (v: string) => void;
  to: string;
  setTo: (v: string) => void;
}

function DateRangeControls({ range, setRange, from, setFrom, to, setTo }: DateRangeProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-lg border overflow-hidden text-xs">
        {(["daily", "weekly", "monthly"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1.5 capitalize transition-colors ${
              range === r
                ? "bg-primary text-primary-foreground font-medium"
                : "bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-xs">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="border rounded px-2 py-1 bg-background"
        />
        <span className="text-muted-foreground">–</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="border rounded px-2 py-1 bg-background"
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="p-4 rounded-lg border bg-muted/30">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function DownloadBtn({ href, filename }: { href: string; filename: string }) {
  return (
    <Button
      size="sm"
      variant="outline"
      className="flex items-center gap-1.5"
      onClick={() => {
        const a = document.createElement("a");
        a.href = href;
        a.download = filename;
        a.click();
      }}
    >
      <Download className="h-3.5 w-3.5" />
      Download CSV
    </Button>
  );
}

function ReportTable({ headers, rows }: { headers: string[]; rows: (string | number | null)[][] }) {
  if (!rows.length) return (
    <p className="text-sm text-muted-foreground text-center py-8">No data in this period.</p>
  );
  return (
    <div className="overflow-x-auto mt-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {headers.map((h) => (
              <th key={h} className="text-left py-2 pr-4 text-xs font-medium text-muted-foreground whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
              {row.map((cell, j) => (
                <td key={j} className="py-2 pr-4 text-xs align-top">
                  {cell ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Tab: Property Views ──────────────────────────────────────────────────────
function PropertyViewsTab() {
  const [range, setRange] = useState("monthly");
  const [from, setFrom] = useState(defaultFrom(30));
  const [to, setTo] = useState(defaultTo());

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/reports/property-views", range, from, to],
    queryFn: () =>
      fetch(`/api/admin/reports/property-views?range=${range}&from=${from}&to=${to}`, {
        credentials: "include",
      }).then((r) => r.json()),
  });

  const csvUrl = `/api/admin/reports/property-views?range=${range}&from=${from}&to=${to}&format=csv`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangeControls {...{ range, setRange, from, setFrom, to, setTo }} />
        <DownloadBtn href={csvUrl} filename={`property-views-${from}.csv`} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard label="Total Views" value={data?.total ?? 0} />
            <StatCard label="Properties Viewed" value={data?.summary?.length ?? 0} />
            <StatCard label="Most Viewed" value={data?.summary?.[0]?.title ?? "—"} sub={data?.summary?.[0]?.totalViews ? `${data.summary[0].totalViews} views` : undefined} />
          </div>

          {/* Top properties table */}
          {data?.summary?.length > 0 && (
            <>
              <h4 className="text-sm font-medium mt-2">By Property</h4>
              <ReportTable
                headers={["Property", "Total Views", "Unique Viewers"]}
                rows={data.summary.map((r: any) => [r.title, r.totalViews, r.uniqueViewers])}
              />
            </>
          )}

          {/* Raw rows */}
          {data?.rows?.length > 0 && (
            <>
              <h4 className="text-sm font-medium mt-4">Recent Views</h4>
              <ReportTable
                headers={["Date & Time", "Property", "Source", "Logged In"]}
                rows={data.rows.map((r: any) => [
                  new Date(r.createdAt).toLocaleString("en-IN"),
                  r.propertyTitle || r.propertyId,
                  r.source || "—",
                  r.userId ? "Yes" : "No",
                ])}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── Tab: Booking Funnel ──────────────────────────────────────────────────────
function BookingFunnelTab() {
  const [range, setRange] = useState("monthly");
  const [from, setFrom] = useState(defaultFrom(30));
  const [to, setTo] = useState(defaultTo());

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/reports/booking-funnel", range, from, to],
    queryFn: () =>
      fetch(`/api/admin/reports/booking-funnel?range=${range}&from=${from}&to=${to}`, {
        credentials: "include",
      }).then((r) => r.json()),
  });

  const csvUrl = `/api/admin/reports/booking-funnel?range=${range}&from=${from}&to=${to}&format=csv`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangeControls {...{ range, setRange, from, setFrom, to, setTo }} />
        <DownloadBtn href={csvUrl} filename={`booking-funnel-${from}.csv`} />
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="space-y-2">
          {data?.funnel?.map((step: any, i: number) => {
            const maxCount = data.funnel[0]?.count || 1;
            const pct = Math.round((step.count / maxCount) * 100);
            return (
              <div key={step.step} className="flex items-center gap-3">
                <div className="w-36 text-xs text-right text-muted-foreground shrink-0">{step.step}</div>
                <div className="flex-1 bg-muted rounded-full h-7 relative overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/80 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                    {step.count.toLocaleString("en-IN")}
                  </span>
                </div>
                {step.convRate !== null ? (
                  <div className="w-16 text-xs text-right text-muted-foreground shrink-0">
                    {step.convRate}%
                  </div>
                ) : (
                  <div className="w-16 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Cancellations ───────────────────────────────────────────────────────
function CancellationsTab() {
  const [range, setRange] = useState("monthly");
  const [from, setFrom] = useState(defaultFrom(30));
  const [to, setTo] = useState(defaultTo());

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/reports/cancellations", range, from, to],
    queryFn: () =>
      fetch(`/api/admin/reports/cancellations?range=${range}&from=${from}&to=${to}`, {
        credentials: "include",
      }).then((r) => r.json()),
  });

  const csvUrl = `/api/admin/reports/cancellations?range=${range}&from=${from}&to=${to}&format=csv`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangeControls {...{ range, setRange, from, setFrom, to, setTo }} />
        <DownloadBtn href={csvUrl} filename={`cancellations-${from}.csv`} />
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Cancellations" value={data?.total ?? 0} />
            <StatCard label="Unique Reasons" value={data?.byReason?.length ?? 0} />
          </div>

          {data?.byReason?.length > 0 && (
            <>
              <h4 className="text-sm font-medium mt-2">By Reason</h4>
              <ReportTable
                headers={["Reason", "Count"]}
                rows={data.byReason.map((r: any) => [r.reason, r.count])}
              />
            </>
          )}

          {data?.rows?.length > 0 && (
            <>
              <h4 className="text-sm font-medium mt-4">All Cancellations</h4>
              <ReportTable
                headers={["Date", "Property", "Check-In", "Amount (₹)", "Reason"]}
                rows={data.rows.map((r: any) => [
                  new Date(r.createdAt).toLocaleDateString("en-IN"),
                  r.propertyTitle || r.propertyId,
                  r.checkIn ? new Date(r.checkIn).toLocaleDateString("en-IN") : "—",
                  r.totalPrice || "—",
                  r.cancellationReason || "No reason provided",
                ])}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── Tab: Search History ──────────────────────────────────────────────────────
function SearchHistoryTab() {
  const [range, setRange] = useState("monthly");
  const [from, setFrom] = useState(defaultFrom(30));
  const [to, setTo] = useState(defaultTo());

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/reports/search-history", range, from, to],
    queryFn: () =>
      fetch(`/api/admin/reports/search-history?range=${range}&from=${from}&to=${to}`, {
        credentials: "include",
      }).then((r) => r.json()),
  });

  const csvUrl = `/api/admin/reports/search-history?range=${range}&from=${from}&to=${to}&format=csv`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangeControls {...{ range, setRange, from, setFrom, to, setTo }} />
        <DownloadBtn href={csvUrl} filename={`search-history-${from}.csv`} />
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Searches" value={data?.total ?? 0} />
            <StatCard label="Top Destination" value={data?.topDestinations?.[0]?.destination ?? "—"} sub={data?.topDestinations?.[0]?.count ? `${data.topDestinations[0].count} searches` : undefined} />
          </div>

          {data?.topDestinations?.length > 0 && (
            <>
              <h4 className="text-sm font-medium mt-2">Top Destinations</h4>
              <ReportTable
                headers={["Destination", "Searches"]}
                rows={data.topDestinations.map((r: any) => [r.destination, r.count])}
              />
            </>
          )}

          {data?.rows?.length > 0 && (
            <>
              <h4 className="text-sm font-medium mt-4">Recent Searches</h4>
              <ReportTable
                headers={["Date & Time", "User", "Destination", "Check-In", "Check-Out", "Guests"]}
                rows={data.rows.map((r: any) => [
                  new Date(r.createdAt).toLocaleString("en-IN"),
                  `${r.firstName || ""} ${r.lastName || ""}`.trim() || "Guest",
                  r.destination,
                  r.checkIn ? new Date(r.checkIn).toLocaleDateString("en-IN") : "—",
                  r.checkOut ? new Date(r.checkOut).toLocaleDateString("en-IN") : "—",
                  r.guests ?? "—",
                ])}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── Tab: Notification Logs ───────────────────────────────────────────────────
function NotificationLogsTab() {
  const [range, setRange] = useState("monthly");
  const [from, setFrom] = useState(defaultFrom(30));
  const [to, setTo] = useState(defaultTo());

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/reports/notification-logs", range, from, to],
    queryFn: () =>
      fetch(`/api/admin/reports/notification-logs?range=${range}&from=${from}&to=${to}`, {
        credentials: "include",
      }).then((r) => r.json()),
  });

  const csvUrl = `/api/admin/reports/notification-logs?range=${range}&from=${from}&to=${to}&format=csv`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangeControls {...{ range, setRange, from, setFrom, to, setTo }} />
        <DownloadBtn href={csvUrl} filename={`notification-logs-${from}.csv`} />
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Sent" value={data?.total ?? 0} />
            <StatCard label="Delivery Rate" value={`${data?.deliveryRate ?? 0}%`} />
            <StatCard label="Action Rate" value={`${data?.actionRate ?? 0}%`} />
            <StatCard
              label="Top Channel"
              value={
                data?.byChannel
                  ? Object.entries(data.byChannel as Record<string, number>).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"
                  : "—"
              }
            />
          </div>

          {data?.byStatus && (
            <div className="flex flex-wrap gap-2 mt-1">
              {Object.entries(data.byStatus as Record<string, number>).map(([status, count]) => (
                <Badge key={status} variant="outline" className="text-xs">
                  {status}: {count}
                </Badge>
              ))}
            </div>
          )}

          {data?.rows?.length > 0 && (
            <>
              <h4 className="text-sm font-medium mt-2">Recent Notifications</h4>
              <ReportTable
                headers={["Date", "User", "Channel", "Status", "Title", "Device", "Action"]}
                rows={data.rows.map((r: any) => [
                  new Date(r.sentAt).toLocaleString("en-IN"),
                  `${r.firstName || ""} ${r.lastName || ""}`.trim() || "—",
                  r.channel,
                  r.status,
                  r.title || "—",
                  r.devicePlatform || "—",
                  r.actionTaken || "—",
                ])}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── Tab: Chat Logs ───────────────────────────────────────────────────────────
function ChatLogsTab() {
  const [range, setRange] = useState("monthly");
  const [from, setFrom] = useState(defaultFrom(30));
  const [to, setTo] = useState(defaultTo());

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/reports/chat-logs", range, from, to],
    queryFn: () =>
      fetch(`/api/admin/reports/chat-logs?range=${range}&from=${from}&to=${to}`, {
        credentials: "include",
      }).then((r) => r.json()),
  });

  const csvUrl = `/api/admin/reports/chat-logs?range=${range}&from=${from}&to=${to}&format=csv`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangeControls {...{ range, setRange, from, setFrom, to, setTo }} />
        <DownloadBtn href={csvUrl} filename={`chat-logs-${from}.csv`} />
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Chat Sessions" value={data?.total ?? 0} />
            <StatCard label="Total Messages" value={data?.totalMessages ?? 0} />
            <StatCard label="Avg Messages/Session" value={data?.avgMessages ?? 0} />
          </div>

          {data?.rows?.length > 0 && (
            <>
              <h4 className="text-sm font-medium mt-2">Chat Sessions</h4>
              <ReportTable
                headers={["Date", "Property", "Sender Role", "Messages", "Duration (min)"]}
                rows={data.rows.map((r: any) => {
                  const dur =
                    r.startedAt && r.endedAt
                      ? Math.round((new Date(r.endedAt).getTime() - new Date(r.startedAt).getTime()) / 60000)
                      : "—";
                  return [
                    new Date(r.createdAt).toLocaleDateString("en-IN"),
                    r.propertyTitle || "—",
                    r.senderRole || "—",
                    r.messageCount ?? 0,
                    dur,
                  ];
                })}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── Tab: Call Logs ───────────────────────────────────────────────────────────
function CallLogsTab() {
  const [range, setRange] = useState("monthly");
  const [from, setFrom] = useState(defaultFrom(30));
  const [to, setTo] = useState(defaultTo());

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/reports/call-logs", range, from, to],
    queryFn: () =>
      fetch(`/api/admin/reports/call-logs?range=${range}&from=${from}&to=${to}`, {
        credentials: "include",
      }).then((r) => r.json()),
  });

  const csvUrl = `/api/admin/reports/call-logs?range=${range}&from=${from}&to=${to}&format=csv`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangeControls {...{ range, setRange, from, setFrom, to, setTo }} />
        <DownloadBtn href={csvUrl} filename={`call-logs-${from}.csv`} />
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Calls" value={data?.total ?? 0} />
            <StatCard
              label="Total Duration"
              value={`${Math.round((data?.totalDurationSeconds ?? 0) / 60)} min`}
            />
          </div>

          {data?.rows?.length > 0 && (
            <>
              <h4 className="text-sm font-medium mt-2">Call Records</h4>
              <ReportTable
                headers={["Date", "Property", "Initiated By", "Type", "Duration (sec)", "Guest", "Phone"]}
                rows={data.rows.map((r: any) => [
                  new Date(r.createdAt).toLocaleDateString("en-IN"),
                  r.propertyTitle || "—",
                  r.initiatedBy || "—",
                  r.callType || "—",
                  r.durationSeconds ?? 0,
                  `${r.guestFirst || ""} ${r.guestLast || ""}`.trim() || "—",
                  r.guestPhone || "—",
                ])}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── Tab: Admin Audit Logs ────────────────────────────────────────────────────
function AuditLogsTab() {
  const [range, setRange] = useState("monthly");
  const [from, setFrom] = useState(defaultFrom(30));
  const [to, setTo] = useState(defaultTo());

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/reports/audit-logs", range, from, to],
    queryFn: () =>
      fetch(`/api/admin/reports/audit-logs?range=${range}&from=${from}&to=${to}`, {
        credentials: "include",
      }).then((r) => r.json()),
  });

  const csvUrl = `/api/admin/reports/audit-logs?range=${range}&from=${from}&to=${to}&format=csv`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangeControls {...{ range, setRange, from, setFrom, to, setTo }} />
        <DownloadBtn href={csvUrl} filename={`audit-logs-${from}.csv`} />
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Actions" value={data?.total ?? 0} />
            <StatCard
              label="Most Common Action"
              value={
                data?.byAction
                  ? Object.entries(data.byAction as Record<string, number>).sort((a, b) => b[1] - a[1])[0]?.[0]?.replace(/_/g, " ") ?? "—"
                  : "—"
              }
            />
          </div>

          {data?.byAction && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.byAction as Record<string, number>)
                .sort((a, b) => b[1] - a[1])
                .map(([action, count]) => (
                  <Badge key={action} variant="outline" className="text-xs capitalize">
                    {action.replace(/_/g, " ")}: {count}
                  </Badge>
                ))}
            </div>
          )}

          {data?.rows?.length > 0 && (
            <>
              <h4 className="text-sm font-medium mt-2">Audit Trail</h4>
              <ReportTable
                headers={["Date & Time", "Admin", "Action", "Property", "Reason"]}
                rows={data.rows.map((r: any) => [
                  new Date(r.createdAt).toLocaleString("en-IN"),
                  `${r.adminFirst || ""} ${r.adminLast || ""}`.trim() || "—",
                  r.action.replace(/_/g, " "),
                  r.propertyTitle || "—",
                  r.reason || "—",
                ])}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminReports() {
  const { user } = useAuth();

  if ((user as any)?.userRole !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  const tabs = [
    { id: "views", label: "Property Views", icon: Eye, component: <PropertyViewsTab /> },
    { id: "funnel", label: "Booking Funnel", icon: TrendingUp, component: <BookingFunnelTab /> },
    { id: "cancellations", label: "Cancellations", icon: XCircle, component: <CancellationsTab /> },
    { id: "searches", label: "Searches", icon: Search, component: <SearchHistoryTab /> },
    { id: "notifications", label: "Notifications", icon: Bell, component: <NotificationLogsTab /> },
    { id: "chats", label: "Chat Logs", icon: MessageSquare, component: <ChatLogsTab /> },
    { id: "calls", label: "Call Logs", icon: Phone, component: <CallLogsTab /> },
    { id: "audit", label: "Audit Trail", icon: Shield, component: <AuditLogsTab /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Platform-wide data — all reports support daily / weekly / monthly presets and custom date ranges with CSV export.
          </p>
        </div>

        <Tabs defaultValue="views">
          <TabsList className="flex flex-wrap h-auto gap-1 mb-6 bg-muted p-1 rounded-lg">
            {tabs.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((t) => (
            <TabsContent key={t.id} value={t.id}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <t.icon className="h-4 w-4" />
                    {t.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>{t.component}</CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
