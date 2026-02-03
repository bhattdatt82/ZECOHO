import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/SearchBar";
import { MapPin, Calendar, Users, Pencil, X, ChevronDown } from "lucide-react";
import { format } from "date-fns";

interface StickySearchSummaryProps {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
  onSearch: (params: {
    destination: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    adults?: number;
    children?: number;
    rooms?: number;
  }) => void;
}

export function StickySearchSummary({
  destination,
  checkIn,
  checkOut,
  adults,
  children,
  rooms,
  onSearch,
}: StickySearchSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      return format(new Date(dateStr), "dd MMM");
    } catch {
      return dateStr;
    }
  };

  const totalGuests = adults + children;
  const guestText = `${adults} Adult${adults !== 1 ? "s" : ""}${children > 0 ? `, ${children} Child${children !== 1 ? "ren" : ""}` : ""}`;
  const roomText = `${rooms} Room${rooms !== 1 ? "s" : ""}`;

  const handleSearchSubmit = (params: any) => {
    onSearch(params);
    setIsExpanded(false);
  };

  return (
    <div className="sticky top-0 z-50 bg-background border-b shadow-sm">
      {/* Compact Summary Bar */}
      <div 
        className="container px-4 md:px-6 py-3"
        data-testid="sticky-search-summary"
      >
        <div className="flex items-center justify-between gap-2">
          {/* Summary Info - Single Line */}
          <div 
            className="flex-1 flex items-center gap-2 md:gap-4 overflow-x-auto scrollbar-hide cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid="search-summary-toggle"
          >
            {/* Location */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm md:text-base truncate max-w-[120px] md:max-w-[200px]">
                {destination || "Any Location"}
              </span>
            </div>

            <span className="text-muted-foreground hidden md:inline">|</span>

            {/* Dates */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm md:text-base whitespace-nowrap">
                {checkIn && checkOut 
                  ? `${formatDate(checkIn)} - ${formatDate(checkOut)}`
                  : "Select Dates"
                }
              </span>
            </div>

            <span className="text-muted-foreground hidden md:inline">|</span>

            {/* Guests & Rooms */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm md:text-base whitespace-nowrap">
                {guestText}, {roomText}
              </span>
            </div>
          </div>

          {/* Edit Button */}
          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0 gap-1.5"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid="button-edit-search"
          >
            {isExpanded ? (
              <>
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Close</span>
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4" />
                <span className="hidden sm:inline">Edit</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Expanded Search Form */}
      {isExpanded && (
        <div 
          className="container px-4 md:px-6 pb-4 animate-in slide-in-from-top-2 duration-200"
          data-testid="expanded-search-form"
        >
          <div className="bg-muted/50 rounded-lg p-4 border">
            <SearchBar
              onSearch={handleSearchSubmit}
              showDates={true}
              showGuests={true}
              initialDestination={destination}
              initialCheckIn={checkIn}
              initialCheckOut={checkOut}
              initialGuests={totalGuests}
              initialAdults={adults}
              initialChildren={children}
              initialRooms={rooms}
              ctaText="Update Search"
            />
          </div>
        </div>
      )}
    </div>
  );
}
