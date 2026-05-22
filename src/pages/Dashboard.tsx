import CalendarGridTab from './CalendarGridTab';
import { useEffect, useMemo, useState } from 'react';
import PageLayout from '../components/PageLayout';
import { PageHeader } from '../components/PageHeader';
import { Calendar, Home, LayoutDashboard } from 'lucide-react';
import MyApartmentTab from './MyApartmentTab';
import { usePendingRequests,useApartmentMembers } from '../useApartments'; // Ensure correct path
import { checkIsAdmin, getCleanStorageItem, resolveCurrentUserId } from '../auth/authUtils';
import { Navigate, Routes, Link, Route, useNavigate } from 'react-router-dom';
import MyDashboard from './MyDashboard';
import { useTranslation } from 'react-i18next';



function Dashboard() {

  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Safely extract the active session context
  const apartmentId = useMemo(() => getCleanStorageItem('apartmentId') || '', []);
  // Resolve user ID natively on mount
      useEffect(() => {
          resolveCurrentUserId().then(id => setCurrentUserId(id));
      }, []);

  // These hooks will now SHARE the exact same cache data with MyApartmentTab
  const { data: members = [] } = useApartmentMembers(apartmentId);
  const { data: requests = [] } = usePendingRequests(apartmentId);
  
  // Logical checks
  const isUserAdmin = useMemo(() => checkIsAdmin(members, currentUserId), [members, currentUserId]);  const hasNotifications = isUserAdmin && Array.isArray(requests) && requests.length > 0;

  const renderHeader = () => {
    if (location.pathname.includes('/dashboard/apartment')) {
      return <PageHeader title={t('dashboard.your_apartment')} icon={<Home className="w-7 h-7 text-blue-500" />} onBack={() => navigate('/apartment-login')}/>;
    }
    if(location.pathname.includes('/dashboard/calendar')) {
      return <PageHeader title={t('dashboard.calendar')} icon={<Calendar className="w-7 h-7 text-blue-500" />} onBack={() => navigate('/apartment-login')} />;
    }
    return <PageHeader title="Dashboard" icon={<LayoutDashboard className="w-7 h-7 text-blue-500" />} onBack={() => navigate('/apartment-login')} />;
  };

  return (
    <PageLayout 
      header={renderHeader()} 
      footer={
        <footer className="flex h-18 border-t border-[#b8cbe0] dark:border-slate-700 bg-[#dce8f5] dark:bg-slate-900 shrink-0 pb-[env(safe-area-inset-bottom)]">
          <nav className="flex w-full" aria-label="Footer Navigation">
            <Link 
              to="/dashboard" // Base dashboard URL maps to the calendar index
              className={`flex flex-col items-center justify-center gap-1 flex-1 text-sm border-none border-r border-[#b8cbe0] dark:border-slate-700 transition-colors
                ${location.pathname === '/dashboard'
                  ? 'bg-[#cbdcf0] dark:bg-slate-800 text-gray-900 dark:text-white font-bold' 
                  : 'bg-transparent text-gray-700 dark:text-gray-300 font-normal'
                }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link 
              to="/dashboard/calendar" // Base dashboard URL maps to the calendar index
              className={`flex flex-col items-center justify-center gap-1 flex-1 text-sm border-none border-r border-[#b8cbe0] dark:border-slate-700 transition-colors
                ${location.pathname === '/dashboard/calendar'
                  ? 'bg-[#cbdcf0] dark:bg-slate-800 text-gray-900 dark:text-white font-bold' 
                  : 'bg-transparent text-gray-700 dark:text-gray-300 font-normal'
                }`}
            >
              <Calendar className="w-5 h-5" />
              <span>{t('dashboard.calendar')}</span>
            </Link>
            
            <Link 
              to="/dashboard/apartment"
              className={`flex flex-col items-center justify-center gap-1 flex-1 text-sm border-none transition-colors relative
                ${location.pathname === '/dashboard/apartment' 
                  ? 'bg-[#cbdcf0] dark:bg-slate-800 text-gray-900 dark:text-white font-bold' 
                  : 'bg-transparent text-gray-700 dark:text-gray-300 font-normal'
                }`}
            >
              <div className="relative p-1">
                <Home className="w-5 h-5" />
                {hasNotifications && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </div>
              <span>{t('dashboard.apartment')}</span>
            </Link>
          </nav>
        </footer>
      }
    >
      {/* LOCAL SUB-ROUTES WITH DIRECT PROP PASSING  */}
      <Routes>
        <Route 
          path="" 
          element={<MyDashboard />} 
        />
        <Route 
          path="calendar" 
          element={<CalendarGridTab />} 
        />
        <Route 
          path="apartment" 
          element={
            <MyApartmentTab />
          } 
        />
        {/* Fallback back to base dashboard calendar route */}
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
      
      
    </PageLayout>
  );
}

export default Dashboard;
