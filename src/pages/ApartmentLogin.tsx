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
import { getCleanStorageItem } from '../auth/authUtils';
import { ROUTES } from '../routes/routes.constants';
import { addOutline, constructOutline, logOutOutline } from 'ionicons/icons';
import { IonIcon, IonText, IonButton, IonToast } from '@ionic/react';
import { useDeleteLeaveHousehold, useGetUserHouselds } from '../hooks/useHousehold';
import SlotCard from '../components/SlotCard';

export default function ApartmentLogin() {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const householdId = getCleanStorageItem('householdId') || '';
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastColor, setToastColor] = useState<'success' | 'warning' | 'danger'>('success');   
  
  const { data: myApartmentsRaw = [], isLoading: isLoadingMy } = useMyApartments(householdId);
  const { data: allApartmentsRaw = [], isLoading: isLoadingAll } = useApartments(householdId);
  const { data: buildings = [], isLoading: isLoadingHouseholds } = useGetUserHouselds();
  const { leaveHousehold, isLeavingHousehold} = useDeleteLeaveHousehold();

  const myApartments = useMemo(() => (myApartmentsRaw || []).filter((apt): apt is Apartment => apt !== null && apt !== undefined), [myApartmentsRaw]);
  const allApartments = useMemo(() => (allApartmentsRaw || []).filter((apt): apt is Apartment => apt !== null && apt !== undefined), [allApartmentsRaw]);
  
  const currentBuilding = useMemo(() => {
    return (buildings || []).find(build => build && build.household_id === householdId);
  }, [buildings, householdId]);
  const isBuildingAdmin = currentBuilding?.household_role === 'admin';

  const { mutateAsync: joinViaLink, isPending: isJoining } = useJoinViaLink();

  const [selectedApt, setSelectedApt] = useState<Apartment | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreateAptModalOpen, setIsCreateAptModalOpen] = useState(false);

  const otherApartments = useMemo(() => {
    return allApartments.filter(
      (apt) => !myApartments.some((myapt) => myapt && apt.id === myapt.id)
    );
  }, [allApartments, myApartments]);

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  useEffect(() => {
    const handleAutoJoin = async (token: string) => {
      try {
        await joinViaLink(token);
        setToastMessage(t('apartmentLogin.alert_join_success', 'Successfully joined the apartment!'));
        setToastColor('success');
        history.push(ROUTES.DASHBOARD_MAIN, { replace: true });
      } catch (err) {
        console.error("Link processing error:", err);
        setToastMessage(t('apartmentLogin.alert_join_error', 'This invitation link is invalid, expired, or fully claimed.'));
        setToastColor('danger');
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
    setTimeout(() => history.push(ROUTES.DASHBOARD_MAIN), 0);
  };

  const enterAsAdmin = () => {
    localStorage.removeItem('apartmentId'); 
    localStorage.removeItem('apartmentName');
    localStorage.setItem('isAdminModeActive', 'true');
    setTimeout(() => history.push(ROUTES.DASHBOARD_MAIN), 0);
  };

  const  handleLeaveBuilding =  async () =>  {
    if (window.confirm(t('buildingTab.release_warning'))) {
      try {
          await leaveHousehold(householdId);
          history.push(ROUTES.HOUSEHOLD_LOGIN, { replace: true });
      } catch (err) {
          const errorInstance = err as Error;
          console.error(t('buildingTab.release_fail'), err);
          setToastMessage(`${t('buildingTab.release_fail')}: ${errorInstance.message}`);
          setToastColor('danger');
      }
    }
  };

  const handleJoinRequest = (apt: Apartment) => {
    setSelectedApt(apt);
    setIsJoinModalOpen(true);
  };

  if (!householdId) {
    return <Redirect to={ROUTES.HOUSEHOLD_LOGIN} />;
  }

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

  if (isLoadingAll || isLoadingMy || isLoadingHouseholds || isLeavingHousehold) {
    return (
      <PageLayout><LoadingSpinner /></PageLayout>
    );
  }

  return (
    <PageLayout
      header={
        <PageHeader 
          title={t('apartmentLogin.page_title', 'Apartment Setup')} 
          icon={<Home className="w-7 h-7 text-blue-500 dark:text-blue-400" />} 
          // 1. ADDED LEAVE BUILDING BUTTON TO THE RIGHT SIDE OF HEADER
          endContent={
            <IonButton fill="clear" color="danger" onClick={handleLeaveBuilding} style={{ margin: 0 }}>
              <IonIcon slot="icon-only" icon={logOutOutline} />
            </IonButton>
          }
          onBack={
            () => history.push(ROUTES.HOUSEHOLD_LOGIN)
          }
        />
      }
    >
      <div style={{
        display: 'flex', 
        flexDirection: 'column', 
        width: '100%',
        boxSizing: 'border-box',
        padding: '16px 20px 40px 20px',
        gap: '28px'
      }}>
        
        {/* MANAGEMENT HERO ROW */}
        {isBuildingAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <SectionText title={t('apartmentLogin.section_admin_actions')} />
            <SlotCard 
              onClick={enterAsAdmin}
              title={t('apartmentLogin.enter_admin')}
              icon={<IonIcon icon={constructOutline} style={{ fontSize: '20px', color: '#d97706' }} />}
              style={{
                borderColor: 'var(--ion-color-step-200, #333333)',
              }}
              endContent={
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Admin
                </span>
              }
            />
          </div>
        )}

        {/* MY APARTMENTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SectionText title={t('apartmentLogin.section_my_apts', 'My Units')} />
          {myApartments.length > 0 ? (
            <ApartmentsList isLoading={isLoadingMy} apartments={myApartments} onSelect={enterApartment} lock={false} />
          ) : (
            <IonText color="medium" style={{ display: 'block', fontSize: '14px', paddingLeft: '4px' }}>
              {t('apartmentLogin.no_your_apartment', 'You are not checked into any units yet')}
            </IonText>
          )}
        </div>

        {/* AVAILABLE APARTMENTS & NEW CREATION ACTION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SectionText title={t('apartmentLogin.section_available_apts', 'Available Units')} />
          
          {otherApartments.length > 0 ? (
            <ApartmentsList isLoading={isLoadingAll} apartments={otherApartments} onSelect={handleJoinRequest} lock={true} />
          ) : (
            <IonText color="medium" style={{ display: 'block', fontSize: '14px', paddingLeft: '4px', marginBottom: '4px' }}>
              {t('apartmentLogin.no_available_apartments', 'No other spaces found in this building')}
            </IonText>
          )}

          {/* 2. RE-INTEGRATED DYNAMIC CREATE APARTMENT ACTION ROW */}
          <div style={{ marginTop: '4px', width: '100%' }}>
            <IonButton 
              fill="clear" 
              expand="block"
              onClick={() => setIsCreateAptModalOpen(true)}
              style={{ 
                '--color': 'var(--ion-color-primary, #3b82f6)', 
                fontWeight: '600',
                fontSize: '14px',
                letterSpacing: '0.5px'
              }}
            >
              <IonIcon slot="start" icon={addOutline} />
              {t('apartmentLogin.btn_create_apt', 'Create a new apartment')}
            </IonButton>
          </div>
        </div>

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
      <IonToast
        isOpen={!!toastMessage}
        message={toastMessage}
        duration={3000}
        onDidDismiss={() => setToastMessage('')}
        color={toastColor}
      />  
    </PageLayout>
  );
}
