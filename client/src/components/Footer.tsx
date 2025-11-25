import { Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-background py-6 mt-auto">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>
              For more information, write to{" "}
              <a 
                href="mailto:support@zecoho.com" 
                className="text-primary hover:underline font-medium"
                data-testid="link-support-email"
              >
                support@zecoho.com
              </a>
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ZECOHO. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
