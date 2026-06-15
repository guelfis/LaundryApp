import { useMemo, useState } from "react";
import BottomModal from "../components/BottomModal";
import ModalButton from "../components/ModalButton";
import ApartmentNameEditableSection from "../utils/ApartmentNameEditableSection";
import { useApartments, useCreateApartment } from "../hooks/useApartments";
import { Send } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CreateApartmentModalProps {
    householdId: string;
    isModalOpen: boolean;
    onClose: () => void;
}

export default function CreateApartmentModal({ householdId, isModalOpen, onClose }: CreateApartmentModalProps) {
    const { t } = useTranslation();
    const [apartmentName, setApartmentName] = useState("");
    const [isEditingName, setIsEditingName] = useState<boolean>(true); // Fixed tiny typo in setter name

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

    return (
        /* 1. Localized Modal Title */
        <BottomModal isOpen={isModalOpen} onClose={handleClose} title={t('createApartment.title', 'Create New Apartment')}>
            <div className="space-y-6">
                <ApartmentNameEditableSection 
                    apartmentName={apartmentName}
                    invalidNames={existingNames}
                    onNameChange={setApartmentName}
                    setIsEditing={setIsEditingName}
                    isEditing={isEditingName}
                />
                <div className="flex flex-col gap-3 pt-2">
                    <ModalButton 
                        variant="primary"
                        onClick={handleCreateApartment}
                        disabled={
                            isEditingName || 
                            !apartmentName.trim() || 
                            createApartmentMutation.isPending
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
                        disabled={createApartmentMutation.isPending}
                    >
                        {/* 3. Localized Cancel Button */}
                        {t('common.button_cancel', 'Cancel')}
                    </ModalButton>
                </div>
            </div>
        </BottomModal>
    );
}
