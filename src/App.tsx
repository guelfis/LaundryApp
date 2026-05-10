import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ApartmentSetup from './ApartmentSetup'; 
import Dashboard from './Dashboard'; 
import AuthPage from './auth/AuthPage';
import { BookingProvider } from './contexts/BookingContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './auth/AuthContext';

// create a QueryClient instance for React Query outside of the component to avoid re-creating it on every render
const queryClient = new QueryClient();
const MOCK_HOUSEHOLD_ID = "450bfbaf-70f3-4888-b03d-28d6f80c7234";

// 2. Component that defines the app routes based on authentication state
function AppRoutes() {
  const { session } = useAuth();

  return (
    <Routes>
      {/* Route for the authentication page. no sesstion -> login */}
      {!session ? (
        <Route path="*" element={<AuthPage />} />
      ) : (
        /* Route for the main app content */
        <>
          <Route path="/" element={<ApartmentSetup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Fallback for non-existent routes */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </>
      )}
    </Routes>
  );
}

// 3. Main App component that wraps everything with providers
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BookingProvider householdId={MOCK_HOUSEHOLD_ID}>
          <Router>
            <AppRoutes />
          </Router>
        </BookingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
