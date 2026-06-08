import { IonApp, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Contexts & Auth Components
import { AuthProvider } from './auth/AuthContext';
import AppRoutes from './routes/AppRoutes';

/* Core Ionic CSS Packages */
import '@ionic/react/css/core.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Custom theme stylesheets configuration */
import './theme/variables.css';

// Initialize Ionic core rendering features
setupIonicReact();

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <IonApp>
          <IonReactRouter>
            <AppRoutes />
          </IonReactRouter>
        </IonApp>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
