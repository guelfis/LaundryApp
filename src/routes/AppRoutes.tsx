import { useEffect } from 'react';
import { Route, Redirect, Switch, useHistory, useLocation } from 'react-router-dom';
import { IonRouterOutlet, IonSpinner, IonPage, IonContent } from '@ionic/react';
import { useAuth } from '../auth/AuthContext';
import { getCleanStorageItem } from '../auth/authUtils';

// Component Pages
import AuthPage from '../auth/AuthPage';
import Dashboard from '../pages/Dashboard'; 
import ApartmentLogin from '../pages/ApartmentLogin';
import HouseholdLogin from '../pages/HouseholdLogin';
import CreateHousehold from '../pages/CreateHousehold';

export default function AppRoutes() {
  const { session, loading } = useAuth();
  const history = useHistory();
  const location = useLocation();

  const hasApartment = !!getCleanStorageItem('apartmentId');

  /* 
    CRITICAL CRASH FIX: Listen to the Supabase session lifecycle directly.
    When a user successfully logs in, push them down the path manually 
    to force IonReactRouter to break out of the public view state cleanly.
  */
  useEffect(() => {
    if (!loading) {
      if (session) {
        // If they are on the login page but have an active session, push them forward
        if (location.pathname === '/login' || location.pathname === '/') {
          const nextTarget = hasApartment ? "/dashboard" : "/apartment-login";
          history.push(nextTarget);
        }
      } else {
        // If the session drops (logout), force a redirect to login instantly
        if (location.pathname !== '/login') {
          history.push('/login');
        }
      }
    }
  }, [session, loading, hasApartment, location.pathname, history]);

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    /* 
      A single, continuous IonRouterOutlet with explicit paths ensures 
      Ionic can register the history stack without throwing cache errors.
    */
    <IonRouterOutlet id="main-app-content">
      <Switch>
        {/* Public Path Stack */}
        <Route exact path="/login">
          {!session ? <AuthPage /> : <Redirect to={hasApartment ? "/dashboard" : "/apartment-login"} />}
        </Route>

        {/* Private Protected Workspace Stack */}
        <Route exact path="/household-login">
          {session ? <HouseholdLogin /> : <Redirect to="/login" />}
        </Route>
        
        <Route exact path="/household-setup">
          {session ? <CreateHousehold /> : <Redirect to="/login" />}
        </Route>
        
        <Route exact path="/apartment-login">
          {session ? <ApartmentLogin /> : <Redirect to="/login" />}
        </Route>

        {/* Wildcard nested matching for bottom dashboard tab arrays */}
        <Route path="/dashboard">
          {session ? <Dashboard /> : <Redirect to="/login" />}
        </Route>

        {/* Root Fallback Resolution Strategy */}
        <Route path="*">
          <Redirect to={session ? (hasApartment ? "/dashboard" : "/apartment-login") : "/login"} />
        </Route>
      </Switch>
    </IonRouterOutlet>
  );
}
