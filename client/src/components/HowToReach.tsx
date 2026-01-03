import { useQuery } from "@tanstack/react-query";
import { Train, Bus, Plane, Navigation, Clock, MapPin, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TransportHub {
  name: string;
  type: string;
  rating: number | null;
  userRatingsTotal: number;
  vicinity: string;
  distance: number;
  placeId: string;
  icon: string | null;
  photoReference: string | null;
}

interface NearbyPlacesData {
  transportHubs: TransportHub[];
  landmarks: TransportHub[];
  localities: TransportHub[];
  thingsToDo: TransportHub[];
}

interface HowToReachProps {
  propertyId: string;
  propertyName: string;
  latitude?: number;
  longitude?: number;
}

function getTransportIcon(type: string) {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('subway') || lowerType.includes('metro')) return Train;
  if (lowerType.includes('train') || lowerType.includes('railway')) return Train;
  if (lowerType.includes('bus')) return Bus;
  if (lowerType.includes('airport')) return Plane;
  return Navigation;
}

function getTransportLabel(type: string): string {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('subway') || lowerType.includes('metro')) return 'Metro Station';
  if (lowerType.includes('train') || lowerType.includes('railway')) return 'Railway Station';
  if (lowerType.includes('bus')) return 'Bus Stop';
  if (lowerType.includes('airport')) return 'Airport';
  return 'Transport';
}

function estimateTravelTime(distanceKm: number, transportType: string): string {
  const lowerType = transportType.toLowerCase();
  
  if (lowerType.includes('airport')) {
    const mins = Math.round(distanceKm * 2.5);
    return mins < 60 ? `~${mins} min drive` : `~${Math.round(mins / 60 * 10) / 10} hr drive`;
  }
  
  if (distanceKm <= 2) {
    const walkMins = Math.round(distanceKm * 12);
    return `~${walkMins} min walk`;
  } else if (distanceKm <= 5) {
    const driveMins = Math.round(distanceKm * 3);
    return `~${driveMins} min drive`;
  } else {
    const driveMins = Math.round(distanceKm * 2.5);
    return driveMins < 60 ? `~${driveMins} min drive` : `~${Math.round(driveMins / 60 * 10) / 10} hr drive`;
  }
}

function TransportCard({ hub, latitude, longitude }: { hub: TransportHub; latitude: number; longitude: number }) {
  const Icon = getTransportIcon(hub.type);
  const label = getTransportLabel(hub.type);
  const travelTime = estimateTravelTime(hub.distance, hub.type);
  
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(hub.name)}&origin_place_id=${hub.placeId}&destination=${latitude},${longitude}&travelmode=driving`;
  
  return (
    <div 
      className="flex items-start gap-3 p-4 rounded-lg border bg-card hover-elevate transition-all"
      data-testid={`transport-card-${hub.placeId}`}
    >
      <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="secondary" className="text-xs font-medium">
            {label}
          </Badge>
        </div>
        <h4 className="font-medium text-sm text-foreground line-clamp-2">{hub.name}</h4>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {hub.distance} km
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {travelTime}
          </span>
        </div>
        <a 
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
          data-testid={`directions-link-${hub.placeId}`}
        >
          Get Directions
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

function TransportSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border">
      <Skeleton className="h-9 w-9 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function HowToReach({ propertyId, propertyName, latitude, longitude }: HowToReachProps) {
  const { data, isLoading, isError } = useQuery<NearbyPlacesData>({
    queryKey: ['/api/properties', propertyId, 'nearby-places'],
    enabled: !!latitude && !!longitude,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  if (!latitude || !longitude) {
    return null;
  }

  if (isError) {
    return null;
  }

  const hasTransportData = data && data.transportHubs && data.transportHubs.length > 0;

  if (!isLoading && !hasTransportData) {
    return null;
  }

  const metroStations = data?.transportHubs.filter(h => 
    h.type.toLowerCase().includes('subway') || h.type.toLowerCase().includes('metro')
  ).slice(0, 2) || [];
  
  const railwayStations = data?.transportHubs.filter(h => 
    h.type.toLowerCase().includes('train') && !h.type.toLowerCase().includes('subway')
  ).slice(0, 2) || [];
  
  const busStops = data?.transportHubs.filter(h => 
    h.type.toLowerCase().includes('bus')
  ).slice(0, 2) || [];
  
  const airports = data?.transportHubs.filter(h => 
    h.type.toLowerCase().includes('airport')
  ).slice(0, 2) || [];

  const allTransport = [...metroStations, ...railwayStations, ...busStops, ...airports];

  const mainDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;

  return (
    <Card data-testid="how-to-reach-section">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Navigation className="h-5 w-5" />
            How to Reach
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            asChild
            data-testid="button-get-directions-main"
          >
            <a 
              href={mainDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              Get Directions to Property
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Nearest transport options to reach {propertyName}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <TransportSkeleton key={i} />)
          ) : allTransport.length > 0 ? (
            allTransport.map((hub) => (
              <TransportCard 
                key={hub.placeId} 
                hub={hub} 
                latitude={latitude} 
                longitude={longitude} 
              />
            ))
          ) : (
            <p className="text-muted-foreground text-sm col-span-full">
              No transport hubs found nearby. Use the "Get Directions" button above for navigation.
            </p>
          )}
        </div>
        
        {!isLoading && allTransport.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Travel times are approximate estimates based on distance. Actual times may vary based on traffic and route conditions.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
