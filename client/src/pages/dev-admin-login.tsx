import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function DevAdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminLogin = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/test/admin-login", {});
      const data = await response.json();
      
      toast({
        title: "Admin Session Created",
        description: "You're now logged in as a test admin user.",
      });
      
      // Redirect to admin panel after successful login
      setTimeout(() => {
        setLocation("/admin/properties");
      }, 1000);
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Failed to create admin session",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Development Admin Login</CardTitle>
          <CardDescription>
            Test admin features in development mode
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-md p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>⚠️ Development Only</strong>
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              This bypass creates a temporary admin session for testing. It only works in development mode and will not work after publishing.
            </p>
          </div>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Test Admin User:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Email: admin@zecoho.com</li>
              <li>Role: Admin</li>
              <li>ID: test-admin-user</li>
            </ul>
          </div>

          <Button 
            onClick={handleAdminLogin}
            disabled={isLoading}
            className="w-full"
            data-testid="button-dev-admin-login"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Session...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Login as Test Admin
              </>
            )}
          </Button>

          <div className="text-xs text-center text-muted-foreground pt-2">
            After publishing, use the email promotion endpoint to create real admin users
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
