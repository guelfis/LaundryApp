import { useState } from "react";
import { useTranslation } from "react-i18next";
import PageLayout from "../components/PageLayout";
import { PageHeader } from "../components/PageHeader";
import { Building } from "lucide-react";
import { useHistory } from "react-router-dom";
import { useGetUserHouselds, useSearchHousehold } from "../hooks/useHousehold";
import { LoadingSpinner } from "../components/LoadingSpinner";
import SlotCard from "../components/SlotCard";
import SectionText from "../components/SectionText";
import Button from "../components/Button";
import JoinHouseholdModal from "../household/JoinHouseholdModal";
import { ROUTES } from "../routes/routes.constants";
import { addOutline } from 'ionicons/icons';
import AddressSearch, { LocationResolution } from "../household/AddressSearch";
import { HouseholdData } from "../lib/databaseTypes";
import { IonLabel } from "@ionic/react";

export default function HouseholdLogin() {
    const { t } = useTranslation();
    const history = useHistory();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<LocationResolution | null>(null);
    
    const [selectedHousehold, SetSelectedHousehold] = useState<HouseholdData | null>(null);

    const { data: buildings = [], isLoading: isLoadingHouseholds } = useGetUserHouselds();
    const { 
        data: resolvedHousehold = null,
        isLoading: isLoadingSearch,
        error: searchError
      } = useSearchHousehold(
        selectedLocation?.latitude ?? 0, 
        selectedLocation?.longitude ?? 0, 
        { enabled: !!selectedLocation }
      );
    
    const handleLocationResolved = (location: LocationResolution) => {        
        setSelectedLocation(location); 
    };
    
    if (isLoadingHouseholds) return <LoadingSpinner />;
    if (searchError) {
        console.error("Supabase RPC Query Execution Failure:", searchError);
    }

    const onClickBuilding = (householdId: string) => {
        localStorage.setItem('householdId', householdId);
        history.push(ROUTES.APARTMENT_LOGIN);
    };
    console.log(selectedLocation);

    return (
        <PageLayout
            header={
                <PageHeader 
                    title={t('householdLogin.page_title', 'Household Setup')} 
                    icon={<Building className="w-7 h-7 text-blue-500 dark:text-blue-400" />} 
                />
            }
        >
            <div className="flex flex-col gap-2.5 mb-6">
                <SectionText title={t("householdLogin.header_your_buildings")}/>
                {buildings.length > 0 ? (
                    <div className="flex flex-col gap-3 px-2 mb-4">
                        {buildings.map((item) => (
                            <SlotCard
                                key={item.household_id}
                                title={item.household.name}
                                subtitle={item.household.address}
                                onClick={() => onClickBuilding(item.household_id)}
                            />
                        ))}
                    </div>
                ) : (
                    <span className="text-xs text-gray-400 pl-1 mt-1 mx-6 mb-4">{t("householdLogin.no_admin_buildings")}</span>
                )}

                <SectionText title={t("householdLogin.manage_actions")}/>
                <AddressSearch onLocationResolved={handleLocationResolved} />
                            
                {isLoadingSearch && <LoadingSpinner />}
    
                {!isLoadingSearch && resolvedHousehold && (
                    <div className="mt-2 animate-slideUp mb-32">
                        <SlotCard
                            title={resolvedHousehold.address}
                            subtitle={resolvedHousehold.name}
                            onClick={() => {
                                SetSelectedHousehold(resolvedHousehold);
                                setIsModalOpen(true);
                            }}
                        />
                    </div>
                )}
                {!isLoadingSearch && !resolvedHousehold && selectedLocation && (
                    <div className="flex flex-col gap-4">
                        <IonLabel className=" mx-6"> 
                            {t('householdLogin.no-results')}
                        </IonLabel>
                        <Button 
                            label={t("householdLogin.btn_create_new")} 
                            onClick={() => {
                                history.push({
                                    pathname: ROUTES.HOUSEHOLD_SETUP,
                                    state: { 
                                        householdLocation: {
                                            formattedAddress: selectedLocation?.formattedAddress || '',
                                            latitude: selectedLocation?.latitude ?? 0,
                                            longitude: selectedLocation?.longitude ?? 0,
                                            timezone: selectedLocation?.timezone || 'Europe/Zurich'
                                        }
                                    }
                                });
                            }} 
                            icon={addOutline} /> 
                    </div>
                )}
             </div>

             <JoinHouseholdModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} householdData={selectedHousehold} />
        </PageLayout>
    );
}
