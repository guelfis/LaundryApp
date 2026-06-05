import { IonApp, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Contexts & Auth
import { AuthProvider } from './auth/AuthContext';
import { getCleanStorageItem } from './auth/authUtils';
import { MOCK_HOUSEHOLD_ID } from './constants/temporary';
import { BookingProvider } from './contexts/BookingContext';
import AppRoutes from './routes/AppRoutes';

/* Core Ionic CSS Packages (Required for layouts to render properly) */
import '@ionic/react/css/core.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Import your custom dark mode and global styling variables */
import './theme/variables.css';

// Initialize Ionic core features
setupIonicReact();

// Create QueryClient outside component to avoid re-creation on re-renders
const queryClient = new QueryClient();

function App() {
  const householdId = getCleanStorageItem('householdId') || MOCK_HOUSEHOLD_ID;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BookingProvider householdId={householdId}>
          {/* IonApp is mandatory as the absolute root visual layer for Ionic */}
          <IonApp>
            {/* IonReactRouter replaces BrowserRouter to manage native transitions */}
            <IonReactRouter>
              <AppRoutes />
            </IonReactRouter>
          </IonApp>
        </BookingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
