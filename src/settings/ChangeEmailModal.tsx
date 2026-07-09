import { useState } from "react";
import { useTranslation } from "react-i18next";
import { updateUserProfileEmail } from "../auth/authUtils";
import BottomModal from "../components/BottomModal";
import TextInput from "../components/TextInput";
import ModalButton from "../components/ModalButton";
import { IonToast } from "@ionic/react";

interface ChangeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string | null;
  onSuccess: () => void; 
}

export default function ChangeEmailModal({ 
  isOpen, 
  onClose, 
  currentEmail, 
  onSuccess 
}: ChangeEmailModalProps) {
  const { t } = useTranslation();
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastColor, setToastColor] = useState<'success' | 'warning' | 'danger'>('success');

  const handleEmailUpdate = async () => {
    if (!newEmail.trim() || newEmail === currentEmail) return;

    setLoading(true);
    try {
      await updateUserProfileEmail(newEmail.trim());
      
      setToastMessage(t('emailModal.change_sent'));
      setToastColor('success');
      setNewEmail("");
      onSuccess();
      onClose();
    } catch (err) {
      const errorInstance = err as Error;
      console.error("Email modification failed:", errorInstance);
      setToastMessage(errorInstance.message || t('emailModal.change_error'));
      setToastColor('danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t('emailModal.title', 'Update Email Address')}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-1">
          {t('emailModal.modal_hint')}
        </p>

        <TextInput 
          type="email"
          value={newEmail}
          placeholder={currentEmail || t('emailModal.placeholder')}
          onChange={(val) => {
            const cleanStr = val.trim();
            setNewEmail(cleanStr);
          }}
          disabled={loading}
          clearInput={true}
        />

        <ModalButton 
          onClick={handleEmailUpdate}
          disabled={loading || !newEmail.trim() || newEmail === currentEmail}
        >{t('common.save', 'Save Changes')}</ModalButton>
      </div>
      <IonToast
        isOpen={!!toastMessage}
        message={toastMessage}
        duration={3000}
        onDidDismiss={() => setToastMessage('')}
        color={toastColor}
      />
    </BottomModal>
  );
}
