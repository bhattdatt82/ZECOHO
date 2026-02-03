import webpush from 'web-push';
import { storage } from '../storage';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEQoTPsYLZBe-sHxwi_pQzUhpZy-cYxXOvBMYgTbZ5dAWVx_D6DwNtMYN3nnuN0AJHyJWnGDyVbXEKHl4xA3Huc';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@zecoho.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    [key: string]: any;
  };
  actions?: { action: string; title: string }[];
  requireInteraction?: boolean;
}

export async function sendPushNotification(userId: string, payload: PushPayload): Promise<void> {
  if (!VAPID_PRIVATE_KEY) {
    console.log('[Push] VAPID private key not configured, skipping push notification');
    return;
  }

  try {
    const subscriptions = await storage.getPushSubscriptions(userId);
    
    if (subscriptions.length === 0) {
      console.log(`[Push] No subscriptions found for user ${userId}`);
      return;
    }

    const payloadString = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/favicon.ico',
      badge: payload.badge || '/favicon.ico',
      tag: payload.tag || 'zecoho-notification',
      data: payload.data || { url: '/' },
      actions: payload.actions || [],
      requireInteraction: payload.requireInteraction || false,
    });

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payloadString
        );
        console.log(`[Push] Sent notification to user ${userId}`);
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`[Push] Subscription expired, removing: ${sub.endpoint.substring(0, 50)}...`);
          await storage.deletePushSubscription(sub.endpoint);
        } else {
          console.error(`[Push] Error sending notification:`, error.message);
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error('[Push] Error sending push notification:', error);
  }
}

export async function sendBookingPush(
  userId: string, 
  type: 'new_booking' | 'booking_confirmed' | 'booking_cancelled' | 'booking_rejected',
  propertyName: string,
  bookingId: string
) {
  const configs = {
    new_booking: {
      title: 'New Booking Request',
      body: `You have a new booking request for ${propertyName}`,
      url: `/owner/bookings?highlight=${bookingId}`,
    },
    booking_confirmed: {
      title: 'Booking Confirmed',
      body: `Your booking at ${propertyName} has been confirmed`,
      url: `/bookings?highlight=${bookingId}`,
    },
    booking_cancelled: {
      title: 'Booking Cancelled',
      body: `A booking at ${propertyName} has been cancelled`,
      url: `/owner/bookings?highlight=${bookingId}`,
    },
    booking_rejected: {
      title: 'Booking Not Available',
      body: `Your booking request at ${propertyName} could not be accommodated`,
      url: `/bookings?highlight=${bookingId}`,
    },
  };

  const config = configs[type];
  await sendPushNotification(userId, {
    title: config.title,
    body: config.body,
    tag: `booking-${bookingId}`,
    data: { url: config.url, bookingId },
    requireInteraction: type === 'new_booking',
  });
}

export async function sendMessagePush(
  userId: string,
  senderName: string,
  conversationId: string,
  messagePreview: string
) {
  await sendPushNotification(userId, {
    title: `New message from ${senderName}`,
    body: messagePreview.length > 100 ? messagePreview.substring(0, 97) + '...' : messagePreview,
    tag: `message-${conversationId}`,
    data: { url: `/messages/${conversationId}`, conversationId },
  });
}

export async function sendReviewPush(
  ownerId: string,
  guestName: string,
  propertyName: string,
  rating: number,
  reviewId: string
) {
  await sendPushNotification(ownerId, {
    title: 'New Review Received',
    body: `${guestName} left a ${rating}-star review for ${propertyName}`,
    tag: `review-${reviewId}`,
    data: { url: `/owner/reviews`, reviewId },
  });
}

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}
