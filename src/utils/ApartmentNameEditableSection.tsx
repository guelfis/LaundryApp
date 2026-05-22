import { useEffect, useMemo, useState } from "react";
import TextInput from "../components/TextInput";
import EditSaveButton from "../components/EditSaveButton";
import { useApartments } from "../useApartments";
import { useTranslation } from "react-i18next";

interface ApartmentNameEditableSectionProps {
    apartmentName: string;
    householdId: string;
    onNameChange: (newName: string) => void;
    isEditing: boolean;
    setIsEditing: (arg0: boolean) => void;
}

export default function ApartmentNameEditableSection({ 
    apartmentName, 
    onNameChange, 
    isEditing, 
    setIsEditing, 
    householdId 
}: ApartmentNameEditableSectionProps) {
    const { t } = useTranslation();
    const [tempName, setTempName] = useState(apartmentName);
    const { data: allApartments = [] } = useApartments(householdId);
    
    const existingNames = useMemo(() => allApartments.map(apt => apt.display_name), [allApartments]);

    useEffect(() => {
        setTempName(apartmentName);
    }, [apartmentName]);

    // 1. Validation logic moved inside to leverage type-safe localized error keys
    const validateApartmentName = (name: string): string | null => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            return t('apartmentNameSection.error_empty', "Can't be empty");
        }
        const exists = existingNames.some(
            (aptName) => aptName.toLowerCase() === trimmedName.toLowerCase()
        );
        if (exists) {
            return t('apartmentNameSection.error_taken', "Name taken");
        }
        return null;
    };

    const handleSave = () => {
        onNameChange(tempName);
        setIsEditing(false);
    };

    const hasValidationError = !!validateApartmentName(tempName);

    return (
        <div className="flex items-center gap-3">
            {/* 2. Localized Form Input Field Label Text */}
            <label className="text-lg font-bold text-gray-800 dark:text-gray-300 shrink-0 min-w-[70px] ml-8">
                {t('apartmentNameSection.label_name', 'Name:')}
            </label>
            
            <div className="flex-1">
                {isEditing ? (
                    <TextInput
                        value={tempName}
                        onChange={(val) => setTempName(val)}
                        autoFocus
                        errorFn={validateApartmentName}
                    />   
                ) : (
                    <span className="text-gray-800 dark:text-gray-200 font-medium pl-3">{apartmentName}</span>
                )}
            </div>

            <EditSaveButton 
                isEditing={isEditing}
                onSaveClick={handleSave}
                setIsEditing={setIsEditing}
                onCancelClick={() => {
                    setIsEditing(false);
                }}
                disableSave={hasValidationError}
                /* 3. Localized labelType description string attribute parameter hook */
                labelType={t('apartmentNameSection.label_type', 'apartment name')}
            />
        </div>
    );
}
