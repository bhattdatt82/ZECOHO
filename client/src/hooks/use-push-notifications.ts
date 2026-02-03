import { useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | 'default';
  isLoading: boolean;
  error: string | null;
  checkedInitial: boolean;
}

const AUTO_SUBSCRIBE_KEY = 'zecoho_push_auto_subscribed';

export function usePushNotifications(autoSubscribe: boolean = false) {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    isLoading: false,
    error: null,
    checkedInitial: false,
  });
  const autoSubscribeAttempted = useRef(false);

  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
      
      if (!isSupported) {
        setState(prev => ({ ...prev, isSupported: false, checkedInitial: true }));
        return;
      }

      const permission = Notification.permission;
      let isSubscribed = false;

      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          isSubscribed = !!subscription;
        }
      } catch (error) {
        console.error('[Push] Error checking subscription:', error);
      }

      setState(prev => ({
        ...prev,
        isSupported,
        permission,
        isSubscribed,
        checkedInitial: true,
      }));
    };

    checkSupport();
  }, []);

  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported');
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    return registration;
  }, []);

  const subscribe = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        setState(prev => ({
          ...prev,
          isLoading: false,
          permission,
          error: 'Notification permission denied',
        }));
        return false;
      }

      const registration = await registerServiceWorker();

      const vapidResponse = await fetch('/api/push/vapid-key');
      const { publicKey } = await vapidResponse.json();

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const subscriptionJson = subscription.toJSON();
      
      await apiRequest('POST', '/api/push/subscribe', {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscriptionJson.keys?.p256dh,
          auth: subscriptionJson.keys?.auth,
        },
      });

      setState(prev => ({
        ...prev,
        isLoading: false,
        isSubscribed: true,
        permission: 'granted',
      }));

      return true;
    } catch (error: any) {
      console.error('[Push] Subscription error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to subscribe to push notifications',
      }));
      return false;
    }
  }, [registerServiceWorker]);

  const unsubscribe = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await apiRequest('POST', '/api/push/unsubscribe', {
            endpoint: subscription.endpoint,
          });
          await subscription.unsubscribe();
        }
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        isSubscribed: false,
      }));

      return true;
    } catch (error: any) {
      console.error('[Push] Unsubscribe error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to unsubscribe',
      }));
      return false;
    }
  }, []);

  // Auto-subscribe effect for logged-in users
  useEffect(() => {
    const attemptAutoSubscribe = async () => {
      // Only auto-subscribe if:
      // 1. Auto-subscribe is enabled
      // 2. Initial check is complete
      // 3. Push is supported
      // 4. Not already subscribed
      // 5. Haven't already attempted (to avoid loops)
      // 6. Permission is not denied
      if (
        autoSubscribe &&
        state.checkedInitial &&
        state.isSupported &&
        !state.isSubscribed &&
        !autoSubscribeAttempted.current &&
        state.permission !== 'denied'
      ) {
        // Check if we've already attempted auto-subscribe for this user
        const alreadyAttempted = localStorage.getItem(AUTO_SUBSCRIBE_KEY);
        if (alreadyAttempted) {
          autoSubscribeAttempted.current = true;
          return;
        }

        autoSubscribeAttempted.current = true;
        localStorage.setItem(AUTO_SUBSCRIBE_KEY, 'true');
        
        // Attempt to subscribe
        console.log('[Push] Auto-subscribing user to push notifications...');
        await subscribe();
      }
    };

    attemptAutoSubscribe();
  }, [autoSubscribe, state.checkedInitial, state.isSupported, state.isSubscribed, state.permission, subscribe]);

  return {
    ...state,
    subscribe,
    unsubscribe,
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
