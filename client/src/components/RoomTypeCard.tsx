import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Utensils,
  Wifi,
  Wind,
  Tv,
  Sunset,
  BedDouble,
  Users,
  Ruler,
  Eye,
  Bath,
  Refrigerator,
  Coffee,
  Shield,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";

// Resolve correct room rate based on adults count (new model)
function resolvePrice(rt: RoomTypeData, adultsPerRoom: number): number {
  if (adultsPerRoom >= 3 && rt.tripleOccupancyPrice)
    return Number(rt.tripleOccupancyPrice);
  if (adultsPerRoom >= 2 && rt.doubleOccupancyPrice)
    return Number(rt.doubleOccupancyPrice);
  if (rt.singleOccupancyPrice) return Number(rt.singleOccupancyPrice);
  return Number(rt.basePrice);
}

export interface MealOption {
  id: string;
  name: string;
  description?: string | null;
  priceAdjustment: string;
  inclusions?: string | null;
}

export interface RoomTypeData {
  id: string;
  name: string;
  description?: string | null;
  basePrice: string;
  originalPrice?: string | null;
  maxGuests: number;
  totalRooms?: number;
  mealOptions?: MealOption[];
  // New occupancy prices
  singleOccupancyPrice?: string | null;
  doubleOccupancyPrice?: string | null;
  tripleOccupancyPrice?: string | null;
  // Room details
  bedType?: string | null;
  viewType?: string | null;
  bathroomType?: string | null;
  roomSizeSqft?: number | null;
  hasAC?: boolean;
  hasTV?: boolean;
  hasWifi?: boolean;
  hasBalcony?: boolean;
  minimumStay?: number | null;
  isActive?: boolean;
}

export interface RoomInventory {
  roomTypeId: string;
  availableRooms: number;
  isSoldOut: boolean;
  isLowStock: boolean;
}

interface RoomTypeSelectProps {
  roomTypes: RoomTypeData[];
  selectedRoomTypeId: string | null;
  selectedMealOptionId: string | null;
  onRoomTypeSelect: (roomTypeId: string) => void;
  onMealOptionSelect: (mealOptionId: string | null) => void;
  inventoryMap?: Record<string, RoomInventory>;
  showDatesContext?: boolean;
  adults?: number;
}

/**
 * Option A guest booking UI:
 * - Room type as a single dropdown (shows price, availability, discount)
 * - Meal plan as always-visible radio-style list below
 */
