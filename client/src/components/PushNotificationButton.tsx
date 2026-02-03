import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PushNotificationButtonProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function PushNotificationButton({ 
  variant = 'ghost', 
  size = 'icon',
  showLabel = false,
}: PushNotificationButtonProps) {
  const { toast } = useToast();
  const {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  if (!isSupported) {
    return null;
  }

  const handleClick = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast({
          title: 'Notifications disabled',
          description: 'You will no longer receive push notifications',
        });
      }
    } else {
      const success = await subscribe();
      if (success) {
        toast({
          title: 'Notifications enabled',
          description: 'You will now receive push notifications for bookings and messages',
        });
      } else if (permission === 'denied') {
        toast({
          title: 'Notifications blocked',
          description: 'Please enable notifications in your browser settings',
          variant: 'destructive',
        });
      }
    }
  };

  const buttonContent = (
    <>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="h-4 w-4" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
      {showLabel && (
        <span className="ml-2">
          {isSubscribed ? 'Notifications On' : 'Enable Notifications'}
        </span>
      )}
    </>
  );

  if (size === 'icon') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleClick}
            disabled={isLoading}
            data-testid="button-push-notifications"
          >
            {buttonContent}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isSubscribed ? 'Disable notifications' : 'Enable notifications'}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      data-testid="button-push-notifications"
    >
      {buttonContent}
    </Button>
  );
}
