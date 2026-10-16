import { BellOff, Loader2 } from "lucide-react";
import { useNotificationStatus } from "../hooks/useNotificationStatus";
import { useTranslation } from "react-i18next";
import { BaseInlineBanner } from "../baseComponents/BaseInlineBanner";

interface NotificationBannerProps {
  profileId: string;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({ profileId }) => {
  const { t } = useTranslation();
  const { isDeviceEnabled, isLoading, isRequesting, enableNotifications } = useNotificationStatus(profileId);

  if (isLoading || isDeviceEnabled) return null;

  return (
    <BaseInlineBanner
      variant="amber"
      icon={<BellOff className="w-4 h-4" />} // Smaller icon
      title={t("notificationsBanner.title", "Notifications Disabled")}
      description={t("notificationsBanner.description", "")}
      action={
        <button
          onClick={enableNotifications}
          disabled={isRequesting}
          className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:opacity-80 active:opacity-60 transition-opacity disabled:opacity-50 flex items-center gap-1"
        >
          {isRequesting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            t("notificationsBanner.enable_btn", "Enable")
          )}
        </button>
      }
    />
  );
}
