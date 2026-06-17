import { useEffect } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Building } from "lucide-react";
import { IonText, IonNote } from "@ionic/react";
import { QRCodeSVG } from 'qrcode.react'; 

import PageLayout from "../components/PageLayout";
import { PageHeader } from "../components/PageHeader";
import SlotCard from "../components/SlotCard";
import SectionText from "../components/SectionText";
import { LoadingSpinner } from "../components/LoadingSpinner";

import { useHouseholdDetails } from "../hooks/useHousehold";
import { useBookingFilters } from "../hooks/useBookings";
import { ROUTES } from "../routes/routes.constants";

export default function BuildingTab() {
  const { t } = useTranslation();
  const history = useHistory();

  const { householdId } = useBookingFilters();
  const { data: householdData, isPending } = useHouseholdDetails(householdId);

  useEffect(() => {
    if (!isPending && !householdData) {
      console.error("No household data found, redirecting...");
      history.push(ROUTES.APARTMENT_LOGIN);
    }
  }, [householdData, isPending, history]);

  if (isPending) {
    return (
      <PageLayout>
        <div style={styles.centerSpinner}>
          <LoadingSpinner />
        </div>
      </PageLayout>
    );
  }

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
      <div style={{
        display: 'flex', 
        flexDirection: 'column' as const, 
        width: '100%',
        padding: '16px 20px 40px 20px',
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
    marginBottom: '24px'
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
  }
};
