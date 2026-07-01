import { LogOut, Shield } from "lucide-react";
import BottomModal from "../components/BottomModal";
import { ApartmentMember } from "../lib/databaseTypes";
import { useApartmentMembersActions } from "../hooks/useApartments";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { IonToast } from "@ionic/react";

const destructiveButtonStyle = "flex items-center justify-center gap-2 py-3 px-6 text-red-600 dark:text-red-400 text-base bg-transparent border-none rounded-xl active:bg-red-50 dark:active:bg-red-950/20 active:scale-[0.98] transition-all disabled:opacity-40";

interface MemberModalProps {
    member: ApartmentMember;
    apartmentId: string;
    isModalOpen: boolean;
    onClose: () => void;
}

export default function MemberModal({ member, apartmentId, isModalOpen, onClose }: MemberModalProps) {
    const { t } = useTranslation();
    const [toastMessage, setToastMessage] = useState<string>('');
    const [toastColor, setToastColor] = useState<'success' | 'warning' | 'danger'>('success');   
    const { promoteMember, removeMember } = useApartmentMembersActions(apartmentId);
    
    if (!member || !member.profiles) {
        return null; 
    }

    const handlePromoteToAdmin = async () => {
        try {
            await promoteMember(member.user_id);
            onClose();
        } catch (err) {
            const errorInstance = err as Error;
            console.error("Failed to Promote the user to Admin", err);
            /* Interpolazione dell'errore */
            setToastMessage(t('memberModal.alert_promote_error', 'Could not promote member: {{error}}', { error: errorInstance.message }));
            setToastColor('danger');
        }
    };

    const handleRemoveMember = async () => { // Corretto piccolo refuso di battitura nel nome della funzione
        try {
            await removeMember(member.user_id);
            onClose();
        } catch (err) {
            const errorInstance = err as Error;
            console.error("Failed to Remove Member from the apartment", err);
            /* Interpolazione dell'errore */
            setToastMessage(t('memberModal.alert_remove_error', 'Could not remove member: {{error}}', { error: errorInstance.message }));
            setToastColor('danger');
        }
    };

    return (
        <BottomModal
            title={member.profiles.full_name ?? ''}
            isOpen={isModalOpen}
            onClose={onClose} 
        >
            <div className="pt-6 pb-2 mt-auto flex w-full justify-around">
                {member.apartment_role !== 'admin' && (
                    <button
                        onClick={handlePromoteToAdmin}
                        className={destructiveButtonStyle}
                    >
                        <Shield size={18} className="text-red-600 dark:text-red-400" />
                        <span>{t('memberModal.btn_make_admin', 'Make admin')}</span>
                    </button>
                )}
                <button
                    onClick={handleRemoveMember}
                    className={destructiveButtonStyle}
                >
                    <LogOut size={18} className="text-red-600 dark:text-red-400" />
                    <span>{t('memberModal.btn_remove_member', 'Remove member')}</span>
                </button>
                <IonToast
                    isOpen={!!toastMessage}
                    message={toastMessage}
                    duration={3000}
                    onDidDismiss={() => setToastMessage('')}
                    color={toastColor}
                />  
            </div>
        </BottomModal>
    );
}
