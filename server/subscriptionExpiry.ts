import { db } from "./db";
import { ownerSubscriptions, users, properties } from "@shared/schema";
import { eq, and, lte, gte, sql } from "drizzle-orm";
import { storage } from "./storage";
import { broadcastToUser } from "./routes";
import { createNotification } from "./services/notificationService";

// ── Email helpers ──────────────────────────────────────────────────────────
async function sendExpiryWarningEmail(
  email: string,
  firstName: string,
  planName: string,
  daysLeft: number,
  endDate: Date,
): Promise<void> {
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || "ZECOHO <onboarding@resend.dev>";
    const endDateStr = endDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const isExpiring = daysLeft === 0;

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: isExpiring
        ? `⚠️ Your ZECOHO subscription expires TODAY`
        : `⚠️ Your ZECOHO subscription expires in ${daysLeft} days`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${isExpiring ? "#dc2626" : "#f59e0b"}; padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">ZECOHO</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 4px 0 0;">Subscription ${isExpiring ? "Expiring Today" : "Expiry Notice"}</p>
          </div>
          <div style="background: #fff; border: 1px solid #e0e0e0; border-top: none; padding: 28px; border-radius: 0 0 8px 8px;">
            <p style="color: #333;">Dear <strong>${firstName}</strong>,</p>
            ${
              isExpiring
                ? `<p style="color: #dc2626; font-weight: bold;">Your ${planName} subscription expires TODAY (${endDateStr}).</p>
                 <p style="color: #555;">Your properties will be hidden from search results and no new bookings will be accepted after today.</p>`
                : `<p style="color: #555;">Your <strong>${planName}</strong> subscription will expire on <strong>${endDateStr}</strong> (${daysLeft} days from now).</p>
                 <p style="color: #555;">Please renew your subscription to keep your properties visible and continue receiving bookings.</p>`
            }
            <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="color: #92400e; margin: 0; font-weight: 500;">What happens when subscription expires:</p>
              <ul style="color: #a16207; margin: 8px 0 0; padding-left: 20px; font-size: 14px;">
                <li>Your properties will be hidden from search</li>
                <li>No new bookings will be accepted</li>
                <li>Existing bookings will not be affected</li>
              </ul>
            </div>
            <div style="text-align: center; margin-top: 24px;">
              <a href="https://www.zecoho.com/owner/subscription" 
                 style="background: #E67E22; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Renew Subscription Now
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            <p style="color: #aaa; font-size: 11px; text-align: center;">
              ZECOHO TECHNOLOGIES PRIVATE LIMITED | GSTIN: 09AACCZ8890L1ZC
            </p>
          </div>
        </div>
      `,
    });
    console.log(
      `[EXPIRY] Warning email sent to ${email} (${daysLeft} days left)`,
    );
  } catch (error) {
    console.error("[EXPIRY] Failed to send warning email:", error);
  }
}

// ── Main expiry check function ─────────────────────────────────────────────
export async function checkSubscriptionExpiry(): Promise<void> {
  console.log("[EXPIRY] Running subscription expiry check...");

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const twoDaysFromNow = new Date(today);
  twoDaysFromNow.setDate(today.getDate() + 2);
  twoDaysFromNow.setHours(23, 59, 59, 999);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  try {
    // Get all active subscriptions
    const activeSubs = await db
      .select()
      .from(ownerSubscriptions)
      .where(eq(ownerSubscriptions.status, "active"));

    for (const sub of activeSubs) {
      if (!sub.endDate) continue;

      const endDate = new Date(sub.endDate);
      endDate.setHours(23, 59, 59, 999);

      const daysLeft = Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      const owner = await storage.getUser(sub.ownerId);
      if (!owner) continue;

      // ── EXPIRED — hide properties ─────────────────────────────────────
      if (daysLeft < 0) {
        console.log(
          `[EXPIRY] Subscription expired for ${owner.email} — hiding properties`,
        );

        // Mark subscription as expired
        await db
          .update(ownerSubscriptions)
          .set({ status: "expired" })
          .where(eq(ownerSubscriptions.id, sub.id));

        // Hide all published properties
        const ownerProperties = await storage.getProperties({
          ownerId: sub.ownerId,
          includeAllStatuses: true,
        });

        for (const property of ownerProperties) {
          if (property.status === "published") {
            await storage.updateProperty(property.id, {
              status: "paused",
            });
            console.log(`[EXPIRY] Property "${property.title}" paused`);
          }
        }

        // Notify owner
        broadcastToUser(sub.ownerId, {
          type: "subscription_expired",
          message:
            "Your subscription has expired. Your properties have been paused. Please renew to go live again.",
        });

        await createNotification({
          userId: sub.ownerId,
          title: "Subscription Expired",
          body: "Your subscription has expired. Your properties are now paused. Renew now to continue receiving bookings.",
          type: "subscription_expired",
          entityId: sub.id,
          entityType: "subscription",
        });

        continue;
      }

      // ── 2 DAYS WARNING ───────────────────────────────────────────────
      if (daysLeft === 2) {
        console.log(`[EXPIRY] 2-day warning for ${owner.email}`);
        if (owner.email) {
          const planName = (sub as any).planName || "Subscription";
          await sendExpiryWarningEmail(
            owner.email,
            owner.firstName || "Property Owner",
            planName,
            2,
            endDate,
          );
        }

        await createNotification({
          userId: sub.ownerId,
          title: "Subscription Expiring Soon",
          body: "Your subscription expires in 2 days. Renew now to keep your properties visible.",
          type: "subscription_expiring",
          entityId: sub.id,
          entityType: "subscription",
        });

        broadcastToUser(sub.ownerId, {
          type: "subscription_expiring",
          daysLeft: 2,
          message: "Your subscription expires in 2 days!",
        });
      }

      // ── EXPIRY DAY WARNING ────────────────────────────────────────────
      if (daysLeft === 0) {
        console.log(`[EXPIRY] Expiry day warning for ${owner.email}`);
        if (owner.email) {
          const planName = (sub as any).planName || "Subscription";
          await sendExpiryWarningEmail(
            owner.email,
            owner.firstName || "Property Owner",
            planName,
            0,
            endDate,
          );
        }

        await createNotification({
          userId: sub.ownerId,
          title: "Subscription Expires Today!",
          body: "Your subscription expires today. Renew immediately to avoid your properties being paused.",
          type: "subscription_expiring",
          entityId: sub.id,
          entityType: "subscription",
        });

        broadcastToUser(sub.ownerId, {
          type: "subscription_expiring",
          daysLeft: 0,
          message: "Your subscription expires today! Please renew now.",
        });
      }
    }

    console.log("[EXPIRY] Check complete");
  } catch (error) {
    console.error("[EXPIRY] Error during expiry check:", error);
  }
}
