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
import { MapPin, Navigation, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LocationPermissionDialogProps {
  isAuthenticated: boolean;
}

export function LocationPermissionDialog({ isAuthenticated }: LocationPermissionDialogProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) return;

    const hasAskedLocation = localStorage.getItem("locationPermissionAsked");
    const userLocation = localStorage.getItem("userLocation");

    if (!hasAskedLocation && !userLocation) {
      const timer = setTimeout(() => {
        setShowDialog(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  const handleAllowLocation = () => {
    setIsRequesting(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
      setIsRequesting(false);
      handleClose();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now(),
        };
        localStorage.setItem("userLocation", JSON.stringify(locationData));
        localStorage.setItem("locationPermissionAsked", "true");
        
        toast({
          title: "Location saved",
          description: "We'll show you properties near your location.",
        });
        
        setIsRequesting(false);
        setShowDialog(false);
      },
      (error) => {
        console.error("Location error:", error);
        localStorage.setItem("locationPermissionAsked", "true");
        
        let message = "Unable to get your location.";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location access was denied. You can enable it later in browser settings.";
        }
        
        toast({
          title: "Location unavailable",
          description: message,
          variant: "destructive",
        });
        
        setIsRequesting(false);
        setShowDialog(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 600000,
      }
    );
  };

  const handleClose = () => {
    localStorage.setItem("locationPermissionAsked", "true");
    setShowDialog(false);
  };

  const handleSkip = () => {
    localStorage.setItem("locationPermissionAsked", "true");
    setShowDialog(false);
  };

  if (!isAuthenticated) return null;

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-location-permission">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Navigation className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            Enable Location Services
          </DialogTitle>
          <DialogDescription className="text-center">
            Allow ZECOHO to access your location to find properties near you and provide personalized recommendations.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <div className="flex items-start gap-3 text-sm">
            <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <span>Discover properties nearby</span>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <span>Get personalized destination suggestions</span>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <span>Easier search experience</span>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button 
            onClick={handleAllowLocation} 
            className="w-full"
            disabled={isRequesting}
            data-testid="button-allow-location"
          >
            {isRequesting ? (
              <>
                <Navigation className="h-4 w-4 mr-2 animate-pulse" />
                Getting Location...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 mr-2" />
                Allow Location Access
              </>
            )}
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleSkip}
            className="w-full"
            disabled={isRequesting}
            data-testid="button-skip-location"
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
