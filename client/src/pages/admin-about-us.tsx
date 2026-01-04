import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Plus, FileText, Edit, Eye, Upload, Archive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AboutUs } from "@shared/schema";

const DEFAULT_ABOUT_US_TITLE = "About ZECOHO";

const DEFAULT_ABOUT_US_CONTENT = `# About ZECOHO

## Our Mission

ZECOHO (ZERO COMMISSION Hotel) is revolutionizing the hospitality industry by eliminating commission fees and connecting guests directly with property owners. Our mission is to create a transparent, fair, and cost-effective booking experience for everyone.

## The Zero-Commission Model

Traditional hotel booking platforms charge property owners hefty commission fees ranging from 15% to 30% per booking. These costs are ultimately passed on to guests through higher room rates.

**ZECOHO is different:**
- **Zero Commission Fees** – Property owners keep 100% of their earnings
- **Lower Prices for Guests** – Savings are passed directly to you
- **Direct Communication** – Connect directly with property owners
- **Transparent Pricing** – No hidden fees or surprise charges

## Our Role as a Technology Intermediary

ZECOHO operates as a technology platform that facilitates direct bookings between guests and property owners. We are not a travel agent or tour operator. Our role is to:

- Provide a secure and reliable booking platform
- Facilitate communication between guests and owners
- Process secure payments and protect both parties
- Maintain quality standards through verified listings

## Benefits for Guests

- **Competitive Pricing** – Access better rates without commission markups
- **Direct Owner Communication** – Get authentic property information
- **Secure Booking Process** – Protected payments and verified properties
- **Trusted Reviews** – Read honest feedback from verified guests
- **Wide Selection** – Discover unique properties across India

## Benefits for Property Owners

- **Keep 100% of Your Earnings** – No commission fees ever
- **Direct Guest Relationships** – Build lasting customer connections
- **Flexible Management** – Full control over pricing and availability
- **Increased Visibility** – Reach travelers across India
- **Simple Onboarding** – Easy property listing and management

## Company Details

**ZECOHO Technologies Pvt. Ltd.**

We are a registered company committed to transforming the hospitality booking experience in India. Our platform is designed with both guests and property owners in mind, ensuring a seamless and trustworthy booking process.

For any queries, please visit our Contact Us page or reach out to our support team.

---

*ZECOHO – Where Zero Commission Meets Quality Hospitality*`;

