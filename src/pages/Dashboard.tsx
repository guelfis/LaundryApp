import { useEffect, useMemo, useState } from 'react';
import { useLocation, useHistory, Switch, Route, Redirect } from 'react-router-dom';
import { IonTabs, IonTabBar, IonTabButton, IonLabel, IonRouterOutlet } from '@ionic/react';
import { Calendar, Home, LayoutDashboard, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Components & Hooks
import PageLayout from '../components/PageLayout';
import { PageHeader } from '../components/PageHeader';
import CalendarGridTab from './CalendarGridTab';
import MyApartmentTab from './MyApartmentTab';
import MyDashboard from './UserDashboard';
import UserSettings from './UserSettings';
import { usePendingRequests, useApartmentMembers } from '../hooks/useApartments';
import { checkIsAdmin, resolveCurrentUserId } from '../auth/authUtils';
import { useBookingFilters } from '../hooks/useBookings';

function Dashboard() {
  const history = useHistory();
  const location = useLocation();
  const { t } = useTranslation();
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  useEffect(() => {
    resolveCurrentUserId().then(id => setCurrentUserId(id));
  }, []);
  const { apartmentId } = useBookingFilters();
  
  const { data: members = [] } = useApartmentMembers(apartmentId);
  const { data: requests = [] } = usePendingRequests(apartmentId);
  
  const isUserAdmin = useMemo(() => checkIsAdmin(members, currentUserId), [members, currentUserId]);
  const hasNotifications = isUserAdmin && Array.isArray(requests) && requests.length > 0;

  const onBack = () => {
    history.push('/apartment-login');
  };

  const renderHeader = () => {
    if (location.pathname.includes('/dashboard/apartment')) {
      return <PageHeader title={t('dashboard.your_apartment')} icon={<Home className="w-7 h-7 text-blue-500" />} onBack={onBack} />;
    }
    if (location.pathname.includes('/dashboard/calendar')) {
      return <PageHeader title={t('dashboard.calendar')} icon={<Calendar className="w-7 h-7 text-blue-500" />} onBack={onBack} />;
    }
    if (location.pathname.includes('/dashboard/settings')) {
      return <PageHeader title={t('settings.page_title')} icon={<Settings className="w-7 h-7 text-blue-500" />} onBack={onBack} />;
    }
    return <PageHeader title="Dashboard" icon={<LayoutDashboard className="w-7 h-7 text-blue-500" />} onBack={onBack} />;
  };

  return (
    <PageLayout header={renderHeader()}>
      <IonTabs>
        {/* 
          IonRouterOutlet combines with React Router v5 <Switch> to handle
          sub-view stack memory management efficiently.
        */}
        <IonRouterOutlet>
          <Switch>
            <Route exact path="/dashboard">
              <MyDashboard />
            </Route>
            <Route exact path="/dashboard/calendar">
              <CalendarGridTab />
            </Route>
            <Route exact path="/dashboard/apartment">
              <MyApartmentTab />
            </Route>
            <Route exact path="/dashboard/settings">
              <UserSettings />
            </Route>
            <Route path="*">
              <Redirect to="/dashboard" />
            </Route>
          </Switch>
        </IonRouterOutlet>

        <IonTabBar 
          slot="bottom" 
          style={{
            height: '4.5rem',
            borderTop: '1px solid var(--border-color, #b8cbe0)',
            backgroundColor: 'var(--ion-tab-bar-background, #dce8f5)'
          }}
        >
          <IonTabButton tab="main" href="/dashboard">
            <LayoutDashboard className="w-5 h-5" />
            <IonLabel style={{ fontSize: '0.875rem' }}>Dashboard</IonLabel>
          </IonTabButton>

          <IonTabButton tab="calendar" href="/dashboard/calendar">
            <Calendar className="w-5 h-5" />
            <IonLabel style={{ fontSize: '0.875rem' }}>{t('dashboard.calendar')}</IonLabel>
          </IonTabButton>

          <IonTabButton tab="apartment" href="/dashboard/apartment">
            <div style={{ position: 'relative' }}>
              <Home className="w-5 h-5" />
              {hasNotifications && (
                <span style={{ position: 'absolute', top: '-2px', right: '-2px', display: 'flex', height: '10px', width: '10px' }}>
                  <span className="animate-ping" style={{ position: 'absolute', borderRadius: '9999px', backgroundColor: '#f87171', opacity: 0.75, height: '100%', width: '100%' }}></span>
                  <span style={{ position: 'relative', borderRadius: '9999px', height: '10px', width: '10px', backgroundColor: '#ef4444' }}></span>
                </span>
              )}
            </div>
            <IonLabel style={{ fontSize: '0.875rem' }}>{t('dashboard.apartment')}</IonLabel>
          </IonTabButton>

          <IonTabButton tab="settings" href="/dashboard/settings">
            <Settings className="w-5 h-5" />
            <IonLabel style={{ fontSize: '0.875rem' }}>{t('settings.page_title')}</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
    </PageLayout>
  );
}

export default Dashboard;
