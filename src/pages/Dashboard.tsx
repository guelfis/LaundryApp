import { useEffect, useMemo, useState } from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { IonTabs, IonTabBar, IonTabButton, IonLabel, IonRouterOutlet } from '@ionic/react';
import { Calendar, Home, LayoutDashboard, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Components & Hooks
import CalendarGridTab from './CalendarGridTab';
import MyApartmentTab from './MyApartmentTab';
import MyDashboard from './UserDashboard';
import UserSettings from './UserSettings';
import { usePendingRequests, useApartmentMembers } from '../hooks/useApartments';
import { checkIsAdmin, resolveCurrentUserId } from '../auth/authUtils';
import { useBookingFilters } from '../hooks/useBookings';
import { ROUTES } from '../routes/routes.constants';

function Dashboard() {
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

  return (
    /* 
      FIXED: IonTabs wraps the outlet directly. No middle-man elements. 
      This lets Ionic apply the native tab-safe area adjustments automatically.
    */
    <IonTabs>
      <IonRouterOutlet>
        <Switch>
          <Route exact path={ROUTES.DASHBOARD_MAIN}>
            <MyDashboard />
          </Route>
          <Route exact path={ROUTES.DASHBOARD_CALENDAR}>
            <CalendarGridTab />
          </Route>
          <Route exact path={ROUTES.DASHBOARD_APARTMENT}>
            <MyApartmentTab />
          </Route>
          <Route exact path={ROUTES.DASHBOARD_SETTINGS}>
            <UserSettings />
          </Route>
          <Route path="*">
            <Redirect to={ROUTES.DASHBOARD_MAIN} />
          </Route>
        </Switch>
      </IonRouterOutlet>

      {/* The bottom layout bar remains fixed outside the router wrapper */}
      <IonTabBar 
        slot="bottom" 
        style={{
          height: '4.5rem',
          borderTop: '1px solid var(--border-color, #b8cbe0)',
          backgroundColor: 'var(--ion-tab-bar-background, #dce8f5)'
        }}
      >
        <IonTabButton tab="main" href={ROUTES.DASHBOARD_MAIN}>
          <LayoutDashboard className="w-5 h-5" />
          <IonLabel style={{ fontSize: '0.875rem' }}>Dashboard</IonLabel>
        </IonTabButton>

        <IonTabButton tab="calendar" href={ROUTES.DASHBOARD_CALENDAR}>
          <Calendar className="w-5 h-5" />
          <IonLabel style={{ fontSize: '0.875rem' }}>{t('dashboard.calendar')}</IonLabel>
        </IonTabButton>

        <IonTabButton tab="apartment" href={ROUTES.DASHBOARD_APARTMENT}>
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

        <IonTabButton tab="settings" href={ROUTES.DASHBOARD_SETTINGS}>
          <Settings className="w-5 h-5" />
          <IonLabel style={{ fontSize: '0.875rem' }}>{t('settings.page_title')}</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}

export default Dashboard;
