import { useRef, useEffect, useState } from "react";
import { Home } from "lucide-react";

interface PropertyMapProps {
  latitude: number;
  longitude: number;
  title?: string;
}

export function PropertyMap({ latitude, longitude, title }: PropertyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const initCalledRef = useRef(false);

  useEffect(() => {
    if (initCalledRef.current) return;
    
    const initMap = () => {
      if (!mapContainerRef.current || !(window as any).google?.maps || initCalledRef.current) return;
      
      initCalledRef.current = true;

      const position = { lat: latitude, lng: longitude };

      const map = new (window as any).google.maps.Map(mapContainerRef.current, {
        center: position,
        zoom: 14,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      mapInstanceRef.current = map;

      const svgIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="#222222" stroke="white" stroke-width="3"/>
          <path d="M24 14 L32 22 L32 32 L16 32 L16 22 Z" fill="white"/>
          <rect x="21" y="26" width="6" height="6" fill="#222222"/>
        </svg>
      `;

      const marker = new (window as any).google.maps.Marker({
        position: position,
        map: map,
        title: title || "Property Location",
        icon: {
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svgIcon),
          scaledSize: new (window as any).google.maps.Size(48, 48),
          anchor: new (window as any).google.maps.Point(24, 24),
        },
      });

      markerRef.current = marker;
      setMapLoaded(true);
    };

    const checkAndLoadGoogleMaps = () => {
      if ((window as any).google?.maps) {
        initMap();
        return;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) return;

      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        const checkLoaded = setInterval(() => {
          if ((window as any).google?.maps) {
            initMap();
            clearInterval(checkLoaded);
          }
        }, 100);
        setTimeout(() => clearInterval(checkLoaded), 10000);
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => initMap();
      document.head.appendChild(script);
    };

    checkAndLoadGoogleMaps();

    return () => {
      if (markerRef.current) {
        try {
          markerRef.current.setMap(null);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [latitude, longitude, title]);

  return (
    <div className="w-full h-[400px] rounded-xl relative" data-testid="property-map">
      <div 
        ref={mapContainerRef} 
        className="w-full h-full rounded-xl"
      />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-muted rounded-xl flex items-center justify-center">
          <div className="text-muted-foreground flex items-center gap-2">
            <Home className="h-5 w-5 animate-pulse" />
            Loading map...
          </div>
        </div>
      )}
    </div>
  );
}
