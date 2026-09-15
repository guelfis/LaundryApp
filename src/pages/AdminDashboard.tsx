import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../baseComponents/Button";
import SectionText from "../baseComponents/SectionText";
import AdminBookingModal from "../bookingModals/AdminBookingModal";
import { LoadingSpinner } from "../baseComponents/LoadingSpinner";
import { useUpcomingBookings } from "../hooks/useBookings";

interface AdminDashboardProps {
  householdId: string;
  householdTimezone: string;
  apartmentId: string;
}

export default function AdminDashboard({ apartmentId }: AdminDashboardProps) {
  const { t } = useTranslation();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);

  const { data: upcomingBookings = [], isLoading } = useUpcomingBookings(apartmentId);
  

   if (isLoading) {
      return (
        <div className="flex flex-1 items-center justify-center h-[60vh]">
          <LoadingSpinner />
        </div>
      );
    }
  
   return (
    <div className="flex flex-col gap-6">

      <div className="flex flex-col gap-2">
        <SectionText title={t("adminDashboard.admin_action")} />
        <p className="text-xs text-gray-400 pl-1 mt-1">{t("adminDashboard.block_laundry")}</p>
        <Button 
          onClick={() => setIsAdminModalOpen(true)}
          variant="primary"
          icon="shieldAlert"
          label={t('adminDashboard.btn_admin_block')}
        />
      </div>

      {// TODO: Add a list of upcoming bookings for the admin to see and manage
      }
      
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