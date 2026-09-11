import { useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Building } from "lucide-react";
import { IonText, IonToast } from "@ionic/react";

import PageLayout from "../baseComponents/PageLayout";
import { PageHeader } from "../baseComponents/PageHeader";
import SectionText from "../baseComponents/SectionText";
import TextInput from "../baseComponents/TextInput";
import FooterSection from "../components/FooterSection";
import SlotCard from "../baseComponents/SlotCard";

import { ROUTES } from "../routes/routes.constants";
import { LocationResolution } from "../household/AddressSearch";
import { useCreateHousehold } from "../hooks/useHousehold";

export default function CreateHousehold() {
  const location = useLocation<{ householdLocation: LocationResolution }>();
  const history = useHistory();
  const { t } = useTranslation();
  const { mutate: createHousehold, isPending } = useCreateHousehold();
  const [toastMessage, setToastMessage] = useState<string>('');

  const householdLocation = location.state?.householdLocation;
  const shortenedStreetName = householdLocation.formattedAddress.split(',')[0].trim();

  const [name, setName] = useState<string>(shortenedStreetName);

  const validateName = (value: string): string | null => {
    if (!value.trim()) {
      return t('apartmentNameSection.error_empty', "Can't be empty");
    }
    return null;
  };

  // Safe layout block check: redirects if state history suitcase is empty
  if (!householdLocation) {
    history.push(ROUTES.HOUSEHOLD_LOGIN);
    return null; 
  }

  const handleCreateBuilding = () => {
    if (!name.trim()) return;

    // Esegue la mutazione passando i parametri richiesti
    createHousehold({
      name: name.trim(),
      formattedAddress: householdLocation.formattedAddress,
      latitude: householdLocation.latitude,
      longitude: householdLocation.longitude,
      timezone: householdLocation.timezone
    }, {
      onSuccess: (data) => {
        setToastMessage(t('createHousehold.success_alert'));
        
        localStorage.setItem('householdId', data.household_id);
        
        setTimeout(() => {
          history.push(ROUTES.APARTMENT_LOGIN);
        }, 1500);
      },
      onError: () => {
        setToastMessage(t('createHousehold.error_alert'));
      }
    });
  };

  return (
    <PageLayout 
      header={
        <PageHeader 
          title={t('createHousehold.title')} 
          icon={<Building className="w-7 h-7 text-blue-500" />} 
          onBack={() => history.push(ROUTES.HOUSEHOLD_LOGIN)} 
        />
      }
      footer={
        <FooterSection 
          buttonLabel={t('createHousehold.btn_create', 'Create Building')} 
          onButtonClick={handleCreateBuilding}
          disableButton={isPending || !name.trim()}
        />
      }
    >
      <div style={styles.formContainer}>

        {/* Informative Subtext Details */}
        <IonText style={styles.descriptionText}>
          {t('createHousehold.description')}
        </IonText>

        {/* Selected Address Display Card */}
        <SlotCard 
          title={householdLocation.formattedAddress} 
          icon={<Building className="w-5 h-5" />} 
        />

        {/* Dynamic Name Input Segment */}
        <SectionText 
          title={t('createHousehold.name')} 
        />
        <TextInput
          value={name}
          onChange={(val: string) => setName(val)}
          autoFocus={true}
          errorFn={validateName}
          disabled={isPending}
        /> 
      </div>
      <IonToast
        isOpen={!!toastMessage}
        message={toastMessage}
        duration={3000}
        onDidDismiss={() => setToastMessage('')}
      />
    </PageLayout>
  );
}

const styles = {
  formContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    marginTop: '8px',
  },
  descriptionText: {
    fontSize: '14px',
    color: 'var(--ion-color-step-400, #545454)',
    padding: '0 4px',
    marginTop: '4px',
  }
};
