import { useRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { MapPin } from "lucide-react";

interface PlacesInputProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: PlaceDetails) => void;
  placeholder?: string;
  testId?: string;
}

export interface PlaceDetails {
  address: string;
  latitude: number;
  longitude: number;
  name?: string;
}

export function PlacesInput({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Search for a location...",
  testId,
}: PlacesInputProps) {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load Google Maps API
    if (typeof window !== "undefined" && !(window as any).google) {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn("Google Maps API key not found");
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if ((window as any).google) {
          autocompleteServiceRef.current = new (window as any).google.maps.places.AutocompleteService();
          placesServiceRef.current = new (window as any).google.maps.places.PlacesService(
            document.createElement("div")
          );
        }
      };
      document.head.appendChild(script);
    } else if ((window as any).google?.maps?.places) {
      autocompleteServiceRef.current = new (window as any).google.maps.places.AutocompleteService();
      placesServiceRef.current = new (window as any).google.maps.places.PlacesService(
        document.createElement("div")
      );
    }
  }, []);

  const handleInputChange = async (inputValue: string) => {
    onChange(inputValue);
    
    if (!inputValue || inputValue.length < 2) {
      setPredictions([]);
      setShowSuggestions(false);
      return;
    }

    if (!autocompleteServiceRef.current) {
      return;
    }

    setLoading(true);
    try {
      const results = await autocompleteServiceRef.current.getPlacePredictions({
        input: inputValue,
        componentRestrictions: { country: "in" }, // Focus on India
      });
      setPredictions(results.predictions || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching predictions:", error);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlace = async (placeId: string, description: string) => {
    onChange(description);
    setShowSuggestions(false);

    if (!placesServiceRef.current) {
      return;
    }

    try {
      placesServiceRef.current.getDetails(
        { placeId },
        (place: any, status: string) => {
          if (status === "OK" && place) {
            const placeDetails: PlaceDetails = {
              address: place.formatted_address || description,
              latitude: place.geometry?.location?.lat() || 0,
              longitude: place.geometry?.location?.lng() || 0,
              name: place.name,
            };
            onPlaceSelect?.(placeDetails);
          }
        }
      );
    } catch (error) {
      console.error("Error getting place details:", error);
    }
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => value && predictions.length > 0 && setShowSuggestions(true)}
        data-testid={testId}
        className="pr-10"
      />
      {predictions.length > 0 && showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-input rounded-md shadow-md z-50 max-h-64 overflow-y-auto">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              onClick={() => handleSelectPlace(prediction.place_id, prediction.description)}
              className="w-full text-left px-4 py-2 hover:bg-muted flex items-start gap-3 border-b last:border-b-0 transition-colors"
              data-testid={`button-place-${prediction.place_id}`}
            >
              <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{prediction.main_text}</p>
                <p className="text-xs text-muted-foreground truncate">{prediction.secondary_text}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
