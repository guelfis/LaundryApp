import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { resolveCurrentUserId } from '../auth/authUtils';
import { useTravelingInfo } from '../utils/travelingUtils';
import PageLayout from '../baseComponents/PageLayout';
import { TravelingBanner } from '../components/TravelingBanner';
import { PageHeader } from '../baseComponents/PageHeader';
import { ROUTES } from '../routes/routes.constants';
import { useBookingFilters } from '../hooks/useBookings';
import UserDashboard from './UserDashboard';
import AdminDashboard from './AdminDashboard';



export default function DashboardBase() {
  const { householdId, householdTimezone, apartmentId, isAdminMode } = useBookingFilters();
  const history = useHistory();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    resolveCurrentUserId().then((id) => setCurrentUserId(id));
  }, []);

  const travelingStatus = useTravelingInfo(householdTimezone);

  return (
    <PageLayout 
      header={
        <PageHeader 
          title="Dashboard"
          icon={<LayoutDashboard className="w-7 h-7 text-blue-500" />} 
          onBack={() => history.push(ROUTES.APARTMENT_LOGIN)} 
        />
      }
    >
      <div className="w-full px-4 py-2 flex flex-col gap-6 flex-1 overflow-y-auto">
        {/* Common Global Elements */}
        {travelingStatus.isTraveling && (
          <TravelingBanner userTz={travelingStatus.userTimezone} buildingTz={householdTimezone} />
        )}

        {/* Dynamic Panel Dispatcher */}
        {isAdminMode ? (
          <AdminDashboard
            householdId={householdId}
            householdTimezone={householdTimezone}
            apartmentId={apartmentId}
          />
        ) : ( 
          <UserDashboard
            householdId={householdId}
            householdTimezone={householdTimezone}
            apartmentId={apartmentId}
            currentUserId={currentUserId}
          />
        )}
      </div>
    </PageLayout>
  );
}
