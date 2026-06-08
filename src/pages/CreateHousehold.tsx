import { Building } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import PageLayout from "../components/PageLayout";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ROUTES } from "../routes/routes.constants";


export default function CreateHousehold() {
    const history = useHistory();
    const { t } = useTranslation();

    return (
        <PageLayout header={<PageHeader title={t('createHousehold.title')} icon={<Building className="w-7 h-7 text-blue-500" />} onBack={() => history.push(ROUTES.HOUSEHOLD_LOGIN)} />} >
            <></>
        </PageLayout>
    )
}