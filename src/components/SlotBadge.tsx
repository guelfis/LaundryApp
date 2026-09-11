import { useTranslation } from "react-i18next";
import { SlotStatus } from "../constants/SlotStatus";
import StatusDot from "../baseComponents/StatusDot";

interface SlotBadgeProps {
  status: SlotStatus;
  isLive: boolean;
}

// 1. SHARED STATUS BADGE
export function SlotBadge({ status, isLive }: SlotBadgeProps) {
  const { t } = useTranslation();
  
  if (status === SlotStatus.NOT_RESERVABLE) {
    return (
      <span className="flex items-center gap-1.5 font-bold text-xs px-3 py-1.5 rounded-xl" style={{ backgroundColor: 'var(--ion-color-step-150, #e0e0e0)', color: 'var(--ion-color-step-700, #a6a3a3)' }}>
        <StatusDot color="grey" pulse={isLive} />
        {t('slotStatus.not_reservable')}
      </span>
    );
  }
  if (status === SlotStatus.BOOKED_BY_USER) {
    return (
      <span className="flex items-center gap-1.5 font-bold text-xs px-3 py-1.5 rounded-xl" style={{ backgroundColor: 'rgba(var(--ion-color-primary-rgb), 0.15)', color: 'var(--ion-color-primary)' }}>
        <StatusDot color="blue" pulse={isLive} />
        {t('slotStatus.reserved')}
      </span>
    );
  }
  if (status === SlotStatus.BOOKED) {
    return (
      <span className="flex items-center gap-1.5 font-bold text-xs px-3 py-1.5 rounded-xl" style={{ backgroundColor: 'rgba(var(--ion-color-danger-rgb), 0.15)', color: 'var(--ion-color-danger)' }}>
        <StatusDot color="red" pulse={isLive} />
        {t('slotStatus.booked')}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 font-bold text-xs px-3 py-1.5 rounded-xl" style={{ backgroundColor: 'rgba(var(--ion-color-success-rgb), 0.15)', color: 'var(--ion-color-success)' }}>
      <StatusDot color="green" pulse={isLive} />
      {t('slotStatus.free')}
    </span>
  );
}