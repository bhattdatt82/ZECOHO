import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MapPin, Calendar, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Destination } from "@shared/schema";

export default function Destinations() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: destinations = [], isLoading } = useQuery<Destination[]>({
    queryKey: ["/api/destinations"],
  });

  const filteredDestinations = destinations.filter((dest) =>
    dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dest.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dest.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-12">
        <div className="container px-4 md:px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Discover India</h1>
          <p className="text-lg text-primary-foreground/90 max-w-2xl">
            Explore incredible destinations across India. From serene beaches to majestic mountains, 
            find your perfect getaway.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="container px-4 md:px-6 py-8">
        <div className="max-w-xl">
          <Input
            type="text"
            placeholder="Search destinations by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-destinations"
            className="h-12"
          />
        </div>
      </div>

      {/* Destinations Grid */}
      <div className="container px-4 md:px-6 pb-16">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[16/9] rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredDestinations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDestinations.map((destination) => (
              <Card
                key={destination.id}
                className="overflow-hidden hover-elevate active-elevate-2 cursor-pointer transition-all"
                onClick={() => setLocation(`/destinations/${destination.id}`)}
                data-testid={`card-destination-${destination.id}`}
              >
                <div
                  className="h-56 bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${destination.imageUrl})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1" data-testid={`text-destination-name-${destination.id}`}>
                          {destination.name}
                        </h3>
                        <div className="flex items-center gap-1 text-white/90 text-sm">
                          <MapPin className="h-3 w-3" />
                          <span>{destination.state}</span>
                        </div>
                      </div>
                      {destination.isFeatured && (
                        <Badge variant="secondary" className="bg-yellow-500/90 text-white border-0">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {destination.shortDescription}
                  </p>
                  {destination.bestSeason && (
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="h-3 w-3 text-primary" />
                      <span className="text-muted-foreground">Best time: {destination.bestSeason}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">
              {searchQuery ? "No destinations match your search." : "No destinations available yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
