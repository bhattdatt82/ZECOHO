import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { XCircle, AlertTriangle, ArrowRight } from "lucide-react";

interface RestrictedAccessProps {
  title?: string;
  description?: string;
  showFixKycButton?: boolean;
}

export function RestrictedAccess({
  title = "Access Restricted",
  description = "Your KYC verification has been rejected. Please fix the issues and resubmit to access this feature.",
  showFixKycButton = true,
}: RestrictedAccessProps) {
  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <Alert variant="destructive" className="border-2" data-testid="alert-kyc-restricted">
        <XCircle className="h-5 w-5" />
        <AlertTitle className="text-lg font-semibold" data-testid="text-restricted-title">
          {title}
        </AlertTitle>
        <AlertDescription className="mt-2" data-testid="text-restricted-description">
          <p className="mb-4">{description}</p>
          {showFixKycButton && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/owner/kyc">
                <Button variant="destructive" data-testid="button-fix-kyc-cta">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Fix KYC & Resubmit
                </Button>
              </Link>
              <Link href="/owner/dashboard">
                <Button variant="outline" data-testid="button-go-dashboard">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
