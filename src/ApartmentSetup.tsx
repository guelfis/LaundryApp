import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from './components/PageLayout';

export default function ApartmentSetup() {
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleConfirm = () => {
    if (name.trim()) {
      // Optional: Save to browser memory so it stays after refresh
      localStorage.setItem('apartmentName', name);
      // Move to the main app page
      navigate('/dashboard');
    }
  };

  return (
    <PageLayout>
      <div className="p-10 text-center">
        <h1 className="mb-5">Welcome!</h1>
        <p className="mb-5">Enter your Apartment name to begin:</p>
        <input 
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Smith Residence"
          className="border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={handleConfirm} className="ml-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
          Enter
        </button>
      </div>
    </PageLayout>
  );
}