import { useState, useEffect, useMemo } from 'react';
import { Redirect, useHistory, useLocation } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { useApartments, useMyApartments, useJoinViaLink } from '../hooks/useApartments'; 
import { Apartment } from '../lib/databaseTypes';
import ApartmentsList from '../apartmentSetup/ApartmentsList';
import JoinRequestModal from '../apartmentSetup/JoinRequestModal'; 
import { PageHeader } from '../components/PageHeader';
import { Home } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import SectionText from '../components/SectionText';
import CreateApartmentModal from '../apartmentSetup/CreateApartmentModal';
import { useTranslation } from 'react-i18next';
import FooterSection from '../components/FooterSection';
import { getCleanStorageItem } from '../auth/authUtils';
import { ROUTES } from '../routes/routes.constants';
import {addOutline} from 'ionicons/icons'

export default function ApartmentLogin() {
  const { t } = useTranslation();
  const householdId = getCleanStorageItem('householdId') || '';
  
  const { data: myApartments = [], isLoading: isLoadingMy } = useMyApartments(householdId);
  const { data: allApartments = [], isLoading: isLoadingAll } = useApartments(householdId);
  
  const location = useLocation();
   const searchParams = useMemo(() => {
    return new URLSearchParams(location.search);
  }, [location.search]);

  const { mutateAsync: joinViaLink, isPending: isJoining } = useJoinViaLink();

  const [selectedApt, setSelectedApt] = useState<Apartment | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreateAptModalOpen, setIsCreateAptModalOpen] = useState(false); // Fixed spelling typo

  const otherApartments = allApartments.filter(
    (apt) => !myApartments.some((myapt) => apt.id === myapt.id)
  );

  const history = useHistory();

  useEffect(() => {
    const handleAutoJoin = async (token: string) => {
      try {
        await joinViaLink(token);
        /* 1. Localized Alert Notifications */
        alert(t('apartmentLogin.alert_join_success', 'Successfully joined the apartment!'));
        history.push(ROUTES.DASHBOARD_MAIN, { replace: true });
      } catch (err) {
        console.error("Link processing error:", err);
        alert(t('apartmentLogin.alert_join_error', 'This invitation link is invalid, expired, or fully claimed.'));
        history.push(ROUTES.APARTMENT_LOGIN, { replace: true });
      }
    };

    const inviteToken = searchParams.get('invite');
    if (inviteToken) {
      handleAutoJoin(inviteToken);
    }
  }, [searchParams, joinViaLink, history, t]); 

  const enterApartment = (apt: Apartment) => {
    localStorage.setItem('apartmentName', apt.display_name);
    localStorage.setItem('apartmentId', apt.id);
    history.push(ROUTES.DASHBOARD_MAIN);
  };

  const handleJoinRequest = (apt: Apartment) => {
    setSelectedApt(apt);
    setIsJoinModalOpen(true);
  };

  if (!householdId) {
    return <Redirect to={ROUTES.HOUSEHOLD_LOGIN} />;
  }

  /* 2. Localized Invitation Link Processing View State */
  if (isJoining) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4 w-full">
          <LoadingSpinner />
          <p className="text-gray-500 font-medium animate-pulse">
            {t('apartmentLogin.loading_invite', 'Joining apartment via invite link...')}
          </p>
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
        <PageHeader title={t('apartmentLogin.page_title', 'Apartment Setup')} icon={<Home className="w-7 h-7 text-blue-500 dark:text-blue-400" />} />
      }
      footer={
        <FooterSection buttonLabel={t('apartmentLogin.btn_create_apt', 'create a new apartment')} onButtonClick={() => setIsCreateAptModalOpen(true)} text={t('apartmentLogin.footer_question', 'Your apartment is not on the list?')} buttonIcon={addOutline}  />
      }
    >
      <div className="flex flex-col flex-1 w-full space-y-6">
        {/* 3. Localized List Section Headers */}
        {myApartments.length > 0 && (
          <div className="flex flex-col">
            <SectionText title={t('apartmentLogin.section_my_apts', 'My Apartments')} />
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
            <SectionText title={t('apartmentLogin.section_available_apts', 'Available Apartments')} />
            <ApartmentsList 
              isLoading={isLoadingAll} 
              apartments={otherApartments} 
              onSelect={handleJoinRequest} 
              lock={true} 
            />
          </div>
        )}
      </div>

      <JoinRequestModal 
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        apartmentName={selectedApt?.display_name || null}
        apartmentId={selectedApt?.id || null}
      />
      <CreateApartmentModal 
        isModalOpen={isCreateAptModalOpen}
        onClose={() => setIsCreateAptModalOpen(false)}
        householdId={householdId}
      />
    </PageLayout>
  );
}
