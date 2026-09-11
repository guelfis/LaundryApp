import MonthSwitcher from '../components/MonthSwitcher';
import { useBookingFilters } from '../hooks/useBookings';
import { useTranslation } from 'react-i18next';
import PageLayout from '../baseComponents/PageLayout';
import { PageHeader } from '../baseComponents/PageHeader';
import { Calendar } from 'lucide-react';
import { ROUTES } from '../routes/routes.constants';
import { useHistory } from 'react-router-dom';
import CalendarGrid from '../components/CalendarGrid';


export default function CalendarGridTab() {
  const history = useHistory();
  const { t } = useTranslation();
  
  const { viewDate, setViewDate } = useBookingFilters();
  const activeMonth = viewDate.getMonth();

  const handleSetMonth = (step: number) => {
    const newDate = new Date(viewDate);
    
    // Safety check: Anchor layout to the 1st of the month to dodge month-skipping calculation errors
    newDate.setDate(1);
    
    // Add the relative step to the current month integer value.
    // e.g., 11 (December) + 1 becomes 12. JavaScript natively interprets month 12 as 
    // January of the NEXT year, automatically bumping activeYear to 2027!
    newDate.setMonth(newDate.getMonth() + step);
    
    setViewDate(newDate);
  };

  const onBack = () => {
    history.push(ROUTES.APARTMENT_LOGIN);
  };

  return (
    <PageLayout 
      scrollable={false}
      header={
        <PageHeader 
          title={t('dashboard.calendar')} 
          icon={<Calendar className="w-7 h-7 text-blue-500" />} 
          onBack={onBack} 
        />
      }
    >
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', flex: 1, minHeight: 0 }}>
      {/* Month Switcher Header */}
      <div style={{ flexShrink: 0 }}>
        <MonthSwitcher activeMonth={activeMonth} onNavigate={handleSetMonth} />
      </div>
      <CalendarGrid activeMonth={activeMonth} viewDate={viewDate} />
            
    </div>
    </PageLayout>
  );
}
