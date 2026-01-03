import { useQuery } from "@tanstack/react-query";
import { MapPin, Train, Building2, Landmark, Camera, TreePine, ShoppingBag, ChurchIcon, Star, Navigation } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface NearbyPlace {
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
  landmarks: NearbyPlace[];
  localities: NearbyPlace[];
  thingsToDo: NearbyPlace[];
}

interface NearbyPlacesProps {
  propertyId: string;
  latitude?: number;
  longitude?: number;
}

function getPlaceIcon(type: string) {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('train') || lowerType.includes('subway')) return Train;
  if (lowerType.includes('bus')) return Navigation;
  if (lowerType.includes('airport')) return Navigation;
  if (lowerType.includes('hospital')) return Building2;
  if (lowerType.includes('mall') || lowerType.includes('shopping')) return ShoppingBag;
  if (lowerType.includes('temple') || lowerType.includes('mosque') || lowerType.includes('church')) return ChurchIcon;
  if (lowerType.includes('museum') || lowerType.includes('attraction')) return Camera;
  if (lowerType.includes('park') || lowerType.includes('zoo')) return TreePine;
  if (lowerType.includes('neighborhood') || lowerType.includes('locality')) return MapPin;
  return Landmark;
}

function PlaceCard({ place }: { place: NearbyPlace }) {
  const Icon = getPlaceIcon(place.type);
  
  return (
    <div 
      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover-elevate transition-all"
      data-testid={`place-card-${place.placeId}`}
    >
      <div className="p-2 rounded-lg bg-muted flex-shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-foreground truncate">{place.name}</h4>
        <p className="text-xs text-muted-foreground capitalize">{place.type}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs">
            {place.distance} km
          </Badge>
          {place.rating && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {place.rating}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function PlaceSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border">
      <Skeleton className="h-8 w-8 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function NearbyPlaces({ propertyId, latitude, longitude }: NearbyPlacesProps) {
  const { data, isLoading, isError } = useQuery<NearbyPlacesData>({
    queryKey: ['/api/properties', propertyId, 'nearby-places'],
    enabled: !!latitude && !!longitude,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
  });

  if (!latitude || !longitude) {
    return null;
  }

  if (isError) {
    return null; // Silently fail - don't show error to users for optional feature
  }

  const hasAnyData = data && (
    data.landmarks.length > 0 || 
    data.localities.length > 0 || 
    data.thingsToDo.length > 0
  );

  if (!isLoading && !hasAnyData) {
    return null;
  }

  return (
    <div className="space-y-8" data-testid="nearby-places-section">
      {/* Nearby Landmarks */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Landmark className="h-5 w-5" />
          Nearby Landmarks
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <PlaceSkeleton key={i} />)
          ) : data?.landmarks.length ? (
            data.landmarks.map((place) => (
              <PlaceCard key={place.placeId} place={place} />
            ))
          ) : (
            <p className="text-muted-foreground text-sm col-span-full">No major landmarks found nearby</p>
          )}
        </div>
      </div>

      {/* Nearby Localities */}
      {(isLoading || (data?.localities && data.localities.length > 0)) && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Nearby Localities
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <PlaceSkeleton key={i} />)
            ) : (
              data?.localities.map((place) => (
                <PlaceCard key={place.placeId} place={place} />
              ))
            )}
          </div>
        </div>
      )}

      {/* Things To Do */}
      {(isLoading || (data?.thingsToDo && data.thingsToDo.length > 0)) && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Things To Do
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <PlaceSkeleton key={i} />)
            ) : (
              data?.thingsToDo.map((place) => (
                <PlaceCard key={place.placeId} place={place} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
