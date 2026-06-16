import { useHistory } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import PageLayout from "../components/PageLayout";
import { ROUTES } from "../routes/routes.constants";
import { useTranslation } from "react-i18next";
import { Building } from "lucide-react";

export default function BuildingTab() {
  const { t } = useTranslation();
  const history = useHistory();
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
      <div 
        style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            width: '100%',
            padding: '16px 20px',
            boxSizing: 'border-box',
            gap: '24px' // Sets a consistent, clean vertical gap between all your Section blocks
        }}
      >
          <></>
      </div>
    </PageLayout>
  );
}
