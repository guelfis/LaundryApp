import { useTranslation } from "react-i18next";
import PageLayout from "../components/PageLayout";
import { PageHeader } from "../components/PageHeader";
import { Building, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetUserHouselds } from "../hooks/useHousehold";
import { LoadingSpinner } from "../components/LoadingSpinner";
import SlotCard from "../components/SlotCard";
import SectionText from "../components/SectionText";
import FooterSection from "../components/FooterSection";

export default function HouseholdLogin() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // 1. DATABASE FETCH: Check if this user is already an admin of any buildings
    const { data: administeredBuildings = [], isLoading: isLoadingAdmins } = useGetUserHouselds();
    
    if (isLoadingAdmins) return <LoadingSpinner />;
    return (
        <PageLayout
            header={
                <PageHeader 
                    title={t('householdLogin.page_title', 'Household Setup')} 
                    icon={<Building className="w-7 h-7 text-blue-500 dark:text-blue-400" />} 
                />
            }
            footer={
                <FooterSection 
                    buttonLabel={t("householdLogin.btn_create_new")} 
                    buttonIcon={<Plus className="w-4 h-4" />} 
                    text={t("householdLogin.footer_description")} 
                    onButtonClick={() => navigate('/create-household')} 
                />
            }
        >
            {/* SECTION 1: RESUME SESSION (IF ACTIVE ADMIN BUILDINGS EXIST) */}
            {administeredBuildings.length > 0 && (
                <div className="flex flex-col gap-2.5">
                <SectionText title={t("householdLogin.header_your_buildings")}/>
                <div className="flex flex-col gap-3 w-full">
                    {administeredBuildings.map((item) => (
                        <SlotCard
                            key={item.household_id}
                            title={item.household.name}
                            subtitle={item.household.address}
                            onClick={() => navigate(`/dashboard/admin/${item.household_id}`)}
                        />
                    ))}
                </div>
                </div>
            )}

            {/* SECTION 2: JOIN AN EXISTING HOUSEHOLD (CODE / QR INTERFACE) */}
            <div className="flex flex-col gap-2.5">
                <SectionText title={t("householdLogin.header_join_existing")}/>
                // TODO: add the way to insert the address
            </div>

        </PageLayout>
        );
}