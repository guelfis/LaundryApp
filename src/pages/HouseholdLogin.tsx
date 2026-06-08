import { useTranslation } from "react-i18next";
import PageLayout from "../components/PageLayout";
import { PageHeader } from "../components/PageHeader";
import { Building, Plus, Search } from "lucide-react";
import { useHistory } from "react-router-dom";
import { useGetUserHouselds } from "../hooks/useHousehold";
import { LoadingSpinner } from "../components/LoadingSpinner";
import SlotCard from "../components/SlotCard";
import SectionText from "../components/SectionText";
import Button from "../components/Button";
import { useState } from "react";
import SearchHouseholdModal from "../household/SearchHouseholdModal";
import { ROUTES } from "../routes/routes.constants";

export default function HouseholdLogin() {
    const { t } = useTranslation();
    const history = useHistory();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: buildings = [], isLoading: isLoadingHouseholds } = useGetUserHouselds();

    if (isLoadingHouseholds) return <LoadingSpinner />;

    const onClickBuilding = (householdId: string) => {
        localStorage.setItem('householdId', householdId);
        history.push(ROUTES.APARTMENT_LOGIN);
    };

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
                 {/* VISUAL DIVIDER */}
                {/* <hr className="border-gray-100 dark:border-gray-800 mt-2 mb-4" /> */}
                <SectionText title={t("householdLogin.manage_actions")}/>
                <div className="flex flex-col gap-3 px-4 w-full">
                    <Button label={t("householdLogin.btn_join_existing")} onClick={() => setIsModalOpen(true)} icon={<Search className="w-4 h-4" />} />
                    <Button label={t("householdLogin.btn_create_new")} onClick={() => history.push(ROUTES.HOUSEHOLD_SETUP)} icon={<Plus className="w-4 h-4" />} /> 
                </div>         
             </div>

             <SearchHouseholdModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

            
        </PageLayout>
    );
}
