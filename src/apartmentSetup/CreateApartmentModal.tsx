import { useMemo, useState } from "react";
import BottomModal from "../baseComponents/BottomModal";
import ModalButton from "../baseComponents/ModalButton";
import { useApartments, useCreateApartment } from "../hooks/useApartments";
import { Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import TextInput from "../baseComponents/TextInput";
import { validateApartmentName } from "../utils/validateApartmentName";

interface CreateApartmentModalProps {
    householdId: string;
    isModalOpen: boolean;
    onClose: () => void;
}

export default function CreateApartmentModal({ householdId, isModalOpen, onClose }: CreateApartmentModalProps) {
    const { t } = useTranslation();
    const [apartmentName, setApartmentName] = useState("");

    const createApartmentMutation = useCreateApartment();
    const { data: allApartments = [] } = useApartments(householdId);
        
    const existingNames = useMemo(() => allApartments.map(apt => apt.display_name), [allApartments]);

    const handleClose = () => {
        setApartmentName("");
        onClose();
    };

    const handleCreateApartment = async () => {
        const trimmedName = apartmentName.trim();
        if (!trimmedName) return; 
        
        try {
            await createApartmentMutation.mutateAsync({ name: trimmedName, householdId });
            handleClose(); 
        } catch (error) {
            const errorInstance = error as Error;
            console.error("Error creating apartment:", errorInstance);
        }
    };

    const validateName = (name: string): string | null => {
        return validateApartmentName(name, existingNames);
    };
    const isNameValid = !!validateApartmentName(apartmentName, existingNames);

    return (
        /* 1. Localized Modal Title */
        <BottomModal isOpen={isModalOpen} onClose={handleClose} title={t('createApartment.title', 'Create New Apartment')}>
            <div className="space-y-6">
                <TextInput
                    value={apartmentName}
                    onChange={setApartmentName}
                    type="text"
                    errorFn={validateName}
                />
                <div className="flex flex-col gap-3 pt-2">
                    <ModalButton 
                        variant="primary"
                        onClick={handleCreateApartment}
                        disabled={
                            !apartmentName.trim() || 
                            createApartmentMutation.isPending || 
                            isNameValid
                        }
                    >
                        {/* 2. Localized Dynamic Button States */}
                        {createApartmentMutation.isPending ? t('createApartment.status_creating', 'Creating...') : (
                            <>
                                <Send size={18} />
                                {t('createApartment.btn_create', 'Create Apartment')}
                            </>
                        )}
                    </ModalButton>
                    <ModalButton 
                        variant="secondary"
                        onClick={handleClose}
                        disabled={createApartmentMutation.isPending }
                    >
                        {/* 3. Localized Cancel Button */}
                        {t('common.button_cancel', 'Cancel')}
                    </ModalButton>
                </div>
            </div>
        </BottomModal>
    );
}
