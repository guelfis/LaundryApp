import { useState } from "react";
import BottomModal from "../components/BottomModal";
import ModalButton from "../components/ModalButton";
import ApartmentNameEditableSection from "../utils/ApartmentNameEditableSection";
import {useCreateApartment } from "../useApartments";
import { Send } from "lucide-react";


interface CreateApartmentModalProps {
    householdId: string;
    isModalOpen: boolean;
    onClose: () => void;
}

export default function CreateApartmentModal({ householdId, isModalOpen, onClose }: CreateApartmentModalProps) {

    const [apartmentName, setApartmentName] = useState("");
    const [isEditingName, setIsEditinName] = useState<boolean>(true); // start is edit mode

    const createApartmentMutation = useCreateApartment();


    const handleClose = () => {
        setApartmentName("");
        onClose();
    };

     const handleCreateApartment = async () => {
        const trimmedName = apartmentName.trim();
        // Prevent submission if name is empty or already exists
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
        <BottomModal isOpen={isModalOpen} onClose={handleClose} title="Create New Apartment">
            <div className="space-y-6">
                <ApartmentNameEditableSection 
                    apartmentName={apartmentName}
                    householdId={householdId}
                    onNameChange={setApartmentName}
                    setIsEditing={setIsEditinName}
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
                        {createApartmentMutation.isPending ? 'Creating...' : (
                            <>
                                <Send size={18} />
                                Create Apartment
                            </>
                    )}
                    </ModalButton>
                    <ModalButton 
                        variant="secondary"
                        onClick={handleClose}
                        disabled={createApartmentMutation.isPending}
                        >
                        Cancel
                    </ModalButton>
                </div>
            </div>
        </BottomModal>

    );
}