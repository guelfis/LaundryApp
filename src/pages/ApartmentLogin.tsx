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
import {addOutline, constructOutline} from 'ionicons/icons'
import { IonIcon, IonText } from '@ionic/react';
import { useGetUserHouselds } from '../hooks/useHousehold';
import SlotCard from '../components/SlotCard';

export default function ApartmentLogin() {
  const { t } = useTranslation();
  const householdId = getCleanStorageItem('householdId') || '';
  
  const { data: myApartmentsRaw = [], isLoading: isLoadingMy } = useMyApartments(householdId);
  const { data: allApartmentsRaw = [], isLoading: isLoadingAll } = useApartments(householdId);
  const { data: buildings = [], isLoading: isLoadingHouseholds } = useGetUserHouselds();

  
  const myApartments = useMemo(() => (myApartmentsRaw || []).filter((apt): apt is Apartment => apt !== null && apt !== undefined), [myApartmentsRaw]);
  const allApartments = useMemo(() => (allApartmentsRaw || []).filter((apt): apt is Apartment => apt !== null && apt !== undefined), [allApartmentsRaw]);
  
  const currentBuilding = useMemo(() => {
      return (buildings || []).find(build => build && build.household_id === householdId);
    }, [buildings, householdId]);
  const isBuildingAdmin = currentBuilding?.role === 'admin';

  const location = useLocation();
   const searchParams = useMemo(() => {
    return new URLSearchParams(location.search);
  }, [location.search]);

  const { mutateAsync: joinViaLink, isPending: isJoining } = useJoinViaLink();

  const [selectedApt, setSelectedApt] = useState<Apartment | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreateAptModalOpen, setIsCreateAptModalOpen] = useState(false); // Fixed spelling typo

  const otherApartments = useMemo(() => {
    return allApartments.filter(
      (apt) => !myApartments.some((myapt) => myapt && apt.id === myapt.id)
    );
  }, [allApartments, myApartments]);

  console.log(householdId, myApartments);
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
    localStorage.removeItem('isAdminModeActive');
    localStorage.setItem('apartmentId', apt.id);
    localStorage.setItem('apartmentName', apt.display_name);
  
  setTimeout(() => {
    history.push(ROUTES.DASHBOARD_MAIN);
  }, 0);
  };

  const enterAsAdmin = () => {
    localStorage.removeItem('apartmentId'); 
    localStorage.removeItem('apartmentName');
    localStorage.setItem('isAdminModeActive', 'true');
    
    setTimeout(() => {
      history.push(ROUTES.DASHBOARD_MAIN);
    }, 0);
  }

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

  if (isLoadingAll || isLoadingMy || isLoadingHouseholds) {
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
      <div className="flex flex-col flex-1 w-full space-y-4" style={{marginBottom:'8px'}}>
        <SectionText title={t('apartmentLogin.section_my_apts', 'My Apartments')} />
        {/* 3. Localized List Section Headers */}
        {isBuildingAdmin && (
          <div style={{padding: '16px', marginBottom:'-32px'}}>
            <SlotCard onClick={() => {
              enterAsAdmin();
            }}
            title={t('apartmentLogin.enter_admin')}
            icon={<IonIcon icon={constructOutline} />}
            />
          </div>
        )}
        {myApartments.length > 0 ? (
          <div className="flex flex-col">
            <ApartmentsList 
              isLoading={isLoadingMy} 
              apartments={myApartments} 
              onSelect={enterApartment} 
              lock={false} 
            />
          </div>
        ):(
          <IonText>
            {t('apartmentLogin.no_your_apartment')}
          </IonText>
        )}

        <SectionText title={t('apartmentLogin.section_available_apts', 'Available Apartments')} />
        {/* ALWAYS show Other Apartments if they exist */}
        {otherApartments.length > 0 ? (
          <div className="flex-grow flex flex-col">
            <ApartmentsList 
              isLoading={isLoadingAll} 
              apartments={otherApartments} 
              onSelect={handleJoinRequest} 
              lock={true} 
            />
          </div>
        ):(
          <IonText>
            {t('apartmentLogin.no_available_apartments')}
          </IonText>
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
