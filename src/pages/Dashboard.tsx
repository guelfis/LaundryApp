import { useEffect, useMemo, useState } from 'react';
import { Switch, Route, Redirect, useLocation } from 'react-router-dom';
import { IonTabs, IonTabBar, IonTabButton, IonLabel, IonRouterOutlet } from '@ionic/react';
import { Building, Calendar, Home, LayoutDashboard, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Components & Hooks
import CalendarGridTab from './CalendarGridTab';
import MyApartmentTab from './MyApartmentTab';
import DashboardBase from './DashboardBase';
import UserSettings from './UserSettings';
import { usePendingRequests, useApartmentMembers } from '../hooks/useApartments';
import { checkIsAdminApartment, resolveCurrentUserId } from '../auth/authUtils';
import { useBookingFilters } from '../hooks/useBookings';
import { ROUTES } from '../routes/routes.constants';
import BuildingTab from './BuildingTab';

const enum DashboardTabs {
  DASHBOARD = "dashboard",
  CALENDAR = "calendar",
  SETTINGS = "settings",
  APARTMENT = "apartment",
  HOUSEHOLD = "household"
}

function Dashboard() {
  const { t } = useTranslation();
  const location = useLocation();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  useEffect(() => {
    resolveCurrentUserId().then(id => setCurrentUserId(id));
  }, []);

  const activeTab = useMemo(() => {
    if (location.pathname === ROUTES.DASHBOARD_CALENDAR) return DashboardTabs.CALENDAR;
    if (location.pathname === ROUTES.DASHBOARD_APARTMENT) return DashboardTabs.APARTMENT;
    if (location.pathname === ROUTES.DASHBOARD_SETTINGS) return DashboardTabs.SETTINGS;
    if (location.pathname === ROUTES.DASHBOARD_HOUSEHOLD) return DashboardTabs.HOUSEHOLD;
    return DashboardTabs.DASHBOARD; 
  }, [location.pathname]);
  
  const { apartmentId, isAdminMode } = useBookingFilters();
  
  // Turn off member and request queries entirely if the user is in Admin Mode
  const { data: members = [] } = useApartmentMembers(apartmentId, { 
    enabled: !!apartmentId && !isAdminMode 
  });
  const { data: requests = [] } = usePendingRequests(apartmentId, { 
    enabled: !!apartmentId && !isAdminMode 
  });
  
  // Force tenant apartment admin flags to false if in Admin Mode
  const isUserApartmentAdmin = useMemo(() => {
    if (!apartmentId || isAdminMode) return false;
    return checkIsAdminApartment(members, currentUserId);
  }, [members, currentUserId, apartmentId, isAdminMode]);
  
  const hasNotifications = isUserApartmentAdmin && Array.isArray(requests) && requests.length > 0;

  return (
    <IonTabs>
      <IonRouterOutlet>
        <Switch>
          <Route exact path={ROUTES.DASHBOARD_MAIN}>
            <DashboardBase />
          </Route>
          <Route exact path={ROUTES.DASHBOARD_CALENDAR}>
            <CalendarGridTab />
          </Route>
          
          {/* Only match the individual apartment route if NOT in global Admin Mode */}
          {!isAdminMode && (
            <Route exact path={ROUTES.DASHBOARD_APARTMENT}>
              <MyApartmentTab />
            </Route>
          )}

          {isAdminMode && (
            <Route exact path={ROUTES.DASHBOARD_HOUSEHOLD}>
              <BuildingTab/>
            </Route>
          )}
          
          <Route exact path={ROUTES.DASHBOARD_SETTINGS}>
            <UserSettings />
          </Route>
          <Route path="*">
            <Redirect to={ROUTES.DASHBOARD_MAIN} />
          </Route>
        </Switch>
      </IonRouterOutlet>

      {/* Fixed bottom layout bar adapts perfectly to light/dark themes */}
      <IonTabBar 
        slot="bottom" 
        selectedTab={activeTab}
        style={{
          borderTop: '1px solid var(--ion-color-step-150, #b8cbe0)',
          backgroundColor: 'var(--ion-tab-bar-background, var(--ion-background-color, #dce8f5))'
        }}
      >
        <IonTabButton tab={DashboardTabs.DASHBOARD} href={ROUTES.DASHBOARD_MAIN} selected={activeTab===DashboardTabs.DASHBOARD}>
          <LayoutDashboard className="w-5 h-5" />
          <IonLabel style={{ fontSize: '0.875rem' }}>Dashboard</IonLabel>
        </IonTabButton>

        <IonTabButton tab={DashboardTabs.CALENDAR} href={ROUTES.DASHBOARD_CALENDAR} selected={activeTab===DashboardTabs.CALENDAR}>
          <Calendar className="w-5 h-5" />
          <IonLabel style={{ fontSize: '0.875rem' }}>{t('dashboard.calendar')}</IonLabel>
        </IonTabButton>

        {/* Show tenant apartment tab ONLY when not running administrative tools */}
        {apartmentId && !isAdminMode && (
          <IonTabButton tab={DashboardTabs.APARTMENT} href={ROUTES.DASHBOARD_APARTMENT} selected={activeTab===DashboardTabs.APARTMENT}>
            <div style={{ position: 'relative' }}>
              <Home className="w-5 h-5" />
              {hasNotifications && (
                <span style={{ position: 'absolute', top: '-2px', right: '-2px', display: 'flex', height: '10px', width: '10px' }}>
                  <span className="animate-ping" style={{ position: 'absolute', borderRadius: '9999px', backgroundColor: 'var(--ion-color-danger)', opacity: 0.75, height: '100%', width: '100%' }}></span>
                  <span style={{ position: 'relative', borderRadius: '9999px', height: '10px', width: '10px', backgroundColor: 'var(--ion-color-danger)' }}></span>
                </span>
              )}
            </div>
            <IonLabel style={{ fontSize: '0.875rem' }}>{t('dashboard.apartment')}</IonLabel>
          </IonTabButton>
        )}

        {/* 4. CONDITIONAL VISIBILITY: Show whole-building control panel tab ONLY when Admin Mode is active */}
        {isAdminMode && (
          <IonTabButton tab={DashboardTabs.HOUSEHOLD} href={ROUTES.DASHBOARD_HOUSEHOLD} selected={activeTab===DashboardTabs.HOUSEHOLD}>
            <div style={{ position: 'relative' }}>
              <Building className="w-5 h-5" />
            </div>
            <IonLabel style={{ fontSize: '0.875rem' }}>{t('dashboard.household')}</IonLabel>
          </IonTabButton>
        )}
        
        <IonTabButton tab={DashboardTabs.SETTINGS} href={ROUTES.DASHBOARD_SETTINGS} selected={activeTab===DashboardTabs.SETTINGS}>
          <Settings className="w-5 h-5" />
          <IonLabel style={{ fontSize: '0.875rem' }}>{t('settings.page_title')}</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}

export default Dashboard;
