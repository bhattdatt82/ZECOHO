import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Shield, Clock, CheckCircle2, FileText, ArrowRight } from "lucide-react";

interface KycPromptModalProps {
  open: boolean;
  onClose: () => void;
}

const SESSION_KEY = "zecoho_kyc_prompt_dismissed";

export function KycPromptModal({ open, onClose }: KycPromptModalProps) {
  const [, setLocation] = useLocation();

  const handleStartKyc = () => {
    sessionStorage.setItem(SESSION_KEY, "true");
    onClose();
    setLocation("/owner/kyc");
  };

  const handleLater = () => {
    sessionStorage.setItem(SESSION_KEY, "true");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleLater()}>
      <DialogContent className="sm:max-w-lg" data-testid="kyc-prompt-modal">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Shield className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle className="text-2xl" data-testid="kyc-prompt-title">
            Complete Verification to Go Live
          </DialogTitle>
          <DialogDescription className="text-base">
            To activate your property and receive bookings, we need to verify your identity 
            and property ownership. This takes about 5–10 minutes.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-sm">Document Upload</h4>
              <p className="text-sm text-muted-foreground">
                Upload ID proof and property ownership documents
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h4 className="font-medium text-sm">Quick Verification</h4>
              <p className="text-sm text-muted-foreground">
                Our team reviews within 24–72 hours
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="font-medium text-sm">Go Live</h4>
              <p className="text-sm text-muted-foreground">
                Once approved, start receiving bookings immediately
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="ghost" 
            onClick={handleLater}
            className="flex-1 sm:flex-none"
            data-testid="button-kyc-later"
          >
            I'll do this later
          </Button>
          <Button 
            onClick={handleStartKyc}
            className="flex-1"
            data-testid="button-start-kyc"
          >
            <Shield className="h-4 w-4 mr-2" />
            Start KYC
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useKycPromptModal(isOwner: boolean, kycStatus: string | undefined) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!isOwner) return;
    
    const needsKyc = kycStatus === "not_started" || kycStatus === "pending" || kycStatus === "incomplete";
    const alreadyDismissed = sessionStorage.getItem(SESSION_KEY) === "true";
    
    if (needsKyc && !alreadyDismissed) {
      const timer = setTimeout(() => setShowModal(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isOwner, kycStatus]);

  return { showModal, setShowModal };
}
