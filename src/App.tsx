import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ApartmentSetup from './ApartmentSetup'; 
import Dashboard from './Dashboard'; 
import { BookingProvider } from './contexts/BookingContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock household ID for testing purposes
const MOCK_HOUSEHOLD_ID = "450bfbaf-70f3-4888-b03d-28d6f80c7234";

function App() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BookingProvider householdId={MOCK_HOUSEHOLD_ID}>
        <Router>
          <Routes>
            {/* Route for the apartment name input */}
            <Route path="/" element={<ApartmentSetup />} />
            
            {/* Route for the actual app content */}
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </Router>
      </BookingProvider>
    </QueryClientProvider>
  );
}

export default App;