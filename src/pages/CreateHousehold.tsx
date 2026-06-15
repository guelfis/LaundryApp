import { Building } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import PageLayout from "../components/PageLayout";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ROUTES } from "../routes/routes.constants";
import { LocationResolution } from "../household/AddressSearch";

export default function CreateHousehold() {
  const location = useLocation<{ householdLocation: LocationResolution }>();
    const history = useHistory();
    const { t } = useTranslation();
  const householdLocation = location.state?.householdLocation;

  // Safe layout block check: redirects if state history suitcase is empty
  if (!householdLocation) {
    history.push(ROUTES.HOUSEHOLD_LOGIN);
    return null; 
  }

    return (
        <PageLayout header={<PageHeader title={t('createHousehold.title')} icon={<Building className="w-7 h-7 text-blue-500" />} onBack={() => history.push(ROUTES.HOUSEHOLD_LOGIN)} />} >
            <></>
        </PageLayout>
    )
}