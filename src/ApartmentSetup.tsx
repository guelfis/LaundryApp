import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from './components/PageLayout';
import { useApartments, useMyApartments } from './useApartments';
import { BookingContext } from './contexts/BookingContext';
import { LoadingSpinner } from './components/loadingSpinner';
import { Apartment } from './lib/databaseTypes';
import ApartmentsList from './apartmentSetup/ApartmentsList';
import JoinApartmentModal from './apartmentSetup/JoinApartmentModal';
import { PageHeader } from './components/PageHeader';
import { Home } from 'lucide-react';



export default function ApartmentSetup() {

  const { householdId } = useContext(BookingContext)!;
  const { data: myApartments = [], isLoading: isLoadingMy } = useMyApartments(householdId);
  const { data: allApartments = [], isLoading: isLoadingAll } = useApartments(householdId);

  const [selectedApt, setSelectedApt] = useState<Apartment | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const otherApartments = allApartments.filter(
    (apt) => !myApartments.some((myapt) => apt.id === myapt.id)
  );

  const navigate = useNavigate();

  const enterApartment = (apt: Apartment) => {
    // Optional: Save to browser memory so it stays after refresh
    localStorage.setItem('apartmentName', apt.display_name);
    localStorage.setItem('apartmentId', apt.id);
    // Move to the main app page
      navigate('/dashboard');
    
  };

  const handleJoinRequest = (apt: Apartment) => {
    setSelectedApt(apt);
    setIsJoinModalOpen(true);
  };

  if (isLoadingAll || isLoadingMy) {
    return (
      <PageLayout>
        <LoadingSpinner />
      </PageLayout>
    );
  }

  return (
    <PageLayout
    header={
      <PageHeader title="Apartment Setup" icon={<Home className="w-7 h-7 text-blue-500" />} />
    }
    footer={
      <div className="px-4 py-6">
        {/* 3. Create New Apartment */}
        <p className="text-center text-gray-600 text-sm mt-4 mb-2">
          Your apartment is not on the list?
        </p>
        
        <button 
          className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg active:bg-blue-700 transition-colors"
          onClick={() => console.log('Apri form creazione')}
        >
          create a new apartment
        </button>
    </div>
    }>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>      
      
      <div className="flex flex-col h-[calc(100vh-120px)] space-y-6">
        {/* ALWAYS show My Apartments if they exist */}
        {myApartments.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600 ml-4 mb-2">Your Apartments</h2>
            <ApartmentsList 
              isLoading={isLoadingMy} 
              apartments={myApartments} 
              onSelect={enterApartment} 
              lock={false} 
            />
          </div>
        )}

        {/* ALWAYS show Other Apartments if they exist */}
        {otherApartments.length > 0 && (
          <div className="flex-grow flex flex-col">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600 ml-4 mb-2">Available apartments</h2>
            <ApartmentsList 
              isLoading={isLoadingAll} 
              apartments={otherApartments} 
              onSelect={handleJoinRequest} 
              lock={true} // Use the lock icon here since you will need to join them
            />
          </div>
        )}
     </div>

    
    
    </div>
    {/* The New Modal */}
    <JoinApartmentModal 
      isOpen={isJoinModalOpen}
      onClose={() => setIsJoinModalOpen(false)}
      apartmentName={selectedApt?.display_name || null}
      apartmentId={selectedApt?.id || null}
    />

    </PageLayout>
  );
}