import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  MapPin,
  Calendar as CalendarIcon,
  Users,
  Search,
  Building2,
  Minus,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Property } from "@shared/schema";

// ─── Indian public holidays (static) ────────────────────────────────────────
const INDIAN_HOLIDAYS: Record<string, string> = {
  "2026-01-26": "Republic Day",
  "2026-03-25": "Holi",
  "2026-04-14": "Ambedkar Jayanti",
  "2026-08-15": "Independence Day",
  "2026-10-02": "Gandhi Jayanti",
  "2026-10-20": "Diwali",
  "2026-12-25": "Christmas",
};

// Custom DayContent: shows the date number + a 9px holiday label beneath it.
// Nav icons are re-declared here because the Shadcn Calendar spreads `{...props}`
// AFTER its own `components` definition, which would replace IconLeft/IconRight.
function HolidayDayContent({ date }: { date: Date }) {
  const key = format(date, "yyyy-MM-dd");
  const holiday = INDIAN_HOLIDAYS[key];
  return (
    <span
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        lineHeight: 1,
        gap: 1,
      }}
    >
      <span>{date.getDate()}</span>
      {holiday && (
        <span
          aria-label={holiday}
          style={{
            fontSize: "9px",
            color: "#f59e0b",
            lineHeight: 1,
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {holiday.split(" ")[0]}
        </span>
      )}
    </span>
  );
}

// Includes nav icons so they are not lost when this object overrides the
// Calendar component's own `components` prop via prop spread.
const CALENDAR_COMPONENTS = {
  IconLeft: (_props: object) => <ChevronLeft className="h-4 w-4" />,
  IconRight: (_props: object) => <ChevronRight className="h-4 w-4" />,
  DayContent: HolidayDayContent,
};

const LISTBOX_ID = "city-suggestions-listbox";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface SearchParams {
  city: string;
  checkin: string;
  checkout: string;
  rooms: number;
  adults: number;
  children: number;
}

