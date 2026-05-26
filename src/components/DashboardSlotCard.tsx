import { useTranslation } from 'react-i18next';
import { SlotStatus } from '../constants/SlotStatus';
import SlotCard from './SlotCard';
import { CalendarClock } from 'lucide-react';

interface DashboardSlotCardProps {
  state: SlotStatus;
  onClick?: () => void;
}

export default function DashboardSlotCard({
  state,
  onClick,
}: DashboardSlotCardProps) {
  const { t } = useTranslation();

  const configurations = {
    [SlotStatus.BOOKED_BY_USER]: {
      iconColor: "text-blue-500",
      badgeText: t("dashboardSlotCard.your_session"),
      descText: t("dashboardSlotCard.your_session_desc"),
      containerClass: "bg-green-50/60 dark:bg-green-950/10 border-green-200 dark:border-green-900/40"
    },
    [SlotStatus.BOOKED]: {
      iconColor: "text-red-500",
      badgeText: t("dashboardSlotCard.slot_occupied"),
      descText: t("dashboardSlotCard.slot_occupied_desc"),
      containerClass: "bg-red-50/50 dark:bg-red-950/10 border-red-100 dark:border-red-900/30"
    },
    [SlotStatus.AVAILABLE]: {
      iconColor: "text-green-500",
      badgeText: t("dashboardSlotCard.laundry_free"),
      descText: t("dashboardSlotCard.laundry_free_desc"),
      containerClass: "bg-gray-50 dark:bg-slate-800/40 border-gray-100 dark:border-slate-800"
    },
    [SlotStatus.RELEASED]: {
      iconColor: "text-green-500",
      badgeText: t("dashboardSlotCard.laundry_free"),
      descText: t("dashboardSlotCard.laundry_free_desc"),
      containerClass: "bg-gray-50 dark:bg-slate-800/40 border-gray-100 dark:border-slate-800"
    },
    [SlotStatus.NOT_RESERVABLE]: {
      iconColor: "text-gray-500",
      badgeText: t("dashboardSlotCard.afterHour"),
      descText: t("dashboardSlotCard.afterHour_desc"),
      containerClass: "bg-gray-100/70 dark:bg-slate-900/40 border-gray-200 dark:border-slate-800 opacity-70"
    }
  };

  const config = configurations[state];

  return (
    <SlotCard
      icon={<CalendarClock className="w-5 h-5 text-blue-500"/>}
      title={config.badgeText}
      subtitle={config.descText}
      containerClass={config.containerClass}
      onClick={onClick}
    />
  );
}
