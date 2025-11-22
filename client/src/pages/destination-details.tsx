import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { MapPin, Calendar, ArrowLeft, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Destination, Property } from "@shared/schema";

export default function DestinationDetails() {
  const [, params] = useRoute("/destinations/:id");
  const [, setLocation] = useLocation();
  const destinationId = params?.id;

  const { data: destination, isLoading } = useQuery<Destination>({
    queryKey: ["/api/destinations", destinationId],
    enabled: !!destinationId,
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  // Filter properties by destination
  const destinationProperties = destination
    ? properties.filter(
        (p) =>
          p.destination.toLowerCase() === destination.name.toLowerCase() ||
          p.destination.toLowerCase() === destination.state.toLowerCase()
      )
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container px-4 md:px-6 py-8">
          <Skeleton className="h-8 w-24 mb-6" />
          <Skeleton className="aspect-[21/9] rounded-lg mb-6" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/3 mb-6" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Destination not found</h2>
          <p className="text-muted-foreground mb-6">
            The destination you're looking for doesn't exist.
          </p>
          <Button onClick={() => setLocation("/destinations")} data-testid="button-back-to-destinations">
            Back to Destinations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 md:px-6 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/destinations")}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Destinations
        </Button>

        {/* Hero Image */}
        <div
          className="h-80 rounded-lg bg-cover bg-center relative mb-8"
          style={{ backgroundImage: `url(${destination.imageUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent rounded-lg" />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2" data-testid="text-destination-name">
                  {destination.name}
                </h1>
                <div className="flex items-center gap-2 text-white/90 text-lg">
                  <MapPin className="h-5 w-5" />
                  <span>{destination.state}</span>
                </div>
              </div>
              {destination.isFeatured && (
                <Badge variant="secondary" className="bg-yellow-500/90 text-white border-0">
                  <Sparkles className="h-4 w-4 mr-1" />
                  Featured
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4">About {destination.name}</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {destination.shortDescription}
                </p>
                {destination.detailedInsight && (
                  <p className="text-muted-foreground leading-relaxed">
                    {destination.detailedInsight}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Highlights */}
            {destination.highlights && destination.highlights.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">Highlights</h2>
                  <ul className="space-y-2">
                    {destination.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                        <span className="text-primary mt-1">•</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Best Season */}
            {destination.bestSeason && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Best Time to Visit</h3>
                  </div>
                  <p className="text-muted-foreground">{destination.bestSeason}</p>
                </CardContent>
              </Card>
            )}

            {/* Properties Available */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">
                  {destinationProperties.length > 0
                    ? `${destinationProperties.length} Properties Available`
                    : "Properties"}
                </h3>
                {destinationProperties.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Explore amazing stays in {destination.name}
                    </p>
                    <Button
                      onClick={() =>
                        setLocation(`/search?destination=${encodeURIComponent(destination.name)}`)
                      }
                      className="w-full"
                      data-testid="button-view-properties"
                    >
                      View Properties
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No properties available in this destination yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
