import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Utensils } from "lucide-react";

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
}: RoomTypeSelectProps) {
  const activeRoomTypes = roomTypes.filter((rt) => rt.isActive !== false);
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
    const hasDiscount =
      rt.originalPrice &&
      parseFloat(rt.originalPrice) > parseFloat(rt.basePrice);
    const price = `₹${Number(rt.basePrice).toLocaleString("en-IN")}/night`;
    return hasDiscount
      ? `${rt.name} — ${price} (was ₹${Number(rt.originalPrice).toLocaleString("en-IN")})`
      : `${rt.name} — ${price}`;
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

        {/* Sub-line: guests + availability + discount badge */}
        {selectedRoom && (
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground">
              Up to {selectedRoom.maxGuests} guests
            </span>
            {selectedInventory && !selectedInventory.isSoldOut && (
              <span
                className={`text-xs ${
                  selectedInventory.isLowStock
                    ? "text-amber-600 font-medium"
                    : "text-muted-foreground"
                }`}
              >
                · {selectedInventory.availableRooms} room
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
                        parseFloat(selectedRoom.originalPrice)) *
                      100,
                  )}
                  % OFF
                </Badge>
              )}
            {selectedRoom.description && (
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                · {selectedRoom.description}
              </span>
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
        {price === 0 ? (
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
// The old RoomTypeCard is no longer used. This re-exports RoomTypeSelect
// under the old name so any other imports don't break immediately.
export { RoomTypeSelect as RoomTypeCard };
