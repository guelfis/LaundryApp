import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../baseComponents/Button";
import SectionText from "../baseComponents/SectionText";
import AdminBookingModal from "../bookingModals/AdminBookingModal";
import AggregatedMaintenanceBlock from "../components/AggregatedMaintenanceBlock";
import { LoadingSpinner } from "../baseComponents/LoadingSpinner";
import { useBookingFilters, useUpcomingAdminBookings } from "../hooks/useBookings";
import { aggregateAdminMaintenanceBlocks } from "../utils/slotsUtils"; 

interface AdminDashboardProps {
  householdId: string;
  householdTimezone: string;
  apartmentId: string;
}

export default function AdminDashboard({ apartmentId }: AdminDashboardProps) {
  const { t } = useTranslation();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);

  // 1. Fetch upcoming blocks and filtering policies
  const { data: upcomingBookings = [], isLoading } = useUpcomingAdminBookings();
  const { slotsPolicy } = useBookingFilters();

  // 2. Filter down to admin blockouts only, then run our aggregation algorithm
  const aggregatedBlocks = useMemo(() => {
    return aggregateAdminMaintenanceBlocks(upcomingBookings, slotsPolicy);
  }, [upcomingBookings, slotsPolicy]);

  if (isLoading) {
      return (
        <div className="flex flex-1 items-center justify-center h-[60vh]">
          <LoadingSpinner />
        </div>
      );
    }

  return (
    <div className="flex flex-col gap-6">
      {/* ACTION PANEL */}
      <div className="flex flex-col gap-2">
        <SectionText title={t("adminDashboard.admin_action")} />
        <p className="text-xs text-gray-400 pl-1 mt-1">{t("adminDashboard.block_laundry")}</p>
        {/* TODO: the multi-day booking is broken */}
        <Button 
          onClick={() => setIsAdminModalOpen(true)}
          variant="primary"
          icon="shieldAlert"
          label={t('adminDashboard.btn_admin_block')}
        />
      </div>

      {/* AGGREGATED UPCOMING MAINTENANCE BLOCKS */}
      <AggregatedMaintenanceBlock sectionTitle={t("adminDashboard.next_blocks")} aggregatedBlocks={aggregatedBlocks} />

      {isAdminModalOpen && (
        <AdminBookingModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          bookings={upcomingBookings}
          apartmentId={apartmentId}
        />
      )}
    </div>
  );
}
