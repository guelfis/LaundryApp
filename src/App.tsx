import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ApartmentSetup from './ApartmentSetup'; 
import Dashboard from './Dashboard'; 
import { BookingProvider } from './contexts/BookingContext';

// Mock household ID for testing purposes
const MOCK_HOUSEHOLD_ID = "tuo-uuid-da-supabase";

function App() {
  return (
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
  );
}

export default App;