export function RoomTypeSelect({
  roomTypes,
  selectedRoomTypeId,
  selectedMealOptionId,
  onRoomTypeSelect,
  onMealOptionSelect,
  inventoryMap = {},
  showDatesContext = false,
  adults = 1,
}: RoomTypeSelectProps) {
  const activeRoomTypes = (roomTypes ?? []).filter(
    (rt) => rt.isActive !== false,
  );
  const selectedRoom =
    activeRoomTypes.find((rt) => rt.id === selectedRoomTypeId) ?? null;
  const selectedInventory = selectedRoomTypeId
    ? inventoryMap[selectedRoomTypeId]
    : null;

  // Meal options for the selected room type, filtering out "Room Only" duplicates
  const mealOptions = (selectedRoom?.mealOptions ?? []).filter((opt) => {
    const n = opt.name.toLowerCase();
    return (
      n !== "room only" &&
      n !== "roomonly" &&
      !n.includes("room only (best price)") &&
      !n.includes("no meal") &&
      !n.includes("no meals")
    );
  });

  function getRoomLabel(rt: RoomTypeData, inv?: RoomInventory) {
    const price = resolvePrice(rt, adults);
    const hasDiscount =
      rt.originalPrice &&
      parseFloat(rt.originalPrice) > parseFloat(rt.basePrice);
    const priceStr = `₹${price.toLocaleString("en-IN")}/night`;
    return hasDiscount
      ? `${rt.name} — ${priceStr} (was ₹${Number(rt.originalPrice).toLocaleString("en-IN")})`
      : `${rt.name} — ${priceStr}`;
  }

  return (
    <div className="space-y-4">
      {/* ── Room type dropdown ── */}
      <div>
        <label className="text-sm font-semibold block mb-1.5">Room type</label>
        <Select
          value={selectedRoomTypeId ?? ""}
          onValueChange={(val) => {
            onRoomTypeSelect(val);
            onMealOptionSelect(null); // reset meal on room change
          }}
        >
          <SelectTrigger
            className="w-full"
            data-testid="select-room-type-dropdown"
          >
            <SelectValue placeholder="Select a room type" />
          </SelectTrigger>
          <SelectContent>
            {activeRoomTypes.map((rt) => {
              const inv = inventoryMap[rt.id];
              const soldOut = inv?.isSoldOut ?? false;
              return (
                <SelectItem
                  key={rt.id}
                  value={rt.id}
                  disabled={soldOut}
                  data-testid={`room-type-option-${rt.id}`}
                >
                  <span className={soldOut ? "opacity-50 line-through" : ""}>
                    {getRoomLabel(rt, inv)}
                  </span>
                  {soldOut && (
                    <span className="ml-2 text-xs text-destructive">
                      Sold out
                    </span>
                  )}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Sub-line: room details + availability + discount badge */}
        {selectedRoom && (
          <div className="mt-2 space-y-1.5">
            {/* Key details */}
            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
              <span>Up to {selectedRoom.maxGuests} guests</span>
              {selectedRoom.bedType && (
                <span>· {selectedRoom.bedType} bed</span>
              )}
              {selectedRoom.viewType && <span>· {selectedRoom.viewType}</span>}
              {selectedRoom.roomSizeSqft && (
                <span>· {selectedRoom.roomSizeSqft} sq ft</span>
              )}
              {selectedRoom.bathroomType && (
                <span>· {selectedRoom.bathroomType} bathroom</span>
              )}
              {selectedRoom.minimumStay && selectedRoom.minimumStay > 1 && (
                <span className="text-amber-600 font-medium">
                  · Min {selectedRoom.minimumStay} nights
                </span>
              )}
            </div>
            {/* Amenity icons */}
            {(selectedRoom.hasAC ||
              selectedRoom.hasWifi ||
              selectedRoom.hasTV ||
              selectedRoom.hasBalcony) && (
              <div className="flex items-center gap-3 flex-wrap">
                {selectedRoom.hasAC && (
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                    <Wind className="h-3 w-3" /> AC
                  </span>
                )}
                {selectedRoom.hasWifi && (
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                    <Wifi className="h-3 w-3" /> WiFi
                  </span>
                )}
                {selectedRoom.hasTV && (
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                    <Tv className="h-3 w-3" /> TV
                  </span>
                )}
                {selectedRoom.hasBalcony && (
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                    <Sunset className="h-3 w-3" /> Balcony
                  </span>
                )}
              </div>
            )}
            {/* Occupancy rates if multiple set */}
            {(selectedRoom.singleOccupancyPrice ||
              selectedRoom.doubleOccupancyPrice ||
              selectedRoom.tripleOccupancyPrice) && (
              <div className="flex gap-1.5 flex-wrap">
                {selectedRoom.singleOccupancyPrice && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                    1 guest: ₹
                    {Number(selectedRoom.singleOccupancyPrice).toLocaleString(
                      "en-IN",
                    )}
                  </span>
                )}
                {selectedRoom.doubleOccupancyPrice && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                    2 guests: ₹
                    {Number(selectedRoom.doubleOccupancyPrice).toLocaleString(
                      "en-IN",
                    )}
                  </span>
                )}
                {selectedRoom.tripleOccupancyPrice && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                    3+ guests: ₹
                    {Number(selectedRoom.tripleOccupancyPrice).toLocaleString(
                      "en-IN",
                    )}
                  </span>
                )}
              </div>
            )}
            {/* Availability + discount */}
            <div className="flex items-center gap-2 flex-wrap">
              {selectedInventory && !selectedInventory.isSoldOut && (
                <span
                  className={`text-xs ${selectedInventory.isLowStock ? "text-amber-600 font-medium" : "text-muted-foreground"}`}
                >
                  {selectedInventory.availableRooms} room
                  {selectedInventory.availableRooms !== 1 ? "s" : ""} available
                  {showDatesContext ? " for your dates" : ""}
                  {selectedInventory.isLowStock ? " — low stock!" : ""}
                </span>
              )}
              {selectedRoom.originalPrice &&
                parseFloat(selectedRoom.originalPrice) >
                  parseFloat(selectedRoom.basePrice) && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  >
                    {Math.round(
                      (1 -
                        parseFloat(selectedRoom.basePrice) /
                          parseFloat(selectedRoom.originalPrice!)) *
                        100,
                    )}
                    % OFF
                  </Badge>
                )}
            </div>
            {selectedRoom.description && (
              <p className="text-xs text-muted-foreground">
                {selectedRoom.description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Meal plan radio list ── */}
      {selectedRoom && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Utensils className="h-3.5 w-3.5 text-muted-foreground" />
            <label className="text-sm font-semibold">Meal plan</label>
            <span className="text-xs text-muted-foreground">
              (per person per night)
            </span>
          </div>

          <div className="border rounded-lg overflow-hidden divide-y">
            {/* Room Only — always first, always present */}
            <MealPlanRow
              id={null}
              name="Room Only (Best Price)"
              description="No meals included"
              priceAdjustment="0"
              isSelected={selectedMealOptionId === null}
              onSelect={() => onMealOptionSelect(null)}
              testId="option-no-meal"
            />

            {mealOptions.map((opt) => (
              <MealPlanRow
                key={opt.id}
                id={opt.id}
                name={opt.name}
                description={opt.inclusions ?? opt.description ?? undefined}
                priceAdjustment={opt.priceAdjustment}
                isSelected={selectedMealOptionId === opt.id}
                onSelect={() => onMealOptionSelect(opt.id)}
                testId={`option-meal-${opt.id}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MealPlanRow({
  id,
  name,
  description,
  priceAdjustment,
  isSelected,
  onSelect,
  testId,
}: {
  id: string | null;
  name: string;
  description?: string;
  priceAdjustment: string;
  isSelected: boolean;
  onSelect: () => void;
  testId?: string;
}) {
  const price = Number(priceAdjustment);

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
        isSelected ? "bg-primary/5" : "hover:bg-muted/40"
      }`}
      onClick={onSelect}
      data-testid={testId}
    >
      {/* Radio indicator */}
      <div
        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          isSelected
            ? "border-primary bg-primary"
            : "border-muted-foreground/40"
        }`}
      >
        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${isSelected ? "font-medium" : ""}`}>{name}</p>
        {description && (
          <p className="text-xs text-muted-foreground truncate">
            {description}
          </p>
        )}
      </div>

      {/* Price */}
      <div className="text-right flex-shrink-0">
        {price === 0 && id === null ? null : price === 0 ? (
          <span className="text-xs text-muted-foreground">Included</span>
        ) : (
          <span
            className={`text-sm font-medium ${isSelected ? "text-primary" : "text-primary/80"}`}
          >
            +₹{price.toLocaleString("en-IN")}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Legacy export for backwards compatibility ──────────────────────────────
export { RoomTypeSelect as RoomTypeCard };

// ── MMT-style Room Cards ───────────────────────────────────────────────────

interface RoomTypeCardsProps {
  roomTypes: RoomTypeData[];
  propertyImages?: string[];
  selectedRoomTypeId: string | null;
  selectedMealOptionId: string | null;
  onRoomTypeSelect: (roomTypeId: string) => void;
  onMealOptionSelect: (mealOptionId: string | null) => void;
  inventoryMap?: Record<string, RoomInventory>;
  showDatesContext?: boolean;
  adults?: number;
  guests?: number;
  nights?: number;
}

export function RoomTypeCards({
  roomTypes,
  propertyImages = [],
  selectedRoomTypeId,
  selectedMealOptionId,
  onRoomTypeSelect,
  onMealOptionSelect,
  inventoryMap = {},
  showDatesContext = false,
  adults = 1,
  guests = 1,
  nights = 1,
}: RoomTypeCardsProps) {
  const [expandedMealPlanId, setExpandedMealPlanId] = useState<string | null>(
    selectedRoomTypeId,
  );

  const activeRoomTypes = (roomTypes ?? []).filter(
    (rt) => rt.isActive !== false,
  );

  const fmt = (n: number) => n.toLocaleString("en-IN");

  function getEffectivePrice(rt: RoomTypeData): number {
    return resolvePrice(rt, Math.ceil(adults / Math.max(1, 1)));
  }

  function getOccupancyLabel(rt: RoomTypeData, adultsCount: number): string {
    if (adultsCount >= 3 && rt.tripleOccupancyPrice) return "Triple occupancy";
    if (adultsCount >= 2 && rt.doubleOccupancyPrice) return "Double occupancy";
    if (rt.singleOccupancyPrice) return "Single occupancy";
    return "";
  }

  function getDiscountPercent(rt: RoomTypeData): number {
    if (!rt.originalPrice) return 0;
    const orig = parseFloat(rt.originalPrice);
    const base = parseFloat(rt.basePrice);
    if (orig <= base) return 0;
    return Math.round((1 - base / orig) * 100);
  }

  function handleRoomSelect(rtId: string) {
    onRoomTypeSelect(rtId);
    onMealOptionSelect(null);
    setExpandedMealPlanId(rtId);
  }

  if (activeRoomTypes.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Select Room Type
        </h3>
        {showDatesContext && (
          <span className="text-xs text-muted-foreground">
            {nights} night{nights !== 1 ? "s" : ""} · {guests} guest
            {guests !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {activeRoomTypes.map((rt) => {
        const inv = inventoryMap[rt.id];
        const isSoldOut = inv?.isSoldOut ?? false;
        const isLowStock = inv?.isLowStock ?? false;
        const availableRooms = inv?.availableRooms ?? rt.totalRooms ?? null;
        const isSelected = selectedRoomTypeId === rt.id;
        const discount = getDiscountPercent(rt);
        const effectivePrice = getEffectivePrice(rt);
        const occupancyLabel = getOccupancyLabel(rt, adults);

        const mealOptions = (rt.mealOptions ?? []).filter((opt) => {
          const n = opt.name.toLowerCase();
          return (
            n !== "room only" &&
            n !== "roomonly" &&
            !n.includes("room only (best price)") &&
            !n.includes("no meal") &&
            !n.includes("no meals")
          );
        });

        const showMealPlans = expandedMealPlanId === rt.id || isSelected;

        return (
          <div
            key={rt.id}
            className={`border rounded-xl overflow-hidden transition-all ${
              isSelected
                ? "border-primary ring-1 ring-primary shadow-sm"
                : isSoldOut
                  ? "border-border opacity-60"
                  : "border-border hover:border-muted-foreground/40 hover:shadow-sm"
            }`}
          >
            {/* Card top: image + details + price */}
            <div className="flex gap-0">
              {/* Room image */}
              <div className="w-28 flex-shrink-0 sm:w-36">
                <img
                  src={
                    (rt as any).images?.[0] ||
                    propertyImages[0] ||
                    "/placeholder-property.jpg"
                  }
                  alt={rt.name}
                  className="w-full h-full object-cover min-h-[120px]"
                />
              </div>

              {/* Details */}
              <div className="flex-1 p-3 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4
                        className={`text-sm font-semibold leading-tight ${isSoldOut ? "line-through text-muted-foreground" : ""}`}
                      >
                        {rt.name}
                      </h4>
                      {isSelected && !isSoldOut && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      )}
                    </div>
                    {/* Availability badge */}
                    {isSoldOut ? (
                      <span className="text-xs text-destructive font-medium">
                        Sold out
                      </span>
                    ) : isLowStock && availableRooms !== null ? (
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-0.5">
                        <AlertTriangle className="h-3 w-3" />
                        Only {availableRooms} left!
                      </span>
                    ) : availableRooms !== null && showDatesContext ? (
                      <span className="text-xs text-green-600 dark:text-green-400">
                        {availableRooms} room{availableRooms !== 1 ? "s" : ""}{" "}
                        available
                      </span>
                    ) : null}
                  </div>

                  {/* Price column */}
                  <div className="text-right flex-shrink-0">
                    {rt.originalPrice &&
                      parseFloat(rt.originalPrice) >
                        parseFloat(rt.basePrice) && (
                        <div className="text-xs text-muted-foreground line-through">
                          ₹{fmt(Number(rt.originalPrice))}
                        </div>
                      )}
                    <div className="text-base font-bold text-foreground">
                      ₹{fmt(effectivePrice)}
                    </div>
                    <div className="text-xs text-muted-foreground">/night</div>
                    {discount > 0 && (
                      <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 mt-0.5 border-0">
                        {discount}% OFF
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Room specs */}
                <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground mb-1.5">
                  {rt.bedType && (
                    <span className="flex items-center gap-0.5">
                      <BedDouble className="h-3 w-3" />
                      {rt.bedType}
                    </span>
                  )}
                  {rt.roomSizeSqft && (
                    <span className="flex items-center gap-0.5">
                      <Ruler className="h-3 w-3" />
                      {rt.roomSizeSqft} sq ft
                    </span>
                  )}
                  {rt.viewType && (
                    <span className="flex items-center gap-0.5">
                      <Eye className="h-3 w-3" />
                      {rt.viewType}
                    </span>
                  )}
                  <span className="flex items-center gap-0.5">
                    <Users className="h-3 w-3" />
                    Up to {rt.maxGuests} guests
                  </span>
                  {rt.bathroomType && (
                    <span className="flex items-center gap-0.5">
                      <Bath className="h-3 w-3" />
                      {rt.bathroomType}
                    </span>
                  )}
                </div>

                {/* Amenity icons */}
                <div className="flex gap-2 flex-wrap mb-2">
                  {rt.hasAC && (
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <Wind className="h-3 w-3" /> AC
                    </span>
                  )}
                  {rt.hasWifi && (
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <Wifi className="h-3 w-3" /> WiFi
                    </span>
                  )}
                  {rt.hasTV && (
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <Tv className="h-3 w-3" /> TV
                    </span>
                  )}
                  {rt.hasBalcony && (
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <Sunset className="h-3 w-3" /> Balcony
                    </span>
                  )}
                  {(rt as any).hasFridge && (
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <Refrigerator className="h-3 w-3" /> Fridge
                    </span>
                  )}
                  {(rt as any).hasKettle && (
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <Coffee className="h-3 w-3" /> Kettle
                    </span>
                  )}
                  {(rt as any).hasSafe && (
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <Shield className="h-3 w-3" /> Safe
                    </span>
                  )}
                </div>

                {/* Occupancy pricing pills */}
                {(rt.singleOccupancyPrice ||
                  rt.doubleOccupancyPrice ||
                  rt.tripleOccupancyPrice) && (
                  <div className="flex gap-1 flex-wrap mb-2">
                    {rt.singleOccupancyPrice && (
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full border ${occupancyLabel === "Single occupancy" && adults === 1 ? "bg-primary/10 border-primary/30 text-primary font-medium" : "bg-muted border-border text-muted-foreground"}`}
                      >
                        1 guest: ₹{fmt(Number(rt.singleOccupancyPrice))}
                      </span>
                    )}
                    {rt.doubleOccupancyPrice && (
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full border ${occupancyLabel === "Double occupancy" ? "bg-primary/10 border-primary/30 text-primary font-medium" : "bg-muted border-border text-muted-foreground"}`}
                      >
                        2 guests: ₹{fmt(Number(rt.doubleOccupancyPrice))}
                      </span>
                    )}
                    {rt.tripleOccupancyPrice && (
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full border ${occupancyLabel === "Triple occupancy" ? "bg-primary/10 border-primary/30 text-primary font-medium" : "bg-muted border-border text-muted-foreground"}`}
                      >
                        3+ guests: ₹{fmt(Number(rt.tripleOccupancyPrice))}
                      </span>
                    )}
                  </div>
                )}

                {/* Min stay notice */}
                {rt.minimumStay && rt.minimumStay > 1 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-2">
                    Minimum stay: {rt.minimumStay} nights
                  </p>
                )}

                {/* Select button */}
                <Button
                  size="sm"
                  variant={isSelected ? "default" : "outline"}
                  disabled={isSoldOut}
                  onClick={() => handleRoomSelect(rt.id)}
                  className="h-7 text-xs"
                  data-testid={`button-select-room-${rt.id}`}
                >
                  {isSoldOut
                    ? "Sold Out"
                    : isSelected
                      ? "Selected"
                      : "Select Room"}
                </Button>
              </div>
            </div>

            {/* Meal plan section (expands when room is selected or hovered) */}
            {(isSelected || showMealPlans) && !isSoldOut && (
              <div className="border-t bg-muted/30">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() =>
                    setExpandedMealPlanId(
                      expandedMealPlanId === rt.id ? null : rt.id,
                    )
                  }
                >
                  <span className="flex items-center gap-1">
                    <Utensils className="h-3 w-3" />
                    Meal plan{" "}
                    <span className="font-normal">(per person/night)</span>
                  </span>
                  {expandedMealPlanId === rt.id ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>

                {expandedMealPlanId === rt.id && (
                  <div className="divide-y border-t">
                    <MealPlanRow
                      id={null}
                      name="Room Only (Best Price)"
                      description="No meals included"
                      priceAdjustment="0"
                      isSelected={
                        isSelected && selectedMealOptionId === null
                      }
                      onSelect={() => {
                        if (!isSelected) handleRoomSelect(rt.id);
                        onMealOptionSelect(null);
                      }}
                      testId="option-no-meal"
                    />
                    {mealOptions.map((opt) => (
                      <MealPlanRow
                        key={opt.id}
                        id={opt.id}
                        name={opt.name}
                        description={opt.inclusions ?? opt.description ?? undefined}
                        priceAdjustment={opt.priceAdjustment}
                        isSelected={isSelected && selectedMealOptionId === opt.id}
                        onSelect={() => {
                          if (!isSelected) handleRoomSelect(rt.id);
                          onMealOptionSelect(opt.id);
                        }}
                        testId={`option-meal-${opt.id}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
