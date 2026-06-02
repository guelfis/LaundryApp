import { Building } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import PageLayout from "../components/PageLayout";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";


export default function CreateHousehold() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <PageLayout header={<PageHeader title={t('createHousehold.title')} icon={<Building className="w-7 h-7 text-blue-500" />} onBack={() => navigate('/household-login')} />} >
            <></>
        </PageLayout>
    )
}