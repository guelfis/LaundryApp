import { useState, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { logOutOutline, trashOutline } from 'ionicons/icons';

import { 
  IonItem, 
  IonToast,
} from "@ionic/react";
import {  Settings, Mail, ShieldAlert, FileText, Info, MailPlus, Globe, Palette} from "lucide-react";
import { resolveCurrentUserEmail, resolveCurrentUserId, signOutUser } from "../auth/authUtils";
import { ROUTES } from "../routes/routes.constants";
import PageLayout from "../components/PageLayout";
import { PageHeader } from "../components/PageHeader";
import { writeSupportTicket } from "../lib/supportTickets";
import BugForm from "../components/BugForm";
import { BookingContext } from "../contexts/BookingContext";
import { SettingsBlock } from "../components/SettingsBlock";
import { SettingsItemLabel } from "../components/SettingsItemLabel";
import ActionButton from "../components/ActionButton";
import ChangeEmailModal from "../settings/ChangeEmailModal";
import ChangePasswordModal from "../settings/ChangePasswordModal";

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
    const [isEmailOpen, setIsEmailOpen] = useState(false);
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);

    
    const { householdId, apartmentId } = useContext(BookingContext)!;

    const loadUserMetadata = async () => {
         const userId =  await resolveCurrentUserId();
        if (userId) {
             setUserId(userId);
            const email = await resolveCurrentUserEmail();
            setUserEmail(email);
        }
    };

    useEffect(() => { 
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

    const handleDeleteAccount = async () => {
        // we directly navigate to the account deletion status page, which will handle the checks and deletion process
        history.push(ROUTES.ACCOUNT_DELETION);
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
            <SettingsBlock title={t('settings.account_management', 'Account Management')}>
                <IonItem button detail={true} lines="full" onClick={() => setIsEmailOpen(true)}>
                    <SettingsItemLabel
                        label={t('settings.email_label', 'Change Email')}
                        icon={Mail}
                    />
                </IonItem>
                <IonItem button detail={true} lines="full" onClick={() => setIsPasswordOpen(true)}>
                    <SettingsItemLabel
                        label={t('settings.password_label', 'Change Password')}
                        icon={ShieldAlert}
                    />
                </IonItem>
            </SettingsBlock>

            <SettingsBlock title={t('settings.language_and_appearance', 'Language & Appearance')}>
                <IonItem button detail={true} lines="full" onClick={() => setToastMessage('Change Language')}>
                    <SettingsItemLabel
                        label={t('settings.language')}
                        icon={Globe}
                    />
                </IonItem>
                <IonItem button detail={true} lines="full" onClick={() => setToastMessage('Change Password')}>
                    <SettingsItemLabel
                        label={t('settings.theme', 'Theme')}
                        icon={Palette}
                    />
                </IonItem>
            </SettingsBlock>

            {/* Support & Feedback Block */}
            <SettingsBlock title={t('settings.support_header', 'Support & Feedback')}>
            
                {/* Contact Support */}
                <IonItem 
                    button 
                    detail={true} 
                    lines="full"
                    onClick={handleContactSupport}
                >
                    <SettingsItemLabel 
                        label={t('settings.btn_contact_support')} 
                        icon={MailPlus}
                    />
                </IonItem>

                {/* Report a Bug Trigger Item */}
                {!showBugForm ? (
                  <IonItem 
                      button 
                      detail={true} 
                      lines="none"
                      onClick={() => setShowBugForm(true)}
                  >
                      <SettingsItemLabel 
                        label={t('settings.btn_report_bug', 'Report a Bug')} 
                        icon={ShieldAlert}
                    />
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
            </SettingsBlock>

            {/* About & Legal Block */}
            <SettingsBlock title={t('settings.legal_header', 'About & Legal')}>
                {/* Terms of Service */}
                <IonItem 
                    button 
                    detail={true} 
                    lines="full"
                    onClick={() => setToastMessage('Show Terms')}
                >
                    <SettingsItemLabel 
                        label={t('settings.btn_terms', 'Terms of Service')} 
                        icon={FileText}
                    />
                </IonItem>

                {/* App Version Info (Non-clickable) */}
                <IonItem lines="none">
                    <SettingsItemLabel
                        label={t('settings.lbl_version')}
                        icon={Info}
                        note={__APP_VERSION__}
                    />
                </IonItem>
            </SettingsBlock>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start',  width: '100%' }}>
            {/* Destructive Sign Out Button */}
             <ActionButton
                onClick={handleLogout}
                disabled={loading}
                isLoading={loading}
                loadingLabel={t('common.logging_out')}
                icon={logOutOutline}
                label={t('settings.btn_logout', 'Log Out')}
                color="danger"
            />

            <ActionButton
                onClick={handleDeleteAccount}
                disabled={loading}
                isLoading={loading}
                loadingLabel={t('common.deleting')}
                icon={trashOutline}
                label={t('settings.btn_delete', 'Delete Account')}
                color="danger"
            />
            </div>
                  
            <IonToast
              isOpen={!!toastMessage}
              message={toastMessage}
              duration={3000}
              onDidDismiss={() => setToastMessage('')}
              color={toastColor}
            />
            <ChangeEmailModal 
                isOpen={isEmailOpen} 
                onClose={() => setIsEmailOpen(false)} 
                currentEmail={userEmail} 
                onSuccess={loadUserMetadata} 
            />

            <ChangePasswordModal 
                email={userEmail ?? ''}
                isOpen={isPasswordOpen} 
                onClose={() => setIsPasswordOpen(false)} 
            />
        </div>
      </PageLayout>
    );
}
