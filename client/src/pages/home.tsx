import { useQuery } from "@tanstack/react-query";
import { PropertyCard } from "@/components/PropertyCard";
import { SearchBar } from "@/components/SearchBar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Home as HomeIcon, MapPin, Calendar } from "lucide-react";
import type { Property, Destination } from "@shared/schema";
import heroImage from "@assets/generated_images/luxury_villa_hero_image.png";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: wishlists = [] } = useQuery<any[]>({
    queryKey: ["/api/wishlists"],
    enabled: user?.userRole === "guest",
  });

  const { data: featuredDestinations = [], isLoading: destinationsLoading } = useQuery<Destination[]>({
    queryKey: ["/api/destinations/featured"],
  });

  const wishlistedPropertyIds = new Set(wishlists.map((w: any) => w.propertyId));

  const handleSearch = (params: any) => {
    const searchParams = new URLSearchParams();
    if (params.destination) searchParams.set("destination", params.destination);
    if (params.checkIn) searchParams.set("checkIn", params.checkIn);
    if (params.checkOut) searchParams.set("checkOut", params.checkOut);
    if (params.guests) searchParams.set("guests", params.guests.toString());
    setLocation(`/search?${searchParams.toString()}`);
  };

  const featuredProperties = properties.filter(p => p.status === "published").slice(0, 8);

  return (
    <div className="min-h-screen">
      {/* List Your Property CTA Banner */}
      <div className="bg-primary text-white py-4 px-4 md:px-6">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <HomeIcon className="h-6 w-6" />
            <div>
              <h3 className="font-semibold text-lg">Become a Property Owner</h3>
              <p className="text-sm text-white/90">List your property and start earning today</p>
            </div>
          </div>
          <Button 
            variant="secondary"
            size="lg"
            onClick={() => setLocation("/list-property")}
            data-testid="button-list-property-cta"
            className="whitespace-nowrap"
          >
            List Your Property
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-[500px] flex items-center justify-center mb-12">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
        </div>
        
        <div className="relative z-10 container px-4 md:px-6 text-center">
          <div className="mb-3">
            <span className="text-sm font-semibold text-white/80 tracking-wider uppercase">
              Powered by ZECOHO
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome back, {user?.firstName || "Guest"}!
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8">
            Where would you like to go?
          </p>
          
          <div className="flex justify-center">
            <SearchBar onSearch={handleSearch} />
          </div>
        </div>
      </div>

      {/* Discover India Section */}
      <div className="container px-4 md:px-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-semibold mb-2">Discover India</h2>
            <p className="text-muted-foreground">Explore the best places to visit across incredible India</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setLocation("/destinations")}
            data-testid="button-view-all-destinations"
          >
            View All
          </Button>
        </div>

        {destinationsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[16/9] rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : featuredDestinations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredDestinations.map((destination) => (
              <Card 
                key={destination.id} 
                className="overflow-hidden hover-elevate active-elevate-2 cursor-pointer transition-all"
                onClick={() => setLocation(`/search?destination=${encodeURIComponent(destination.name)}`)}
                data-testid={`card-destination-${destination.id}`}
              >
                <div 
                  className="h-48 bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${destination.imageUrl})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-xl font-bold text-white mb-1" data-testid={`text-destination-name-${destination.id}`}>
                      {destination.name}
                    </h3>
                    <div className="flex items-center gap-1 text-white/90 text-sm">
                      <MapPin className="h-3 w-3" />
                      <span>{destination.state}</span>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {destination.shortDescription}
                  </p>
                  {destination.bestSeason && (
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="h-3 w-3 text-primary" />
                      <span className="text-muted-foreground">Best time: {destination.bestSeason}</span>
                    </div>
                  )}
                  <div className="mt-3">
                    <Badge variant="secondary" className="text-xs">
                      Explore Properties
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">
              No featured destinations available yet. Check back soon!
            </p>
          </div>
        )}
      </div>

      {/* Featured Properties */}
      <div className="container px-4 md:px-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-semibold">Featured stays</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : featuredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={{
                  ...property,
                  isWishlisted: wishlistedPropertyIds.has(property.id),
                }}
                onWishlistToggle={(id) => setLocation(`/properties/${id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">
              No properties available yet. Check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
