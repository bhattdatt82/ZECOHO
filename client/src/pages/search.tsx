import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { PropertyCard } from "@/components/PropertyCard";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { SlidersHorizontal, X } from "lucide-react";
import type { Property } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export default function Search() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [priceRange, setPriceRange] = useState([0, 89000]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [minGuests, setMinGuests] = useState(1);
  const [showFilters, setShowFilters] = useState(true);
  const [searchDestination, setSearchDestination] = useState("");
  const [initialSearchValues, setInitialSearchValues] = useState({
    destination: "",
    checkIn: "",
    checkOut: "",
    guests: 2,
  });

  // Parse URL query parameters on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const destination = searchParams.get("destination") || "";
    const checkIn = searchParams.get("checkIn") || "";
    const checkOut = searchParams.get("checkOut") || "";
    const guests = searchParams.get("guests");
    
    setSearchDestination(destination);
    setInitialSearchValues({
      destination,
      checkIn,
      checkOut,
      guests: guests ? parseInt(guests) : 2,
    });
  }, [location]);

  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: wishlists = [] } = useQuery<any[]>({
    queryKey: ["/api/wishlists"],
    enabled: user?.userRole === "guest",
  });

  const wishlistedPropertyIds = new Set(wishlists.map((w: any) => w.propertyId));

  const propertyTypes = [
    { value: "hotel", label: "Hotels" },
    { value: "villa", label: "Villas" },
    { value: "apartment", label: "Apartments" },
    { value: "resort", label: "Resorts" },
    { value: "hostel", label: "Hostels" },
    { value: "lodge", label: "Lodges" },
    { value: "farmhouse", label: "Farmhouses" },
    { value: "homestay", label: "Homestays" },
  ];

  const handleSearch = ({ destination }: { destination?: string; checkIn?: string; checkOut?: string; guests?: number }) => {
    if (destination !== undefined) {
      setSearchDestination(destination);
    }
  };

  const filteredProperties = properties.filter((property) => {
    if (property.status !== "published") return false;
    
    if (searchDestination && searchDestination.trim().length > 0) {
      const searchLower = searchDestination.toLowerCase().trim();
      const destinationLower = property.destination.toLowerCase();
      if (!destinationLower.includes(searchLower)) {
        return false;
      }
    }
    
    const price = Number(property.pricePerNight);
    if (price < priceRange[0] || price > priceRange[1]) return false;
    
    if (selectedTypes.length > 0 && !selectedTypes.includes(property.propertyType)) {
      return false;
    }
    
    if (property.maxGuests < minGuests) return false;
    
    return true;
  });

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Search Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 md:px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <SearchBar 
                compact 
                onSearch={handleSearch}
                initialDestination={initialSearchValues.destination}
                initialCheckIn={initialSearchValues.checkIn}
                initialCheckOut={initialSearchValues.checkOut}
                initialGuests={initialSearchValues.guests}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              data-testid="button-toggle-filters"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>
        </div>
      </div>

      {/* Horizontal Filters Bar */}
      {showFilters && (
        <div className="border-b bg-muted/30">
          <div className="container px-4 md:px-6 py-4">
            <div className="flex flex-wrap items-end gap-6">
              {/* Price Range Filter */}
              <div className="flex-1 min-w-[200px] max-w-[300px]">
                <Label className="text-sm font-medium mb-2 block">Price range</Label>
                <Slider
                  min={0}
                  max={89000}
                  step={1000}
                  value={priceRange}
                  onValueChange={setPriceRange}
                  data-testid="slider-price"
                />
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-muted-foreground">₹{priceRange[0].toLocaleString('en-IN')}</span>
                  <span className="text-muted-foreground">₹{priceRange[1].toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Property Type Filter */}
              <div className="flex-1 min-w-[200px]">
                <Label className="text-sm font-medium mb-2 block">Property type</Label>
                <div className="flex flex-wrap gap-2">
                  {propertyTypes.map((type) => (
                    <Badge
                      key={type.value}
                      variant={selectedTypes.includes(type.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleType(type.value)}
                      data-testid={`checkbox-type-${type.value}`}
                    >
                      {type.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Guests Filter */}
              <div className="min-w-[100px]">
                <Label className="text-sm font-medium mb-2 block">Min. Guests</Label>
                <input
                  type="number"
                  min="1"
                  value={minGuests}
                  onChange={(e) => setMinGuests(Number(e.target.value))}
                  className="w-20 px-3 py-1.5 border rounded-md text-sm"
                  data-testid="input-min-guests"
                />
              </div>

              {/* Clear Filters */}
              {(selectedTypes.length > 0 || priceRange[0] > 0 || priceRange[1] < 89000 || minGuests > 1 || searchDestination) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPriceRange([0, 89000]);
                    setSelectedTypes([]);
                    setMinGuests(1);
                    setSearchDestination("");
                  }}
                  data-testid="button-clear-filters"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear all
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="container px-4 md:px-6 py-6">
        {/* Results */}
        <div className="w-full">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold mb-2">
                {filteredProperties.length} {filteredProperties.length === 1 ? "stay" : "stays"} available
              </h1>
              {searchDestination && (
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-sm text-muted-foreground">Searching for:</span>
                  <Badge variant="secondary" className="gap-1" data-testid="badge-destination-filter">
                    {searchDestination}
                    <button
                      onClick={() => setSearchDestination("")}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                      data-testid="button-clear-destination"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[4/3] rounded-lg" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={{
                      ...property,
                      isWishlisted: wishlistedPropertyIds.has(property.id),
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-lg text-muted-foreground mb-4">
                  No properties match your filters
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPriceRange([0, 1000]);
                    setSelectedTypes([]);
                    setMinGuests(1);
                    setSearchDestination("");
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
