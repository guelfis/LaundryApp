import { useState } from "react";
import { useTranslation } from "react-i18next";
import { verifyPassword, updateAccountPassword } from "../auth/authUtils"; // FIXED: Abstracted imports
import BottomModal from "../components/BottomModal";
import TextInput from "../components/TextInput";
import ModalButton from "../components/ModalButton";
import { IonToast } from "@ionic/react";

interface ChangePasswordModalProps {
  email: string; // Added email prop for password verification
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ email, isOpen, onClose }: ChangePasswordModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastColor, setToastColor] = useState<'success' | 'warning' | 'danger'>('success');

  // STEP 1: Verify the current password via your utilities layer
  const handleVerifyOldPassword = async () => {
    if (!oldPassword.trim()) return;
    setLoading(true);

    try {
      await verifyPassword(email, oldPassword);
      setStep(2); // Advance smoothly to step 2 on success
    } catch (err) {
      const errorInstance = err as Error;
      console.error("Verification failed:", errorInstance);
      if (errorInstance){
        setToastMessage(errorInstance.message || t('passwordModal.error_verification'));
        setToastColor('danger');
      }
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Save the brand new password string via your utilities layer
  const handleSaveNewPassword = async () => {
    if (newPassword.length < 6) {
      setToastMessage(t('passwordModal.error_short', 'Password must be at least 6 characters.'));
      setToastColor("warning")
      return;
    }
    setLoading(true);

    try {
      await updateAccountPassword(newPassword);
      setToastMessage(t('passwordModal.change_success', 'Password updated successfully!'));
      setToastColor('success');
      handleModalClose();
    } catch (err) {
      const errorInstance = err as Error;
      console.error("Password save failure:", errorInstance);
      setToastMessage(errorInstance.message || t('passwordModal.change_error', 'Failed to update password.'));
      setToastColor('danger');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setOldPassword("");
    setNewPassword("");
    setStep(1);
    onClose();
  };

  return (
    <BottomModal 
      isOpen={isOpen} 
      onClose={handleModalClose} 
      title={t('passwordModal.title', 'Reset Password')}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* STEP 1 LAYOUT: Identity Verification */}
        {step === 1 && (
          <>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-1">
              {t('passwordModal.hint_step1')}
            </p>

            <TextInput 
              type="password"
              value={oldPassword}
              placeholder={t('passwordModal.placeholder_old', 'Enter current password')}
              onChange={(val) => setOldPassword(val)}
              disabled={loading}
              clearInput={true}
                        className=""
            />

            <ModalButton 
              onClick={handleVerifyOldPassword}
              disabled={loading || !oldPassword.trim()}
            >
              {t('passwordModal.btn_verify')}
            </ModalButton>
          </>
        )}

        {/* STEP 2 LAYOUT: Overwrite Target Password */}
        {step === 2 && (
          <>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-1">
              {t('passwordModal.hint_step2')}
            </p>

            <TextInput 
              type="password"
              value={newPassword}
              placeholder={t('passwordModal.placeholder_new', 'Enter new password (min. 6 chars)')}
              onChange={(val) => setNewPassword(val)}
              disabled={loading}
              clearInput={true}
                        className=""
            />

            <ModalButton 
              onClick={handleSaveNewPassword}
              disabled={loading || newPassword.length < 6}
            >
              {t('common.save', 'Save Changes')}
            </ModalButton>
          </>
          
        )}

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
