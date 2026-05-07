import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ApartmentSetup from './ApartmentSetup'; 
import Dashboard from './Dashboard'; // Your original app content

function App() {
  return (
    <Router>
      <Routes>
        {/* Route for the apartment name input */}
        <Route path="/" element={<ApartmentSetup />} />
        
        {/* Route for the actual app content */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;