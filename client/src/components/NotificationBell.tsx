import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  CheckCheck,
  Calendar,
  CalendarCheck,
  XCircle,
  Star,
  MessageSquare,
  Shield,
  Building2,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/hooks/useNotifications";
import { stopNotificationSound } from "@/hooks/useNotificationSound";
import { useLocation } from "wouter";
import type { Notification } from "@shared/schema";

const INITIAL_LIMIT = 10;
const LOAD_MORE_COUNT = 10;

function timeAgo(date: Date | string | null): string {
  if (!date) return "";
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return then.toLocaleDateString();
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "booking_request":
      return <Calendar className="h-4 w-4 text-orange-500 flex-shrink-0" />;
    case "booking_confirmed":
      return <CalendarCheck className="h-4 w-4 text-green-600 flex-shrink-0" />;
    case "booking_cancelled":
      return <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />;
    case "booking_completed":
      return <CalendarCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />;
    case "review_received":
      return <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />;
    case "message_received":
      return <MessageSquare className="h-4 w-4 text-blue-500 flex-shrink-0" />;
    case "kyc_approved":
      return <Shield className="h-4 w-4 text-green-600 flex-shrink-0" />;
    case "kyc_rejected":
      return <Shield className="h-4 w-4 text-red-500 flex-shrink-0" />;
    case "property_approved":
      return <Building2 className="h-4 w-4 text-green-600 flex-shrink-0" />;
    case "property_rejected":
      return <Building2 className="h-4 w-4 text-red-500 flex-shrink-0" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground flex-shrink-0" />;
  }
}

function getNotificationLink(notification: Notification): string | null {
  if (notification.entityType === "booking" && notification.entityId) {
    return `/my-bookings`;
  }
  if (notification.entityType === "property" && notification.entityId) {
    return `/properties/${notification.entityId}`;
  }
  if (notification.entityType === "conversation" && notification.entityId) {
    return `/messages`;
  }
  if (notification.entityType === "review" && notification.entityId) {
    return `/owner/reviews`;
  }
  return null;
}

function NotificationItem({
  notification,
  onClick,
  onVisible,
}: {
  notification: Notification;
  onClick: () => void;
  onVisible: (id: string) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (notification.isRead) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onVisible(notification.id);
          observer.disconnect();
        }
      },
      { threshold: 0.8 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [notification.id, notification.isRead, onVisible]);

  const link = getNotificationLink(notification);

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`w-full text-left px-4 py-3 flex gap-3 items-start transition-colors hover-elevate active-elevate-2 ${
        !notification.isRead ? "bg-primary/5" : ""
      }`}
      data-testid={`notification-item-${notification.id}`}
    >
      <div className="mt-0.5 h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm leading-tight ${
              !notification.isRead ? "font-semibold" : "font-normal"
            }`}
            data-testid={`text-notification-title-${notification.id}`}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {notification.body}
        </p>
        <span className="text-[11px] text-muted-foreground mt-1 block">
          {timeAgo(notification.createdAt)}
        </span>
      </div>
    </button>
  );
}

export function NotificationBell() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [visibleCount, setVisibleCount] = useState(INITIAL_LIMIT);
  const listRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef(unreadCount);

  const visibleNotifications = notifications.slice(0, visibleCount);
  const hasMore = notifications.length > visibleCount;

  useEffect(() => {
    if (open) {
      stopNotificationSound();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (
      unreadCount > prevUnreadRef.current &&
      open &&
      listRef.current
    ) {
      listRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount, open]);

  const handleVisible = useCallback(
    (id: string) => {
      if (open) {
        markAsRead(id);
      }
    },
    [open, markAsRead]
  );

  const handleNotificationClick = (notification: Notification) => {
    stopNotificationSound();
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    const link = getNotificationLink(notification);
    if (link) {
      setLocation(link);
      setOpen(false);
    }
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + LOAD_MORE_COUNT);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(true)}
        data-testid="button-notification-bell"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs rounded-full"
            data-testid="badge-notification-count"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50" data-testid="panel-notifications">
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setOpen(false)}
            data-testid="notification-overlay"
          />

          <div
            className={
              "absolute bg-background shadow-lg flex flex-col " +
              "inset-0 md:inset-y-0 md:left-0 md:right-auto md:w-[400px] md:border-r " +
              "animate-in slide-in-from-left duration-300"
            }
          >
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b flex-shrink-0 sticky top-0 bg-background z-10">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-semibold" data-testid="text-notification-header">
                  Notifications
                </h4>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} unread
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAllAsRead()}
                    className="text-xs"
                    data-testid="button-mark-all-read"
                  >
                    <CheckCheck className="h-3.5 w-3.5 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  data-testid="button-close-notifications"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div
              ref={listRef}
              className="flex-1 overflow-y-auto overscroll-contain"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {isLoading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : visibleNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4" data-testid="text-no-notifications">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Bell className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    No notifications yet
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    You'll see booking updates, messages, and alerts here
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {visibleNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                      onVisible={handleVisible}
                    />
                  ))}

                  {hasMore && (
                    <div className="p-4 flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLoadMore}
                        data-testid="button-load-more-notifications"
                      >
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Load more
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
