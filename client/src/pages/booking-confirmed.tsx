import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  CalendarDays,
  Users,
  BedDouble,
  MapPin,
  Clock,
  Utensils,
  Phone,
  MessageCircle,
  ArrowRight,
  Copy,
  Hourglass,
  BadgeCheck,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

function formatDate(dateStr: string) {
  try {
    return format(new Date(dateStr), "EEE, dd MMM yyyy");
  } catch {
    return dateStr;
  }
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.max(
    1,
    Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

function fmt(n: number) {
  return n.toLocaleString("en-IN");
}

export default function BookingConfirmed() {
  const [, params] = useRoute("/booking-confirmed/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const bookingId = params?.id;

  const { data: booking, isLoading } = useQuery({
    queryKey: ["/api/bookings", bookingId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/bookings/${bookingId}`);
      return res.json();
    },
    enabled: !!bookingId,
  });

  const { data: property } = useQuery({
    queryKey: ["/api/properties", booking?.propertyId],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/properties/${booking.propertyId}`,
      );
      return res.json();
    },
    enabled: !!booking?.propertyId,
  });

  function copyCode() {
    const code = booking?.bookingCode || bookingId?.slice(0, 8).toUpperCase();
    if (code) {
      navigator.clipboard.writeText(code);
      toast({ title: "Booking code copied!" });
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">
            Loading your booking...
          </p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <h2 className="text-xl font-semibold">Booking not found</h2>
          <Button onClick={() => setLocation("/my-bookings")}>
            Go to My Bookings
          </Button>
        </div>
      </div>
    );
  }

  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const bookingCode =
    booking.bookingCode || bookingId?.slice(0, 8).toUpperCase();

  // Price breakdown
  const totalPrice = Number(booking.totalPrice) || 0;
  const mealPrice = Number(booking.mealPrice) || 0;
  const roomPrice = totalPrice - mealPrice;
  const platformFee = Number(booking.platformFee) || 0;
  const gstAmount = Number(booking.gstAmount) || 0;
  const adults = Number(booking.adults) || 1;
  const childrenCount = Number(booking.childrenCount) || 0;
  const guestCount = Number(booking.guests) || adults + childrenCount;
  const roomCount = Number(booking.rooms) || 1;

  // Per-night room rate (approximate, actual may vary with overrides)
  const perNightPerRoom =
    nights > 0 && roomCount > 0 ? Math.round(roomPrice / nights / roomCount) : 0;

  const cancellationPolicy = property?.cancellationPolicyType;
  const freeCancellationHours = property?.freeCancellationHours || 24;
  const checkInTime = property?.checkInTime || "12:00";
  const checkOutTime = property?.checkOutTime || "11:00";

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl px-4 py-8 space-y-6">
        {/* Success Banner */}
        <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-green-800 dark:text-green-200">
              Booking Request Sent!
            </h1>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Your booking is pending owner confirmation. You'll be notified once
              it's accepted.
            </p>
          </div>

          {/* Booking code */}
          <div className="inline-flex items-center gap-2 bg-white dark:bg-green-950 border border-green-300 dark:border-green-700 rounded-xl px-4 py-2">
            <div>
              <p className="text-xs text-muted-foreground">Booking ID</p>
              <p className="text-lg font-mono font-bold tracking-widest text-foreground">
                {bookingCode}
              </p>
            </div>
            <button
              onClick={copyCode}
              className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
              title="Copy booking code"
            >
              <Copy className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Status Steps */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
              <Hourglass className="h-4 w-4 text-amber-500" />
              What happens next
            </h2>
            <div className="space-y-3">
              {[
                {
                  step: "1",
                  title: "Owner reviews your request",
                  desc: "The hotel owner will review and accept your booking shortly.",
                  done: false,
                },
                {
                  step: "2",
                  title: "You'll receive a confirmation",
                  desc: "Once accepted, you'll get an email and in-app notification.",
                  done: false,
                },
                {
                  step: "3",
                  title: "Show booking code at check-in",
                  desc: `Present booking ID ${bookingCode} at the front desk.`,
                  done: false,
                },
                {
                  step: "4",
                  title: "Pay at hotel",
                  desc: "No advance payment needed. Pay the full amount directly at the hotel.",
                  done: false,
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Booking Summary */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="text-sm font-semibold flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-primary" />
              Booking Summary
            </h2>

            {/* Property */}
            {property && (
              <div className="flex gap-3">
                {property.images?.[0] && (
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight">
                    {property.title}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-0.5 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {property.destination}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {property.propertyType}
                    </Badge>
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                      Zero Commission
                    </span>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Dates + Stay Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" /> Check-in
                </p>
                <p className="text-sm font-semibold">
                  {formatDate(booking.checkIn)}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> From {checkInTime}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" /> Check-out
                </p>
                <p className="text-sm font-semibold">
                  {formatDate(booking.checkOut)}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> By {checkOutTime}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>
                  <span className="font-medium text-foreground">{nights}</span>{" "}
                  night{nights !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>
                  <span className="font-medium text-foreground">
                    {adults} adult{adults !== 1 ? "s" : ""}
                  </span>
                  {childrenCount > 0 && (
                    <span>
                      {" "}
                      + {childrenCount} child{childrenCount !== 1 ? "ren" : ""}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <BedDouble className="h-3.5 w-3.5" />
                <span>
                  <span className="font-medium text-foreground">
                    {roomCount}
                  </span>{" "}
                  room{roomCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Room type */}
            {(booking.roomTypeName || (booking as any).roomType?.name) && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <BedDouble className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Room Type</p>
                  <p className="text-sm font-medium">
                    {booking.roomTypeName ||
                      (booking as any).roomType?.name ||
                      "Standard Room"}
                  </p>
                </div>
              </div>
            )}

            {/* Meal plan */}
            {booking.mealOptionName && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Utensils className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Meal Plan</p>
                  <p className="text-sm font-medium">{booking.mealOptionName}</p>
                </div>
              </div>
            )}

            <Separator />

            {/* Price Breakdown */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Price Breakdown</h3>

              {/* Room cost */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Room rate · {nights}N × {roomCount}R
                    {perNightPerRoom > 0 && (
                      <span className="text-xs">
                        {" "}
                        (≈ ₹{fmt(perNightPerRoom)}/night/room)
                      </span>
                    )}
                  </span>
                  <span className="font-medium">₹{fmt(roomPrice)}</span>
                </div>

                {/* Occupancy note */}
                {booking.adults > 1 && (
                  <div className="text-xs text-muted-foreground ml-0 pl-0">
                    {adults === 1
                      ? "Single occupancy rate"
                      : adults === 2
                        ? "Double occupancy rate"
                        : "Triple occupancy rate"}
                  </div>
                )}
              </div>

              {/* Meal cost */}
              {mealPrice > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {booking.mealOptionName || "Meal plan"} · {guestCount}{" "}
                    guest{guestCount !== 1 ? "s" : ""} × {nights}N
                  </span>
                  <span className="font-medium">₹{fmt(mealPrice)}</span>
                </div>
              )}

              {/* Platform fee */}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Platform Fee</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {platformFee === 0 ? "FREE" : `₹${fmt(platformFee)}`}
                </span>
              </div>

              {/* GST */}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GST</span>
                <span className="font-medium">
                  {gstAmount === 0 ? "₹0" : `₹${fmt(gstAmount)}`}
                </span>
              </div>

              <Separator />

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Amount</span>
                <span className="text-xl font-bold">₹{fmt(totalPrice)}</span>
              </div>

              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 flex items-start gap-2">
                <BadgeCheck className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-green-800 dark:text-green-200">
                    Pay at Hotel — No advance required
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Pay ₹{fmt(totalPrice)} directly to the hotel on check-in. No
                    platform commission charged.
                  </p>
                </div>
              </div>
            </div>

            {/* Cancellation Policy */}
            {cancellationPolicy && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-1">
                    Cancellation Policy
                  </h3>
                  {cancellationPolicy === "flexible" && (
                    <p className="text-xs text-muted-foreground">
                      Free cancellation up to {freeCancellationHours} hours
                      before check-in. After that, the first night is
                      non-refundable.
                    </p>
                  )}
                  {cancellationPolicy === "moderate" && (
                    <p className="text-xs text-muted-foreground">
                      Free cancellation up to {freeCancellationHours} hours
                      before check-in. After that, {property?.partialRefundPercent ?? 50}% refund applies.
                    </p>
                  )}
                  {cancellationPolicy === "strict" && (
                    <p className="text-xs text-muted-foreground">
                      Non-refundable after booking. Contact the property for
                      special circumstances.
                    </p>
                  )}
                  {cancellationPolicy === "custom" &&
                    property?.cancellationPolicy && (
                      <p className="text-xs text-muted-foreground">
                        {property.cancellationPolicy}
                      </p>
                    )}
                </div>
              </>
            )}

            {/* Guest details */}
            <Separator />
            <div>
              <h3 className="text-sm font-semibold mb-2">Guest Details</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Name: </span>
                  {booking.guestName}
                </p>
                <p>
                  <span className="text-muted-foreground">Mobile: </span>
                  {booking.guestMobile}
                </p>
                <p>
                  <span className="text-muted-foreground">Email: </span>
                  {booking.guestEmail}
                </p>
                {booking.specialRequests && (
                  <p>
                    <span className="text-muted-foreground">
                      Special requests:{" "}
                    </span>
                    {booking.specialRequests}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            size="lg"
            onClick={() => setLocation("/my-bookings")}
            className="w-full"
          >
            My Bookings
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          {property && (
            <Button
              size="lg"
              variant="outline"
              onClick={() =>
                setLocation(`/properties/${booking.propertyId}`)
              }
              className="w-full"
            >
              <Phone className="h-4 w-4 mr-2" />
              View Property
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
