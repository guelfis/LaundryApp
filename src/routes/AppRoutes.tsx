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
import { useGetUserHouselds } from '../hooks/useHousehold';
import { BookingProvider } from '../contexts/BookingContext';

export default function AppRoutes() {
  const { session, loading: authLoading } = useAuth();
  const { data: userHouseholds = [], isLoading: isLoadingHouseholds } = useGetUserHouselds();
  
  const history = useHistory();
  const location = useLocation();
  const { t } = useTranslation();

  // State flags for checking household database permissions
  const [checkingPermissions, setCheckingPermissions] = useState(true);
  const [hasHouseholdAccess, setHasHouseholdAccess] = useState(false);

  // Read current locally stored choices
  const cachedHouseholdId = getCleanStorageItem('householdId');
  const cachedApartmentId = getCleanStorageItem('apartmentId');

  useEffect(() => {
    async function determineNavigationTarget() {
      // 1. If still calculating base session tokens, halt execution
      if (authLoading) return;

      // 2. If the user is unauthenticated, skip calculations and lock them to login
      if (!session?.user?.id) {
        setCheckingPermissions(false);
        if (location.pathname !== '/login') {
          history.push('/login');
        }
        return;
      }

      try {
        setCheckingPermissions(true);

        

        const belongsToAnyHousehold = Array.isArray(userHouseholds) && userHouseholds.length > 0;
        setHasHouseholdAccess(belongsToAnyHousehold);
        
        console.log(hasHouseholdAccess, belongsToAnyHousehold, userHouseholds);
        // 4. ROUTING DECISION MATRIX TREE
        if (location.pathname === '/login' || location.pathname === '/') {
          if (!belongsToAnyHousehold) {
            // User is fresh: must link up or configure a brand new house structure
            history.push('/household-login');
          } else if (!cachedHouseholdId) {
            // Belongs to homes but hasn't picked an active scope item this session
            history.push('/household-login');
          } else if (!cachedApartmentId) {
            // Inside household, but needs to link to a physical room/apartment
            history.push('/apartment-login');
          } else {
            // Everything validated: jump directly into the interface workspace
            history.push('/dashboard');
          }
        }
      } catch (err) {
        console.error("Critical failure during navigation mapping evaluation:", err);
      } finally {
        setCheckingPermissions(false);
      }
    }

    determineNavigationTarget();
    // Dependency constraints capture layout updates cleanly without looping
  }, [session, authLoading, cachedHouseholdId, cachedApartmentId, location.pathname, history, userHouseholds, hasHouseholdAccess]);

  // get the timezone of the cached household for passing into the BookingProvider context
  const cachedHousehold = userHouseholds.find(hh => hh.household_id === cachedHouseholdId);
  const householdTimezone = cachedHousehold ? cachedHousehold.household.timezone : 'Europe/Zurich';
  localStorage.setItem('householdTimezone', householdTimezone);


  // Combined full view blocker loader to keep transition cycles uniform
  if (authLoading || checkingPermissions || isLoadingHouseholds) {
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

  return (
    <IonRouterOutlet id="main-app-content">
      <Switch>
        {/* Public Landing Area */}
        <Route exact path="/login">
          {!session ? <AuthPage /> : <Redirect to="/household-login" />}
        </Route>

        {/* Private Workspace Area with Real-Time Conditional Guards */}
        <Route exact path="/household-login">
          {session ? <HouseholdLogin /> : <Redirect to="/login" />}
        </Route>
        
        <Route exact path="/household-setup">
          {session ? <CreateHousehold /> : <Redirect to="/login" />}
        </Route>
        
        <Route exact path="/apartment-login">
          {session ? (hasHouseholdAccess ? <ApartmentLogin /> : <Redirect to="/household-login" />) : <Redirect to="/login" />}
        </Route>

        <Route path="/dashboard">
          {session && cachedApartmentId && cachedHouseholdId ? (
            <BookingProvider householdId={cachedHouseholdId} apartmentId={cachedApartmentId} householdTimezone={householdTimezone}>
              <Dashboard />
            </BookingProvider>
          ) : (
            <Redirect to={cachedHouseholdId ? "/apartment-login" : "/household-login"} />
          )}
        </Route>

        {/* Catch-All Standard Routing Resolution Point */}
        <Route path="*">
          <Redirect to={session ? (cachedApartmentId ? "/dashboard" : "/apartment-login") : "/login"} />
        </Route>
      </Switch>
    </IonRouterOutlet>
  );
}
