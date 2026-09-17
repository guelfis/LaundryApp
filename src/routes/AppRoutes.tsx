import { useEffect, useState } from 'react';
import { Route, Redirect, Switch, useHistory, useLocation } from 'react-router-dom';
import { IonRouterOutlet, IonSpinner, IonPage, IonContent } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { getCleanStorageItem } from '../auth/authUtils';

// Component Pages
import AuthPage from '../auth/AuthPage';
import Dashboard from '../pages/Dashboard'; 
import ApartmentLogin from '../pages/ApartmentLogin';
import HouseholdLogin from '../pages/HouseholdLogin';
import CreateHousehold from '../pages/CreateHousehold';
import { useGetUserHouselds, useHouseholdSlotsPolicy } from '../hooks/useHousehold';
import { BookingProvider } from '../contexts/BookingContext';
import { ROUTES } from './routes.constants';
import DeleteAccountStatus from '../pages/DeleteAccountStatus';

interface RouterNavigationState {
  householdId?: string;
  apartmentId?: string;
  isAdminModeActive?: boolean;
}

export default function AppRoutes() {
  const { session, loading: authLoading } = useAuth();
  const { data: userHouseholds = [], isLoading: isLoadingHouseholds } = useGetUserHouselds();
  
  const history = useHistory();
  const location = useLocation();
  const { t } = useTranslation();

  // Initialization flag for the initial boot configuration routing sweep
  const [isInitializing, setIsInitializing] = useState(true);

  // Read base structural membership tokens once.
  // We completely strip raw localStorage checks out of the top-level rendering engine dependencies list.
  const cachedHouseholdId = getCleanStorageItem('householdId');
  const cachedApartmentId = getCleanStorageItem('apartmentId');
  const isAdminModeActive = localStorage.getItem('isAdminModeActive') === 'true';

  useEffect(() => {
    // Halt calculations if auth endpoints or household query caches are pending
    if (authLoading || isLoadingHouseholds) return;

    // Route Guard: Handle clean redirection targeting unauthenticated tokens
    if (!session?.user?.id) {
      setIsInitializing(false);
      if (location.pathname !== ROUTES.LOGIN) {
        history.push(ROUTES.LOGIN);
      }
      return;
    }

    // Only calculate redirection paths when hitting base entrance points.
    // This allows active sub-pages to handle internal forward routing manually via state without triggering top-level loop resets.
    if (location.pathname === '/' || location.pathname === ROUTES.LOGIN) {
      const belongsToAnyHousehold = Array.isArray(userHouseholds) && userHouseholds.length > 0;
      
      if (!belongsToAnyHousehold) {
        history.push(ROUTES.HOUSEHOLD_LOGIN);
      } else if (!cachedHouseholdId) {
        history.push(ROUTES.HOUSEHOLD_LOGIN);
      } else if (!cachedApartmentId) {
        history.push(ROUTES.APARTMENT_LOGIN);
      } else {
        history.push(ROUTES.DASHBOARD_MAIN);
      }
    }

    setIsInitializing(false);
  }, [session, authLoading, isLoadingHouseholds, location.pathname, history, userHouseholds, cachedHouseholdId, cachedApartmentId]);

  // Read current context metadata values cleanly
  const cachedHousehold = userHouseholds.find(hh => hh.household_id === cachedHouseholdId);
  const householdTimezone = cachedHousehold ? cachedHousehold.household.timezone : 'Europe/Zurich';
  const { data: slots, isLoading: isSlotsLoading } = useHouseholdSlotsPolicy(cachedHouseholdId || '');


  if (authLoading || isLoadingHouseholds || isInitializing || isSlotsLoading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center" style={{ '--background': 'var(--ion-background-color)' }}>
          <div style={{ display: 'flex', height: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <IonSpinner name="crescent" color="primary" />
            <span style={{ fontSize: '14px', color: 'var(--ion-text-color)', opacity: 0.7 }}>
              {t('app.checking_membership')}
            </span>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const hasHouseholdAccess = Array.isArray(userHouseholds) && userHouseholds.length > 0;

  return (
    <IonRouterOutlet id="main-app-content">
      <Switch>
        {/* Public Landing Area */}
        <Route exact path={ROUTES.LOGIN}>
          {!session ? <AuthPage /> : <Redirect to={ROUTES.HOUSEHOLD_LOGIN} />}
        </Route>

        {/* Private Setup Configurations */}
        <Route exact path={ROUTES.HOUSEHOLD_LOGIN}>
          {session ? <HouseholdLogin /> : <Redirect to={ROUTES.LOGIN} />}
        </Route>
        
        <Route exact path={ROUTES.HOUSEHOLD_SETUP}>
          {session ? <CreateHousehold /> : <Redirect to={ROUTES.LOGIN} />}
        </Route>
        
        <Route exact path={ROUTES.APARTMENT_LOGIN}>
          {session ? (hasHouseholdAccess ? <ApartmentLogin /> : <Redirect to={ROUTES.HOUSEHOLD_LOGIN} />) : <Redirect to={ROUTES.LOGIN} />}
        </Route>

        
        <Route path={ROUTES.DASHBOARD_MAIN}>
          {() => {
            const routerState = location.state as RouterNavigationState | undefined;

            // Check Router State memory first, then fall back to storage tokens if the user manually reloaded the browser tab
            const activeHouseholdId = routerState?.householdId || cachedHouseholdId;
            const activeApartmentId = routerState?.apartmentId || cachedApartmentId;
            const activeAdminFlag = routerState?.isAdminModeActive ?? isAdminModeActive;
            // it should never happen
            if (!slots) {
              return <Redirect to={ROUTES.HOUSEHOLD_SETUP} />;
            }

            if (session && activeHouseholdId && activeApartmentId) {
              return (
                <BookingProvider 
                  householdId={activeHouseholdId} 
                  apartmentId={activeApartmentId} 
                  householdTimezone={householdTimezone} 
                  isAdminMode={activeAdminFlag}
                  slotsPolicy={slots}
                >
                  <Dashboard />
                </BookingProvider>
              );
            }
            return <Redirect to={cachedHouseholdId ? ROUTES.APARTMENT_LOGIN : ROUTES.HOUSEHOLD_LOGIN} />;
          }}
        </Route>


        <Route exact path={ROUTES.ACCOUNT_DELETION}>
          {session ? <DeleteAccountStatus /> : <Redirect to={ROUTES.LOGIN} />}
        </Route>

        <Route path="*">
          <Redirect to={session ? (cachedApartmentId ? ROUTES.DASHBOARD_MAIN : ROUTES.APARTMENT_LOGIN) : ROUTES.LOGIN} />
        </Route>
      </Switch>
    </IonRouterOutlet>
  );
}
