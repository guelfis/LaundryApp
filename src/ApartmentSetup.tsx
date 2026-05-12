import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from './components/PageLayout';
import { useApartments } from './useApartments';
import { BookingContext } from './contexts/BookingContext';
import { LoadingSpinner } from './components/loadingSpinner';
import { Apartment } from './lib/databaseTypes';
import { ApartmentPasswordModal } from './apartmentSetup/ApartmentPasswordModal';



export default function ApartmentSetup() {

  const { householdId } = useContext(BookingContext)!;
  const {data: apartments = [], isLoading} = useApartments(householdId);

  // states for confirmation modal
  const [selectedApt, setSelectedApt] = useState<Apartment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();

  const handleConfirm = () => {
    if (selectedApt) {
      // Optional: Save to browser memory so it stays after refresh
      localStorage.setItem('apartmentName', selectedApt.display_name);
      localStorage.setItem('apartmentId', selectedApt.id);
      // Move to the main app page
      navigate('/dashboard');
    }
  };

  const handleOpenModal = (apt: Apartment) => {
    setSelectedApt(apt);
    setIsModalOpen(true);
  };


  if (isLoading) {
    return (
      <PageLayout>
        <LoadingSpinner />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* 1. Header */}
      <header className="text-center  mt-8 mb-4">
        <h1 className="text-xl font-bold text-gray-800">
          Select or join an existing apartment
        </h1>
      </header>
        {/* 2. Apartment List */}
      <div className="flex-grow border-2 border-gray-200 rounded-xl p-4 overflow-y-auto bg-gray-50/50">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-3">
            {apartments?.map((apt) => (
              <button
                key={apt.id}
                onClick={() => {
                  handleOpenModal(apt);
                }}
                className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg shadow-sm active:scale-95 transition-transform"
              >
                <span className="font-semibold text-lg text-gray-700">{apt.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
        {/* 3. Create New Apartment */}
        <footer className="mt-8 mb-4 space-y-4">
        <p className="text-center text-gray-600">
          Your apartment is not on the list?
        </p>
        
        <button 
          className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg active:bg-blue-700 transition-colors"
          onClick={() => console.log('Apri form creazione')}
        >
          create a new apartment
        </button>
      </footer>

    </div>

    {/* REUSABLE BOTTOM modal form to set the password */}
    {/* Todo: implement password check */}
    <ApartmentPasswordModal
        isModalOpen={isModalOpen}
        handleCloseModal={() => setIsModalOpen(false)}
        apartmentName={selectedApt?.display_name || null}
        handleConfirm={handleConfirm}
    />
      
    </PageLayout>
  );
}