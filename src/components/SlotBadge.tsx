import { useTranslation } from "react-i18next";
import { SlotStatus } from "../constants/SlotStatus";
import StatusDot, { StatusDotProps } from "../baseComponents/StatusDot";

interface SlotBadgeProps {
  status: SlotStatus;
  isLive: boolean;
}

// 1. SHARED STATUS BADGE
export function SlotBadge({ status, isLive }: SlotBadgeProps) {
  const { t } = useTranslation();

  const configurations: Record<SlotStatus, { 
    color: StatusDotProps['color']; 
    text: string; 
    backgroundColor: string; 
  }>= {
    [SlotStatus.BOOKED_BY_USER]: {
      color: "blue",
      text: t("slotStatus.reserved"),
      backgroundColor: "rgba(var(--ion-color-primary-rgb), 0.15)",
    },
    [SlotStatus.OVERRIDDEN]: {
      color: "red",
      text: t("slotStatus.overridden"),
      backgroundColor: "rgba(var(--ion-color-danger-rgb), 0.15)",
    },
    [SlotStatus.BOOKED]: {
      color: "red",
      text: t("slotStatus.booked"),
      backgroundColor: "rgba(var(--ion-color-danger-rgb), 0.15)",
    },
    [SlotStatus.NOT_RESERVABLE]: {
      color: "grey",
      text: t("slotStatus.not_reservable"),
      backgroundColor: "var(--ion-color-step-150, #e0e0e0)",
    },
    [SlotStatus.AVAILABLE]: {
      color: "green",
      text: t("slotStatus.free"),
      backgroundColor: "rgba(var(--ion-color-success-rgb), 0.15)",
    },
    [SlotStatus.RELEASED]: {
      color: "green",
      text: t("slotStatus.free"),
      backgroundColor: "rgba(var(--ion-color-success-rgb), 0.15)",
    },
    // this should never happen, just for completeness sake
    [SlotStatus.AFTER_HOURS]: {
      color: "grey",
      text: t("slotStatus.not_reservable"),
      backgroundColor: "var(--ion-color-step-150, #e0e0e0)",
    },
  };
  return (
    <span className="flex items-center gap-1.5 font-bold text-xs px-3 py-1.5 rounded-xl" style={{ backgroundColor: configurations[status]?.backgroundColor, color: configurations[status]?.color }}>
      <StatusDot color={configurations[status].color} pulse={isLive} />
      {configurations[status].text}
    </span>
  );
}