import { useState, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { 
  IonItem, 
  IonLabel, 
  IonNote, 
  IonSpinner,
  IonToast,
} from "@ionic/react";
import { LogOut, Settings, Mail, ShieldAlert, FileText, Info} from "lucide-react";
import { resolveCurrentUserEmail, resolveCurrentUserId, signOutUser } from "../auth/authUtils";
import { ROUTES } from "../routes/routes.constants";
import PageLayout from "../components/PageLayout";
import { PageHeader } from "../components/PageHeader";
import { writeSupportTicket } from "../lib/supportTickets";
import BugForm from "../components/BugForm";
import { BookingContext } from "../contexts/BookingContext";

export default function UserSettings() {
    const { t } = useTranslation();
    const history = useHistory();
    const [loading, setLoading] = useState(false);
    const [sendingBug, setSendingBug] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    // UI state to toggle the bug report form inside the container block
    const [showBugForm, setShowBugForm] = useState(false);
    const [bugDescription, setBugDescription] = useState("");
    const [toastMessage, setToastMessage] = useState<string>('');
    const [toastColor, setToastColor] = useState<'success' | 'warning' | 'danger'>('success');

    
    const { householdId, apartmentId } = useContext(BookingContext)!;

    // Safe lifecycle fetch: Resolves the async promise without loop crashes
    useEffect(() => {
        const loadUserMetadata = async () => {
            const userId =  await resolveCurrentUserId();
            setUserId(userId);
            const email = await resolveCurrentUserEmail();
            setUserEmail(email);
        };
        loadUserMetadata();
    }, []);

    const handleContactSupport = () => {
    // Pre-fills a clean subject line containing the version number for context
        const subject = encodeURIComponent(`${t('support.email_subject')} - v${__APP_VERSION__}`);
        
        // Opens mail client cleanly without injecting any message body text
        window.location.href = `mailto:laundryplanner.support@gmail.com?subject=${subject}`;
    };

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

    // Submits the bug with automated tracking parameters directly to Supabase
    const handleInsertBugReport = async () => {
        if (!bugDescription.trim()) return;

        setSendingBug(true);
        try {
            // Invoke the standalone database worker function directly
            await writeSupportTicket({
                profile_id: userId ?? '',
                apartment_id: apartmentId ?? undefined,
                household_id: householdId ?? undefined,
                ticketType: 'bug',
                bugDescription: bugDescription,
                app_version: __APP_VERSION__,
                userAgent: navigator.userAgent
            });

            setToastMessage(t('settings.bug_success'));
            setToastColor('success');
            setBugDescription("");
            setShowBugForm(false);
        } catch (err) {
            console.error("Failed to post ticket:", err);
            setToastMessage(t('settings.bug_error'));
            setToastColor('danger');
        } finally {
            setSendingBug(false);
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
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('settings.profile_header', 'Logged In Account')}
                </span>
                <span className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">
                    {userEmail ?? t('settings.loading_user', 'Loading email...')}
                </span>
            </div>

            {/* Support & Feedback Block */}
            <div className="flex flex-col bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
                <div className="px-4 pt-4 pb-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('settings.support_header')}
                    </span>
                </div>
                
                {/* Contact Support */}
                <IonItem 
                    button 
                    detail={true} 
                    lines="full"
                    onClick={handleContactSupport}
                >
                    {/* Fixed slot container for Lucide icon */}
                    <div slot="start" className="flex items-center justify-center mr-3">
                        <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </div>
                    <IonLabel className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {t('settings.btn_contact_support')}
                    </IonLabel>
                </IonItem>

                {/* Report a Bug Trigger Item */}
                {!showBugForm ? (
                  <IonItem 
                      button 
                      detail={true} 
                      lines="none"
                      onClick={() => setShowBugForm(true)}
                  >
                      <div slot="start" className="flex items-center justify-center mr-3">
                          <ShieldAlert className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      </div>
                      <IonLabel className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {t('settings.btn_report_bug', 'Report a Bug')}
                      </IonLabel>
                  </IonItem>
              ) : (
                  <BugForm 
                      setShowBugForm={setShowBugForm}
                      bugDescription={bugDescription}
                      setBugDescription={setBugDescription}
                      sendingBug={sendingBug}
                      onSend={handleInsertBugReport}
                  />
              )}
            </div>

            {/* About & Legal Block */}
            <div className="flex flex-col bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
                <div className="px-4 pt-4 pb-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('settings.legal_header')}
                    </span>
                </div>

                {/* Terms of Service */}
                <IonItem 
                    button 
                    detail={true} 
                    lines="full"
                    onClick={() => setToastMessage('Show Terms')}
                >
                    {/* Fixed slot container for Lucide icon */}
                    <div slot="start" className="flex items-center justify-center mr-3">
                        <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </div>
                    <IonLabel className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {t('settings.btn_terms')}
                    </IonLabel>
                </IonItem>

                {/* App Version Info (Non-clickable) */}
                <IonItem lines="none">
                    {/* Fixed slot container for Lucide icon */}
                    <div slot="start" className="flex items-center justify-center mr-3">
                        <Info className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </div>
                    <IonLabel className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {t('settings.lbl_version')}
                    </IonLabel>
                    <IonNote slot="end" className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                        {__APP_VERSION__}
                    </IonNote>
                </IonItem>
            </div>

            {/* Destructive Sign Out Button */}
            <button
                onClick={handleLogout}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full p-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-900 text-red-600 dark:text-red-400 font-semibold transition-colors disabled:opacity-50"
            >
                {loading ? (
                    <IonSpinner name="crescent" color="danger" className="w-5 h-5" />
                ) : (
                  <>
                    <LogOut className="w-5 h-5" />
                    <span>{t('settings.btn_logout', 'Log Out')}</span>
                  </>
                )}
            </button>
            <IonToast
              isOpen={!!toastMessage}
              message={toastMessage}
              duration={3000}
              onDidDismiss={() => setToastMessage('')}
              color={toastColor}
            />
        </div>
      </PageLayout>
    );
}
