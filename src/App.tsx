import { BrowserRouter as Router } from 'react-router-dom';

import { BookingProvider } from './contexts/BookingContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthContext';
import AppRoutes from './routes/AppRoutes';
import { getCleanStorageItem } from './auth/authUtils';
import { MOCK_HOUSEHOLD_ID } from './constants/temporary';

// create a QueryClient instance for React Query outside of the component to avoid re-creating it on every render
const queryClient = new QueryClient();

// 3. Main App component that wraps everything with providers
function App() {
  const householdId = getCleanStorageItem('householdId') || MOCK_HOUSEHOLD_ID;
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BookingProvider householdId={householdId}>
          <Router>
            <AppRoutes />
          </Router>
        </BookingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
