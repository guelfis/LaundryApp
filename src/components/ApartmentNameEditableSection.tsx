import { useEffect, useState } from "react";
import TextInput from "../baseComponents/TextInput";
import EditSaveButton from "../components/EditSaveButton";
import { useTranslation } from "react-i18next";
import { validateApartmentName } from "./validateApartmentName";

interface ApartmentNameEditableSectionProps {
    apartmentName: string;
    invalidNames: string[];
    onNameChange: (newName: string) => void;
    isEditing: boolean;
    setIsEditing: (arg0: boolean) => void;
}

export default function ApartmentNameEditableSection({ 
    apartmentName, 
    onNameChange, 
    isEditing, 
    setIsEditing, 
    invalidNames 
}: ApartmentNameEditableSectionProps) {
    const { t } = useTranslation();
    const [tempName, setTempName] = useState(apartmentName);
    
    useEffect(() => {
        setTempName(apartmentName);
    }, [apartmentName]);

    // 1. Validation logic moved inside to leverage type-safe localized error keys
    const validateName = (name: string): string | null => {
        return validateApartmentName(name, invalidNames);
    };

    const handleSave = () => {
        onNameChange(tempName);
        setIsEditing(false);
    };

    const hasValidationError = !!validateName(tempName);

    return (
        <div style={{
            display:"flex",
            flexDirection:"row",
            gap: 8,
            alignItems:"center",
            justifyContent: 'space-between',
            marginLeft:'16px'
        }}
        >
            {/* 2. Localized Form Input Field Label Text */}
            <label className="text-lg font-bold text-gray-800 dark:text-gray-300 shrink-0 min-w-[70px]">
                {t('apartmentNameSection.label_name', 'Name:')}
            </label>
            
            <div className="flex-1">
                {isEditing ? (
                    <TextInput
                        value={tempName}
                        onChange={(val) => setTempName(val)}
                        autoFocus
                        errorFn={validateName}
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
