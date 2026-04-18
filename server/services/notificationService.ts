import { db } from "../db";
import { notifications } from "@shared/schema";
import type { InsertNotification } from "@shared/schema";

type NotificationType =
  | "booking_request"
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_completed"
  | "review_received"
  | "message_received"
  | "kyc_approved"
  | "kyc_rejected"
  | "property_approved"
  | "property_rejected"
  | "property_pending"
  | "subscription_expired"
  | "subscription_expiring"
  | "system";

interface CreateNotificationParams {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  entityId?: string;
  entityType?: string;
}

export async function createNotification({
  userId,
  title,
  body,
  type,
  entityId,
  entityType,
}: CreateNotificationParams) {
  const [notification] = await db
    .insert(notifications)
    .values({
      userId,
      title,
      body,
      type,
      entityId: entityId || null,
      entityType: entityType || null,
      isRead: false,
    })
    .returning();

  return notification;
}

export async function createBookingNotification(
  ownerId: string,
  bookingId: string,
  guestName: string,
  propertyName: string,
  type: "booking_request" | "booking_confirmed" | "booking_cancelled" | "booking_completed"
) {
  const titles: Record<string, string> = {
    booking_request: "New Booking Request",
    booking_confirmed: "Booking Confirmed",
    booking_cancelled: "Booking Cancelled",
    booking_completed: "Booking Completed",
  };

  const bodies: Record<string, string> = {
    booking_request: `${guestName} has requested to book ${propertyName}`,
    booking_confirmed: `Booking at ${propertyName} has been confirmed`,
    booking_cancelled: `${guestName} has cancelled their booking at ${propertyName}`,
    booking_completed: `${guestName}'s stay at ${propertyName} has been completed`,
  };

  return createNotification({
    userId: ownerId,
    title: titles[type],
    body: bodies[type],
    type,
    entityId: bookingId,
    entityType: "booking",
  });
}

export async function createReviewNotification(
  ownerId: string,
  reviewId: string,
  guestName: string,
  propertyName: string,
  rating: number
) {
  return createNotification({
    userId: ownerId,
    title: "New Review Received",
    body: `${guestName} left a ${rating}-star review for ${propertyName}`,
    type: "review_received",
    entityId: reviewId,
    entityType: "review",
  });
}

export async function createMessageNotification(
  userId: string,
  conversationId: string,
  senderName: string
) {
  return createNotification({
    userId,
    title: "New Message",
    body: `You have a new message from ${senderName}`,
    type: "message_received",
    entityId: conversationId,
    entityType: "conversation",
  });
}

export async function createKycNotification(
  userId: string,
  status: "approved" | "rejected",
  reason?: string
) {
  const type = status === "approved" ? "kyc_approved" : "kyc_rejected";
  const title = status === "approved" ? "KYC Approved" : "KYC Rejected";
  const body = status === "approved"
    ? "Your KYC verification has been approved. You can now list properties."
    : `Your KYC verification was rejected. ${reason || "Please resubmit with valid documents."}`;

  return createNotification({
    userId,
    title,
    body,
    type,
  });
}

export async function createPropertyNotification(
  ownerId: string,
  propertyId: string,
  propertyName: string,
  status: "approved" | "rejected",
  reason?: string
) {
  const type = status === "approved" ? "property_approved" : "property_rejected";
  const title = status === "approved" ? "Property Approved" : "Property Rejected";
  const body = status === "approved"
    ? `Your property "${propertyName}" has been approved and is now live.`
    : `Your property "${propertyName}" was rejected. ${reason || "Please review and resubmit."}`;

  return createNotification({
    userId: ownerId,
    title,
    body,
    type,
    entityId: propertyId,
    entityType: "property",
  });
}
