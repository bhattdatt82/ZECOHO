import { useEffect, useRef, useCallback } from "react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PropertyUpdateOptions {
  userId?: string;
  onUpdate?: (data: PropertyStatusUpdate) => void;
}

export interface PropertyStatusUpdate {
  type: "property_status_update";
  propertyId: string;
  status: string;
  message: string;
  propertyTitle?: string;
  reason?: string;
}

export function usePropertyUpdates(options: PropertyUpdateOptions = {}) {
  const { userId, onUpdate } = options;
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  const invalidatePropertyQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/owner/properties"] });
    queryClient.invalidateQueries({ queryKey: ["/api/owner/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
  }, []);

  const handlePropertyUpdate = useCallback(
    (data: PropertyStatusUpdate) => {
      invalidatePropertyQueries();

      if (data.propertyId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/properties", data.propertyId],
        });
      }

      if (data.message && data.propertyTitle) {
        const statusMessages: Record<
          string,
          { title: string; variant?: "default" | "destructive" }
        > = {
          published: { title: "Property Approved!" },
          draft: { title: "Property Needs Attention", variant: "destructive" },
          paused: { title: "Property Paused" },
          deactivated: {
            title: "Property Deactivated",
            variant: "destructive",
          },
        };

        const statusInfo = statusMessages[data.status] || {
          title: "Property Updated",
        };

        toast({
          title: statusInfo.title,
          description: data.message,
          variant: statusInfo.variant,
        });
      }

      onUpdate?.(data);
    },
    [invalidatePropertyQueries, onUpdate, toast],
  );

  const connectWebSocket = useCallback(() => {
    if (!userId) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${userId}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[PropertyUpdates] WebSocket connected");
        isConnectedRef.current = true;
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "property_status_update") {
            handlePropertyUpdate(data as PropertyStatusUpdate);
          }
        } catch (e) {
          console.error("[PropertyUpdates] Message parse error:", e);
        }
      };

      ws.onclose = (event) => {
        console.log(
          "[PropertyUpdates] WebSocket closed:",
          event.code,
          event.reason,
        );
        isConnectedRef.current = false;
        wsRef.current = null;

        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            120000,
          );
          reconnectAttemptsRef.current++;

          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(
              `[PropertyUpdates] Reconnecting... attempt ${reconnectAttemptsRef.current}`,
            );
            connectWebSocket();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error("[PropertyUpdates] WebSocket error:", error);
      };
    } catch (error) {
      console.error("[PropertyUpdates] Failed to create WebSocket:", error);
    }
  }, [userId, handlePropertyUpdate]);

  useEffect(() => {
    if (userId) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [userId, connectWebSocket]);

  const refresh = useCallback(() => {
    invalidatePropertyQueries();
  }, [invalidatePropertyQueries]);

  return {
    isConnected: isConnectedRef.current,
    refresh,
  };
}