export interface SearchBarProps {
  initialCity?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialRooms?: number;
  initialAdults?: number;
  initialChildren?: number;
  ctaText?: string;
  onSearch?: (params: SearchParams) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── GuestsPanel ─────────────────────────────────────────────────────────────
// Extracted as a named component outside SearchBar to avoid remount-on-render.
interface GuestsPanelProps {
  rooms: number;
  adults: number;
  children: number;
  onRooms: (v: number) => void;
  onAdults: (v: number) => void;
  onChildren: (v: number) => void;
}

function GuestsPanel({
  rooms,
  adults,
  children,
  onRooms,
  onAdults,
  onChildren,
}: GuestsPanelProps) {
  const rows = [
    {
      id: "rooms",
      label: "Rooms",
      sub: "Separate rooms",
      value: rooms,
      min: 1,
      max: 10,
      set: onRooms,
    },
    {
      id: "adults",
      label: "Adults",
      sub: "Ages 13+",
      value: adults,
      min: 1,
      max: 20,
      set: onAdults,
    },
    {
      id: "children",
      label: "Children",
      sub: "Ages 2–12",
      value: children,
      min: 0,
      max: 10,
      set: onChildren,
    },
  ];

  return (
    <div className="space-y-5">
      {rows.map(({ id, label, sub, value, min, max, set }) => (
        <div key={id} className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">{label}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
          <div
            className="flex items-center gap-3"
            role="group"
            aria-label={`${label} selector`}
          >
            <button
              type="button"
              aria-label={`Decrease ${label}`}
              onClick={() => set(Math.max(min, value - 1))}
              disabled={value <= min}
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-primary disabled:opacity-40 transition-colors"
              data-testid={`btn-${id}-minus`}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span
              className="w-5 text-center font-medium text-sm"
              aria-live="polite"
              data-testid={`count-${id}`}
            >
              {value}
            </span>
            <button
              type="button"
              aria-label={`Increase ${label}`}
              onClick={() => set(Math.min(max, value + 1))}
              disabled={value >= max}
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-primary disabled:opacity-40 transition-colors"
              data-testid={`btn-${id}-plus`}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── SearchBar ────────────────────────────────────────────────────────────────
export function SearchBar({
  initialCity = "",
  initialCheckIn = "",
  initialCheckOut = "",
  initialRooms = 1,
  initialAdults = 2,
  initialChildren = 0,
  ctaText = "Search",
  onSearch,
}: SearchBarProps) {
  const [, navigate] = useLocation();

  // Field state
  const [city, setCity] = useState(initialCity);
  const [checkInDate, setCheckInDate] = useState<Date | undefined>(
    initialCheckIn ? new Date(initialCheckIn) : undefined,
  );
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>(
    initialCheckOut ? new Date(initialCheckOut) : undefined,
  );
  const [rooms, setRooms] = useState(initialRooms);
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);

  // UI state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [guestsDrawerOpen, setGuestsDrawerOpen] = useState(false);
  const [dateDrawerOpen, setDateDrawerOpen] = useState(false);
  const [selectingCheckOut, setSelectingCheckOut] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  const comboboxRef = useRef<HTMLDivElement>(null);

  // Today at midnight — stable for the component lifetime
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Sync when parent updates initial props (e.g. StickySearchSummary edit flow)
  const prevProps = useRef({ initialCity, initialCheckIn, initialCheckOut });
  useEffect(() => {
    const prev = prevProps.current;
    if (initialCity !== prev.initialCity) setCity(initialCity);
    if (initialCheckIn !== prev.initialCheckIn)
      setCheckInDate(initialCheckIn ? new Date(initialCheckIn) : undefined);
    if (initialCheckOut !== prev.initialCheckOut)
      setCheckOutDate(initialCheckOut ? new Date(initialCheckOut) : undefined);
    prevProps.current = { initialCity, initialCheckIn, initialCheckOut };
  }, [initialCity, initialCheckIn, initialCheckOut]);

  // Mobile breakpoint
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!comboboxRef.current?.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch all published properties — TanStack Query caches this globally
  const { data: allProperties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    staleTime: 300_000,
  });

  const debouncedCity = useDebounce(city.trim(), 200);

  // Derive grouped suggestions from the cached property list
  const suggestions = useMemo(() => {
    if (debouncedCity.length < 2) {
      return { cities: [] as string[], properties: [] as Property[] };
    }
    const q = debouncedCity.toLowerCase();

    const citySet = new Set<string>();
    const cities: string[] = [];
    for (const p of allProperties) {
      if (p.status !== "published") continue;
      for (const field of [p.propCity, p.destination]) {
        if (!field) continue;
        const lower = field.toLowerCase();
        if (lower.includes(q) && !citySet.has(lower)) {
          citySet.add(lower);
          cities.push(field);
        }
      }
    }

    const props = allProperties
      .filter(
        (p) =>
          p.status === "published" &&
          (p.title ?? "").toLowerCase().includes(q),
      )
      .slice(0, 5);

    return { cities: cities.slice(0, 5), properties: props };
  }, [debouncedCity, allProperties]);

  const hasSuggestions =
    suggestions.cities.length > 0 || suggestions.properties.length > 0;

  // Build URL and navigate on search
  const handleSearch = useCallback(() => {
    const qs = new URLSearchParams();
    if (city.trim()) qs.set("city", city.trim());
    if (checkInDate) qs.set("checkin", format(checkInDate, "yyyy-MM-dd"));
    if (checkOutDate) qs.set("checkout", format(checkOutDate, "yyyy-MM-dd"));
    qs.set("rooms", String(rooms));
    qs.set("adults", String(adults));
    qs.set("children", String(children));
    navigate(`/search?${qs.toString()}`);
    onSearch?.({
      city: city.trim(),
      checkin: checkInDate ? format(checkInDate, "yyyy-MM-dd") : "",
      checkout: checkOutDate ? format(checkOutDate, "yyyy-MM-dd") : "",
      rooms,
      adults,
      children,
    });
  }, [city, checkInDate, checkOutDate, rooms, adults, children, navigate, onSearch]);

  // Auto-advance to check-out after check-in is picked
  const handleCheckInSelect = (date: Date | undefined) => {
    setCheckInDate(date);
    if (date) {
      setCheckInOpen(false);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setCheckOutOpen(true)),
      );
    }
  };

  const totalGuests = adults + children;
  const guestSummary = `${rooms} Room${rooms !== 1 ? "s" : ""}, ${totalGuests} Guest${totalGuests !== 1 ? "s" : ""}`;

  // ── Suggestion list (shared markup, used in both layouts) ─────────────────
  const SuggestionList = () => (
    <ul
      id={LISTBOX_ID}
      role="listbox"
      aria-label="City and property suggestions"
      className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-xl shadow-xl max-h-64 overflow-y-auto z-50"
    >
      {suggestions.cities.length > 0 && (
        <>
          <li
            role="presentation"
            className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted/30"
          >
            Cities
          </li>
          {suggestions.cities.map((c) => (
            <li
              key={c}
              role="option"
              aria-selected={city === c}
              className="flex items-center gap-2 px-4 py-3 hover:bg-muted cursor-pointer text-sm"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setCity(c);
                setShowSuggestions(false);
              }}
              data-testid={`suggestion-city-${c}`}
            >
              <MapPin className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
              {c}
            </li>
          ))}
        </>
      )}
      {suggestions.properties.length > 0 && (
        <>
          <li
            role="presentation"
            className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted/30"
          >
            Properties
          </li>
          {suggestions.properties.map((p) => (
            <li
              key={p.id}
              role="option"
              aria-selected={false}
              className="flex items-center gap-2 px-4 py-3 hover:bg-muted cursor-pointer text-sm"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setShowSuggestions(false);
                navigate(`/properties/${p.id}`);
              }}
              data-testid={`suggestion-property-${p.id}`}
            >
              <Building2 className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
              <span>
                <span className="font-medium block">{p.title}</span>
                {p.propCity && (
                  <span className="text-xs text-muted-foreground">{p.propCity}</span>
                )}
              </span>
            </li>
          ))}
        </>
      )}
    </ul>
  );

  // ── Shared drawers (rendered once, used regardless of mobile/desktop) ──────
  const SharedDrawers = () => (
    <>
      {/* Date drawer (mobile) */}
      <Drawer open={dateDrawerOpen} onOpenChange={setDateDrawerOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>
              {selectingCheckOut ? "Select Check-out Date" : "Select Check-in Date"}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 flex flex-col items-center gap-3">
            <div className="flex gap-2 w-full" role="tablist" aria-label="Date type">
              <button
                type="button"
                role="tab"
                aria-selected={!selectingCheckOut}
                onClick={() => setSelectingCheckOut(false)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  !selectingCheckOut
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                Check-in: {checkInDate ? format(checkInDate, "d MMM") : "Select"}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={selectingCheckOut}
                onClick={() => setSelectingCheckOut(true)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  selectingCheckOut
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                Check-out: {checkOutDate ? format(checkOutDate, "d MMM") : "Select"}
              </button>
            </div>
            <Calendar
              mode="single"
              selected={selectingCheckOut ? checkOutDate : checkInDate}
              onSelect={(date) => {
                if (selectingCheckOut) {
                  setCheckOutDate(date);
                  setDateDrawerOpen(false);
                } else {
                  setCheckInDate(date);
                  setSelectingCheckOut(true);
                }
              }}
              disabled={(date) =>
                selectingCheckOut
                  ? date < (checkInDate ? addDays(checkInDate, 1) : today)
                  : date < today
              }
              components={CALENDAR_COMPONENTS}
              className="w-full"
            />
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Done
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Guests drawer (mobile) */}
      <Drawer open={guestsDrawerOpen} onOpenChange={setGuestsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Rooms & Guests</DrawerTitle>
          </DrawerHeader>
          <div className="px-6 pb-4">
            <GuestsPanel
              rooms={rooms}
              adults={adults}
              children={children}
              onRooms={setRooms}
              onAdults={setAdults}
              onChildren={setChildren}
            />
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                Apply
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );

  // ── Mobile layout ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="flex flex-col gap-3 w-full">
        {/* City / Property */}
        <div ref={comboboxRef} className="relative">
          <label htmlFor="city-mobile" className="sr-only">
            City or property name
          </label>
          <div className="flex items-center gap-2 border rounded-xl bg-muted/40 px-4 py-3">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
            <input
              id="city-mobile"
              type="text"
              role="combobox"
              aria-label="City or property name"
              aria-autocomplete="list"
              aria-expanded={showSuggestions && hasSuggestions}
              aria-controls={LISTBOX_ID}
              aria-haspopup="listbox"
              placeholder="City or property name"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="flex-1 bg-transparent focus:outline-none text-sm placeholder:text-muted-foreground"
              autoComplete="off"
              data-testid="input-city-mobile"
            />
          </div>
          {showSuggestions && hasSuggestions && <SuggestionList />}
        </div>

        {/* Dates */}
        <button
          type="button"
          aria-label={
            checkInDate && checkOutDate
              ? `Dates: ${format(checkInDate, "d MMM")} to ${format(checkOutDate, "d MMM")}`
              : "Select check-in and check-out dates"
          }
          onClick={() => {
            setSelectingCheckOut(false);
            setDateDrawerOpen(true);
          }}
          className="flex items-center gap-2 border rounded-xl bg-muted/40 px-4 py-3 text-left hover:bg-muted/60 transition-colors"
          data-testid="btn-dates-mobile"
        >
          <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
          <span className="text-sm">
            {checkInDate && checkOutDate
              ? `${format(checkInDate, "d MMM")} → ${format(checkOutDate, "d MMM")}`
              : checkInDate
              ? `${format(checkInDate, "d MMM")} → Check-out`
              : "Check-in → Check-out"}
          </span>
        </button>

        {/* Rooms & Guests */}
        <button
          type="button"
          aria-label={`Rooms and guests: ${guestSummary}`}
          onClick={() => setGuestsDrawerOpen(true)}
          className="flex items-center gap-2 border rounded-xl bg-muted/40 px-4 py-3 text-left hover:bg-muted/60 transition-colors"
          data-testid="btn-guests-mobile"
        >
          <Users className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
          <span className="flex-1 text-sm">{guestSummary}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </button>

        {/* Search */}
        <Button
          size="lg"
          aria-label="Search hotels"
          onClick={handleSearch}
          className="w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold"
          data-testid="btn-search-mobile"
        >
          <Search className="h-4 w-4 mr-2" aria-hidden="true" />
          SEARCH
        </Button>

        <SharedDrawers />
      </div>
    );
  }

  // ── Desktop layout ─────────────────────────────────────────────────────────
  return (
    <>
      <div className="w-full max-w-4xl">
        <div
          role="search"
          aria-label="Hotel search"
          className="bg-background border rounded-full shadow-md flex items-center p-1.5"
        >
          {/* City / Property */}
          <div ref={comboboxRef} className="relative flex-[2] min-w-0">
            <div className="px-4 py-2 rounded-full hover:bg-muted/40 transition-colors">
              <label
                htmlFor="city-desktop"
                className="text-xs font-semibold text-foreground/70 block mb-0.5 cursor-pointer"
              >
                City / Property
              </label>
              <input
                id="city-desktop"
                type="text"
                role="combobox"
                aria-label="City or property name"
                aria-autocomplete="list"
                aria-expanded={showSuggestions && hasSuggestions}
                aria-controls={LISTBOX_ID}
                aria-haspopup="listbox"
                placeholder="Where are you going?"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                className="w-full bg-transparent focus:outline-none text-sm placeholder:text-muted-foreground"
                autoComplete="off"
                data-testid="input-city-desktop"
              />
            </div>
            {showSuggestions && hasSuggestions && (
              <ul
                id={LISTBOX_ID}
                role="listbox"
                aria-label="City and property suggestions"
                className="absolute top-full left-0 mt-2 bg-background border rounded-xl shadow-2xl w-72 max-h-80 overflow-y-auto z-50"
              >
                {suggestions.cities.length > 0 && (
                  <>
                    <li
                      role="presentation"
                      className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted/30"
                    >
                      Cities
                    </li>
                    {suggestions.cities.map((c) => (
                      <li
                        key={c}
                        role="option"
                        aria-selected={city === c}
                        className="flex items-center gap-2 px-4 py-3 hover:bg-muted cursor-pointer text-sm"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setCity(c);
                          setShowSuggestions(false);
                        }}
                        data-testid={`suggestion-city-desktop-${c}`}
                      >
                        <MapPin className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                        {c}
                      </li>
                    ))}
                  </>
                )}
                {suggestions.properties.length > 0 && (
                  <>
                    <li
                      role="presentation"
                      className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted/30"
                    >
                      Properties
                    </li>
                    {suggestions.properties.map((p) => (
                      <li
                        key={p.id}
                        role="option"
                        aria-selected={false}
                        className="flex items-center gap-2 px-4 py-3 hover:bg-muted cursor-pointer text-sm"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setShowSuggestions(false);
                          navigate(`/properties/${p.id}`);
                        }}
                        data-testid={`suggestion-property-desktop-${p.id}`}
                      >
                        <Building2 className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                        <span>
                          <span className="font-medium block">{p.title}</span>
                          {p.propCity && (
                            <span className="text-xs text-muted-foreground">{p.propCity}</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </>
                )}
              </ul>
            )}
          </div>

          <div className="h-8 w-px bg-border shrink-0 mx-1" />

          {/* Check-in */}
          <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={
                  checkInDate
                    ? `Check-in date: ${format(checkInDate, "d MMM")}`
                    : "Select check-in date"
                }
                aria-haspopup="dialog"
                aria-expanded={checkInOpen}
                className="flex-1 px-4 py-2 rounded-full hover:bg-muted/40 transition-colors text-left"
                data-testid="btn-checkin-desktop"
              >
                <span className="text-xs font-semibold text-foreground/70 block mb-0.5">
                  Check in
                </span>
                <span
                  className={`text-sm ${checkInDate ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {checkInDate ? format(checkInDate, "d MMM") : "Add date"}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={checkInDate}
                onSelect={handleCheckInSelect}
                disabled={(date) => date < today}
                components={CALENDAR_COMPONENTS}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <div className="h-8 w-px bg-border shrink-0 mx-1" />

          {/* Check-out */}
          <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={
                  checkOutDate
                    ? `Check-out date: ${format(checkOutDate, "d MMM")}`
                    : "Select check-out date"
                }
                aria-haspopup="dialog"
                aria-expanded={checkOutOpen}
                className="flex-1 px-4 py-2 rounded-full hover:bg-muted/40 transition-colors text-left"
                data-testid="btn-checkout-desktop"
              >
                <span className="text-xs font-semibold text-foreground/70 block mb-0.5">
                  Check out
                </span>
                <span
                  className={`text-sm ${checkOutDate ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {checkOutDate ? format(checkOutDate, "d MMM") : "Add date"}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={checkOutDate}
                onSelect={(d) => {
                  setCheckOutDate(d);
                  if (d) setCheckOutOpen(false);
                }}
                disabled={(date) =>
                  date < (checkInDate ? addDays(checkInDate, 1) : today)
                }
                components={CALENDAR_COMPONENTS}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <div className="h-8 w-px bg-border shrink-0 mx-1" />

          {/* Rooms & Guests */}
          <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={`Rooms and guests: ${guestSummary}`}
                aria-haspopup="dialog"
                aria-expanded={guestsOpen}
                className="flex-1 px-4 py-2 rounded-full hover:bg-muted/40 transition-colors text-left"
                data-testid="btn-guests-desktop"
              >
                <span className="text-xs font-semibold text-foreground/70 block mb-0.5">
                  Rooms & Guests
                </span>
                <span className="text-sm flex items-center gap-1 text-foreground">
                  {guestSummary}
                  <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-72 p-5"
              align="end"
              role="dialog"
              aria-label="Rooms and guests selector"
            >
              <p className="font-semibold text-sm mb-4">Rooms & Guests</p>
              <GuestsPanel
                rooms={rooms}
                adults={adults}
                children={children}
                onRooms={setRooms}
                onAdults={setAdults}
                onChildren={setChildren}
              />
            </PopoverContent>
          </Popover>

          {/* Search button */}
          <Button
            size="lg"
            aria-label="Search hotels"
            onClick={handleSearch}
            className="rounded-full px-6 ml-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold shrink-0"
            data-testid="btn-search-desktop"
          >
            <Search className="h-4 w-4 mr-2" aria-hidden="true" />
            {ctaText}
          </Button>
        </div>
      </div>

      {/* Drawers are always in the DOM but only visible when open */}
      <SharedDrawers />
    </>
  );
}
