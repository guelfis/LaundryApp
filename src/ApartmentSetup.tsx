import { useContext, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageLayout from './components/PageLayout';
import { useApartments, useMyApartments, useJoinViaLink } from './useApartments'; 
import { BookingContext } from './contexts/BookingContext';
import { Apartment } from './lib/databaseTypes';
import ApartmentsList from './apartmentSetup/ApartmentsList';
import JoinRequestModal from './apartmentSetup/JoinRequestModal'; 
import { PageHeader } from './components/PageHeader';
import { Home } from 'lucide-react';
import { LoadingSpinner } from './components/LoadingSpinner';
import SectionText from './components/SectionText';

export default function ApartmentSetup() {
  const { householdId } = useContext(BookingContext)!;
  const { data: myApartments = [], isLoading: isLoadingMy } = useMyApartments(householdId);
  const { data: allApartments = [], isLoading: isLoadingAll } = useApartments(householdId);
  
  // Hook to handle incoming invitation parameters via URL
  const [searchParams] = useSearchParams();
  const { mutateAsync: joinViaLink, isPending: isJoining } = useJoinViaLink();

  const [selectedApt, setSelectedApt] = useState<Apartment | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const otherApartments = allApartments.filter(
    (apt) => !myApartments.some((myapt) => apt.id === myapt.id)
  );

  const navigate = useNavigate();

  // Monitor incoming URL triggers on component mount
  useEffect(() => {
    const handleAutoJoin = async (token: string) => {
      try {
        // Execute database mutation block
        await joinViaLink(token);
        alert("Successfully joined the apartment!");
        // Direct pass straight to core dashboard state
        navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error("Link processing error:", err);
        alert("This invitation link is invalid, expired, or fully claimed.");
        // Sanitize address line parameters
        navigate('/setup', { replace: true });
      }
  };

  const inviteToken = searchParams.get('invite');
  if (inviteToken) {
    handleAutoJoin(inviteToken);
  }
}, [searchParams, joinViaLink, navigate]); 

 

  const enterApartment = (apt: Apartment) => {
    localStorage.setItem('apartmentName', apt.display_name);
    localStorage.setItem('apartmentId', apt.id);
    navigate('/dashboard');
  };

  const handleJoinRequest = (apt: Apartment) => {
    setSelectedApt(apt);
    setIsJoinModalOpen(true);
  };

  // Render blocking state during active database link insertions
  if (isJoining) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4 w-full">
          <LoadingSpinner />
          <p className="text-gray-500 font-medium animate-pulse">Joining apartment via invite link...</p>
        </div>
      </PageLayout>
    );
  }

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
        <PageHeader title="Apartment Setup" icon={<Home className="w-7 h-7 text-blue-500 dark:text-blue-400" />} />
      }
      footer={
        <div className="px-4 py-6">
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-4 mb-2">
            Your apartment is not on the list?
          </p>
          
          <button 
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg active:bg-blue-700 dark:bg-blue-500 dark:active:bg-blue-600 transition-colors"
            onClick={() => console.log('Apri form creazione')}
          >
            create a new apartment
          </button>
        </div>
      }
    >
      <div className="flex flex-col flex-1 w-full space-y-6">
        {/* ALWAYS show My Apartments if they exist */}
        {myApartments.length > 0 && (
          <div className="flex flex-col">
            <SectionText title="My Apartments" />
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
            <SectionText title="Available Apartments" />
            <ApartmentsList 
              isLoading={isLoadingAll} 
              apartments={otherApartments} 
              onSelect={handleJoinRequest} 
              lock={true} 
            />
          </div>
        )}
      </div>

      {/* Access Requesting Form Sheet overlay */}
      <JoinRequestModal 
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        apartmentName={selectedApt?.display_name || null}
        apartmentId={selectedApt?.id || null}
      />
    </PageLayout>
  );
}
