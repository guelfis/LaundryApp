import { useEffect, useMemo, useRef, useState  } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Building } from "lucide-react";
import { IonText, IonNote, IonToast } from "@ionic/react";
import { QRCodeSVG } from 'qrcode.react'; 
import {  printOutline } from 'ionicons/icons';

import PageLayout from "../baseComponents/PageLayout";
import { PageHeader } from "../baseComponents/PageHeader";
import SlotCard from "../baseComponents/SlotCard";
import SectionText from "../baseComponents/SectionText";
import { LoadingSpinner } from "../baseComponents/LoadingSpinner";

import { useDeleteLeaveHousehold, useHouseholdDetails, useHouseholdMembers } from "../hooks/useHousehold";
import { useBookingFilters } from "../hooks/useBookings";
import { ROUTES } from "../routes/routes.constants";
import Button from "../baseComponents/Button";
import { printLaundryFlier } from "../services/printService";
import LaundryIcon from "../logo/LaundryIcon"; 
import LeaveDeleteActionsBlock from "../components/LeaveDeleteActionsBlock";

export default function BuildingTab() {
  const { t } = useTranslation();
  const history = useHistory();
  const logoRef = useRef<HTMLDivElement>(null);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastColor, setToastColor] = useState<'success' | 'warning' | 'danger'>('success');   

  const { householdId, isAdminMode } = useBookingFilters();
  const { data: householdData, isPending } = useHouseholdDetails(householdId);
  const {deleteHousehold, isDeletingHousehold, leaveHousehold, isLeavingHousehold} = useDeleteLeaveHousehold();
  const {data: householdMembers = [], isPending:isMembersPending} = useHouseholdMembers(householdId);

  const buildingAdmins = useMemo(() => householdMembers.filter(m => m.household_role === 'admin'), [householdMembers]);
  
  const canDeleteBuilding = isAdminMode;
  const canLeaveBuilding = !isAdminMode || buildingAdmins.length > 1;

  useEffect(() => {
    if (!isPending && !householdData) {
      console.error("No household data found, redirecting...");
      history.push(ROUTES.APARTMENT_LOGIN);
    }
  }, [householdData, isPending, history]);

  if (!householdData) {
    return null;
  }

  const fullAddress = householdData.address || '';
  const shortenedStreetName = fullAddress.includes(',') 
    ? fullAddress.split(',')[0].trim() 
    : fullAddress || t('buildingTab.unknown_address', 'Unknown Address');

  const qrPayload = JSON.stringify({
    action: "join_household",
    id: householdData.id,
    code: householdData.access_code
  });

  const handleDeleteBuilding = async () => {
    const confirmFirst = window.confirm(t('buildingTab.delete_warning'));
    if (confirmFirst) {
        try {
            await deleteHousehold(householdId);
            setToastMessage(t('buildingTab.delete_success'));
            setToastColor('success');
            history.push(ROUTES.HOUSEHOLD_LOGIN, { replace: true }); 
        } catch (err) {
            const errorInstance = err as Error;
            console.error(t('buildingTab.delete_fail'), err);
            setToastMessage(`${t('buildingTab.delete_fail')}: ${errorInstance.message}`);
            setToastColor('danger');
        }
    }
      };
    
  const handleLeaveBuilding = async () => {
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
  }

  const handlePrintFlier = async () => {
    const componentMarkup = logoRef.current?.innerHTML || '';

    await printLaundryFlier({
      headline: t('flier.flier_headline'),
      universalTitle: t('flier.universal_step_title'),
      universalDesc: t('flier.universal_step_desc'),
      manualTitle: t('flier.manual_title'),
      manualDescLink: t('flier.manual_desc_link'),
      manualDescCode: t('flier.manual_desc_code'), 
      accessCode: householdData.access_code,
      buildingId: householdData.id,
      logoHtml: componentMarkup
    });
  };

  if (isPending || isMembersPending) {
    return (
      <PageLayout>
        <div style={styles.centerSpinner}>
          <LoadingSpinner />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      header={
        <PageHeader 
          title={t('dashboard.household')} 
          icon={<Building className="w-7 h-7 text-blue-500" />} 
          onBack={() => history.push(ROUTES.APARTMENT_LOGIN)} 
        />
      }
    >
      {/* 
        5. HIDDEN COMPONENT REFERENCE SLOT:
        This mounts your actual React component quietly in the background. 
        It has display: none so it remains completely invisible to users on screen, 
        but is fully available to the print service when clicking print.
      */}
      <div ref={logoRef} style={{ display: 'none' }}>
        <LaundryIcon />
      </div>
      
      <div style={{
        display: 'flex', 
        flexDirection: 'column' as const, 
        width: '100%',
        padding: '16px 20px 20px 20px',
        boxSizing: 'border-box' as const,
        minHeight: 'min-content',
        gap: '24px' // Sets a consistent, clean vertical gap between all your Section blocks
      }}>
        <SlotCard 
          title={shortenedStreetName} 
          subtitle={fullAddress}
          icon={<Building className="w-5 h-5" />} 
        />
        
        <div style={styles.section}>
          <SectionText title={t('buildingTab.accessCode')} />
          
          <div style={styles.codeTextContainer}>
            <span style={styles.codeText}>{householdData.access_code}</span>
          </div>

          <IonNote style={styles.instructions}>
            {t('buildingTab.shareInstructions')}
          </IonNote>
        </div>

        <div style={styles.qrSection}>
          <IonText color="medium" style={styles.qrLabel}>
            {t('buildingTab.qr_label')}
          </IonText>
          
          <div style={styles.qrWhiteBox}>
            <QRCodeSVG
              value={qrPayload}
              size={180}
              bgColor="#ffffff"
              fgColor="#000000"
              level="H" 
            />
          </div>
        </div>
        <div style={styles.printActionRow}>
            <Button 
              label={t('buildingTab.btn_print')} 
              onClick={handlePrintFlier} 
              icon={printOutline} 
            />
        </div>

        <LeaveDeleteActionsBlock 
          onLeave={handleLeaveBuilding}
          onDelete={handleDeleteBuilding}
          canLeave={canLeaveBuilding}
          canDelete={canDeleteBuilding}
          isLeaving={isLeavingHousehold}
          isDeleting={isDeletingHousehold}
          leaveLabelKey={t('buildingTab.leave')}
          deleteLabelKey={t('buildingTab.delete')}
          infoTitleKey={t('buildingTab.info_title')}
          infoMessageKey={t('buildingTab.info_message')} 
        />      
        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage}
          duration={3000}
          onDidDismiss={() => setToastMessage('')}
          color={toastColor}
        />  
        </div>
    </PageLayout>
  );
}

const styles = {
  centerSpinner: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
    width: '100%'
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  },
  codeTextContainer: {
    width: '100%',
    background: 'var(--ion-color-step-50, #f2f2f2)',
    padding: '14px',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '4px',
    overflow: 'hidden',
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '4px',
    color: 'var(--ion-text-color, #000000)'
  },
  instructions: {
    fontSize: '13px',
    textAlign: 'center' as const,
    marginTop: '6px',
    display: 'block',
    lineHeight: '18px'
  },
  qrSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginTop: '8px',
  },
  qrLabel: {
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
  },
  qrWhiteBox: {
    padding: '16px',
    backgroundColor: '#ffffff', 
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--ion-color-step-150, #d9d9d9)'
  },
  printActionRow: {
    width: '100%',
    marginBottom: '10px'
  }
};