export default function AdminAboutUs() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  
  const [selectedAboutUs, setSelectedAboutUs] = useState<AboutUs | null>(null);
  const [newTitle, setNewTitle] = useState(DEFAULT_ABOUT_US_TITLE);
  const [newContent, setNewContent] = useState(DEFAULT_ABOUT_US_CONTENT);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  if (user?.userRole !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            You need admin privileges to access this panel.
          </p>
          <Button onClick={() => setLocation("/")} data-testid="button-back-home">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const { data: aboutUsList = [], isLoading } = useQuery<AboutUs[]>({
    queryKey: ["/api/admin/about-us"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      return apiRequest("POST", "/api/admin/about-us", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/about-us"] });
      toast({ title: "Success", description: "About Us draft created successfully" });
      setCreateDialogOpen(false);
      resetCreateForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { title?: string; content?: string } }) => {
      return apiRequest("PATCH", `/api/admin/about-us/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/about-us"] });
      toast({ title: "Success", description: "About Us updated successfully" });
      setEditDialogOpen(false);
      setSelectedAboutUs(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/admin/about-us/${id}/publish`);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/about-us"] });
      toast({ title: "Success", description: data.message || "About Us published successfully" });
      setPublishDialogOpen(false);
      setSelectedAboutUs(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetCreateForm = () => {
    setNewTitle(DEFAULT_ABOUT_US_TITLE);
    setNewContent(DEFAULT_ABOUT_US_CONTENT);
  };

  const openEditDialog = (aboutUs: AboutUs) => {
    setSelectedAboutUs(aboutUs);
    setEditTitle(aboutUs.title);
    setEditContent(aboutUs.content);
    setEditDialogOpen(true);
  };

  const openPublishDialog = (aboutUs: AboutUs) => {
    setSelectedAboutUs(aboutUs);
    setPublishDialogOpen(true);
  };

  const openPreviewDialog = (aboutUs: AboutUs) => {
    setSelectedAboutUs(aboutUs);
    setPreviewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Published</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "archived":
        return <Badge variant="outline" className="text-muted-foreground">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const AboutUsCard = ({ aboutUs }: { aboutUs: AboutUs }) => (
    <Card key={aboutUs.id} className="relative">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-medium truncate">{aboutUs.title}</CardTitle>
            <CardDescription className="mt-1">
              Version {aboutUs.version} {getStatusBadge(aboutUs.status)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {aboutUs.content.substring(0, 200)}...
        </div>
        <div className="text-xs text-muted-foreground mb-4">
          {aboutUs.publishedAt ? (
            <span>Published: {new Date(aboutUs.publishedAt).toLocaleDateString()}</span>
          ) : (
            <span>Created: {new Date(aboutUs.createdAt!).toLocaleDateString()}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openPreviewDialog(aboutUs)}
            data-testid={`button-preview-about-${aboutUs.id}`}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          {aboutUs.status === "draft" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditDialog(aboutUs)}
                data-testid={`button-edit-about-${aboutUs.id}`}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                onClick={() => openPublishDialog(aboutUs)}
                data-testid={`button-publish-about-${aboutUs.id}`}
              >
                <Upload className="h-4 w-4 mr-1" />
                Publish
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">About Us Page</h1>
          <p className="text-muted-foreground">
            Manage the About Us page content and versions
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-about-us">
          <Plus className="h-4 w-4 mr-2" />
          Create New Version
        </Button>
      </div>

      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 mb-6">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Archive className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 dark:text-blue-200">How Versioning Works</p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                When you publish a new About Us version, the previous published version is automatically archived. 
                The published version is displayed on the public About Us page.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {aboutUsList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No About Us content yet</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              Create First Version
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {aboutUsList.map((aboutUs) => (
            <AboutUsCard key={aboutUs.id} aboutUs={aboutUs} />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New About Us Version</DialogTitle>
            <DialogDescription>
              Create a new draft version of the About Us page content
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="about-title">Title</Label>
              <Input
                id="about-title"
                placeholder="About ZECOHO"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                data-testid="input-about-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="about-content">Content</Label>
              <Textarea
                id="about-content"
                placeholder="Enter the About Us content here..."
                className="min-h-[300px] font-mono text-sm"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                data-testid="input-about-content"
              />
              <p className="text-xs text-muted-foreground">
                You can use plain text or markdown formatting
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate({ title: newTitle, content: newContent })}
              disabled={createMutation.isPending || !newTitle.trim() || !newContent.trim()}
              data-testid="button-submit-create-about"
            >
              {createMutation.isPending ? "Creating..." : "Create Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit About Us Draft</DialogTitle>
            <DialogDescription>
              Edit the draft version before publishing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-about-title">Title</Label>
              <Input
                id="edit-about-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                data-testid="input-edit-about-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-about-content">Content</Label>
              <Textarea
                id="edit-about-content"
                className="min-h-[300px] font-mono text-sm"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                data-testid="input-edit-about-content"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedAboutUs) {
                  updateMutation.mutate({
                    id: selectedAboutUs.id,
                    data: { title: editTitle, content: editContent },
                  });
                }
              }}
              disabled={updateMutation.isPending}
              data-testid="button-submit-edit-about"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish About Us</DialogTitle>
            <DialogDescription>
              Are you sure you want to publish this version? This will make it visible on the public About Us page.
              {selectedAboutUs && aboutUsList.some(a => a.status === "published") && (
                <span className="block mt-2 text-amber-600 dark:text-amber-400">
                  The currently published version will be automatically archived.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedAboutUs) {
                  publishMutation.mutate(selectedAboutUs.id);
                }
              }}
              disabled={publishMutation.isPending}
              data-testid="button-confirm-publish-about"
            >
              {publishMutation.isPending ? "Publishing..." : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAboutUs?.title}</DialogTitle>
            <DialogDescription>
              Version {selectedAboutUs?.version} - {selectedAboutUs?.status}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
              {selectedAboutUs?.content}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
