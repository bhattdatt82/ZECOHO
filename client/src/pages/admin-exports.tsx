import { AdminGuard } from "@/components/AdminGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Users, UserCog, CalendarCheck, Building2, CreditCard, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportItem {
  label: string;
  description: string;
  endpoint: string;
  filename: string;
  icon: React.ReactNode;
}

const EXPORTS: ExportItem[] = [
  {
    label: "Hotel Owners",
    description: "All owner accounts — name, email, phone, KYC status, suspension status",
    endpoint: "/api/admin/export/owners",
    filename: "zecoho-owners.csv",
    icon: <UserCog className="h-5 w-5" />,
  },
  {
    label: "Customers / Guests",
    description: "All guest accounts — name, email, phone, account status",
    endpoint: "/api/admin/export/customers",
    filename: "zecoho-customers.csv",
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: "Bookings",
    description: "All bookings — guest info, property, check-in/out dates, price, status",
    endpoint: "/api/admin/export/bookings",
    filename: "zecoho-bookings.csv",
    icon: <CalendarCheck className="h-5 w-5" />,
  },
  {
    label: "Properties",
    description: "All properties — title, owner, city, type, price, rating, status",
    endpoint: "/api/admin/export/properties",
    filename: "zecoho-properties.csv",
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    label: "Subscriptions",
    description: "All owner subscriptions — tier, status, price, dates, waiver info",
    endpoint: "/api/admin/export/subscriptions",
    filename: "zecoho-subscriptions.csv",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    label: "Referrals",
    description: "Referral activity — referrer, referee, reward codes, redemption status",
    endpoint: "/api/admin/referrals/export",
    filename: "zecoho-referrals.csv",
    icon: <ChevronRight className="h-5 w-5" />,
  },
];

export default function AdminExports() {
  const { toast } = useToast();

  async function handleDownload(item: ExportItem) {
    try {
      const res = await fetch(item.endpoint, { credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast({ title: "Download failed", description: e.message, variant: "destructive" });
    }
  }

  return (
    <AdminGuard permission="reports">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Data Exports</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Download platform data as CSV — opens directly in Microsoft Excel or Google Sheets.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {EXPORTS.map((item) => (
            <Card key={item.endpoint} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-muted shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-7 text-xs"
                        onClick={() => handleDownload(item)}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download CSV
                      </Button>
                      <span className="text-xs text-muted-foreground">.csv · Excel compatible</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          CSV files use UTF-8 encoding. Open in Excel using Data → From Text/CSV for best results
          with special characters.
        </p>
      </div>
    </AdminGuard>
  );
}
