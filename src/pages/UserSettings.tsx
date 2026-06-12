import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";
import { resolveCurrentUserEmail, signOutUser } from "../auth/authUtils";
import { ROUTES } from "../routes/routes.constants";
import PageLayout from "../components/PageLayout";
import { PageHeader } from "../components/PageHeader";

export default function UserSettings() {
    const { t } = useTranslation();
    const history = useHistory();
    const [loading, setLoading] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    // Safe lifecycle fetch: Resolves the async promise without loop crashes
    useEffect(() => {
        const loadUserMetadata = async () => {
            const email = await resolveCurrentUserEmail();
            setUserEmail(email);
        };
        loadUserMetadata();
    }, []);

    // Handle sign out via your exported helper function
    const handleLogout = async () => {
      setLoading(true);
      const success = await signOutUser();
      setLoading(false);

      if (success) {
        history.push(ROUTES.LOGIN);
        localStorage.removeItem('apartmentId');
        localStorage.removeItem('apartmentName');
        localStorage.removeItem('householdId');
        localStorage.removeItem('householdTimezone');
      }
    };

    return (
      <PageLayout 
        header={
          <PageHeader 
            title={t('settings.page_title')} 
            icon={<Settings className="w-7 h-7 text-blue-500" />} 
            onBack={() => history.push(ROUTES.APARTMENT_LOGIN)} 
          />
        }
      >
        <div className="flex flex-col gap-6 p-4 max-w-md mx-auto w-full">
            {/* Profile Information Block */}
            <div className="flex flex-col gap-1 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('settings.profile_header', 'Logged In Account')}
                </span>
                <span className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">
                    {userEmail ?? t('settings.loading_user', 'Loading email...')}
                </span>
            </div>

            {/* Destructive Sign Out Button */}
            <button
                onClick={handleLogout}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full p-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-900 text-red-600 dark:text-red-400 font-semibold transition-colors disabled:opacity-50"
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogOut className="w-5 h-5" />
                    <span>{t('settings.btn_logout', 'Log Out')}</span>
                  </>
                )}
            </button>
        </div>
      </PageLayout>
    );
}
