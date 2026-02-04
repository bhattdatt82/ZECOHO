import { useCallback } from "react";

const STORAGE_KEY = "zecoho_pre_login_booking";

export interface PreLoginBookingData {
  propertyId: string;
  propertyTitle?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  rooms?: number;
  selectedRoomTypeId?: string | null;
  selectedMealOptionId?: string | null;
  savedAt: number;
}

export function usePreLoginBooking() {
  const saveBookingIntent = useCallback((data: Omit<PreLoginBookingData, "savedAt">) => {
    if (typeof window === "undefined") return;
    
    const bookingData: PreLoginBookingData = {
      ...data,
      savedAt: Date.now(),
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookingData));
  }, []);

  const getBookingIntent = useCallback((): PreLoginBookingData | null => {
    if (typeof window === "undefined") return null;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      
      const data = JSON.parse(stored) as PreLoginBookingData;
      
      const oneHour = 60 * 60 * 1000;
      if (Date.now() - data.savedAt > oneHour) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      
      return data;
    } catch {
      return null;
    }
  }, []);

  const clearBookingIntent = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const hasBookingIntent = useCallback((): boolean => {
    return getBookingIntent() !== null;
  }, [getBookingIntent]);

  const getRedirectUrl = useCallback((): string | null => {
    const data = getBookingIntent();
    if (!data) return null;
    
    const params = new URLSearchParams();
    if (data.checkIn) params.set("checkIn", data.checkIn);
    if (data.checkOut) params.set("checkOut", data.checkOut);
    if (data.adults) params.set("adults", data.adults.toString());
    if (data.children !== undefined) params.set("children", data.children.toString());
    if (data.rooms) params.set("rooms", data.rooms.toString());
    if (data.selectedRoomTypeId) params.set("roomType", data.selectedRoomTypeId);
    if (data.selectedMealOptionId) params.set("mealOption", data.selectedMealOptionId);
    
    const queryString = params.toString();
    return `/properties/${data.propertyId}${queryString ? `?${queryString}` : ""}`;
  }, [getBookingIntent]);

  return {
    saveBookingIntent,
    getBookingIntent,
    clearBookingIntent,
    hasBookingIntent,
    getRedirectUrl,
  };
}
