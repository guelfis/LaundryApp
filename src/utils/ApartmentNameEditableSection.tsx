import { useEffect, useMemo, useState } from "react";
import TextInput from "../components/TextInput";
import EditSaveButton from "../components/EditSaveButton";
import { useApartments } from "../useApartments";

interface ApartmentNameEditableSectionProps {
    apartmentName: string;
    householdId: string;
    onNameChange: (newName: string) => void;
    isEditing: boolean;
    setIsEditing: (arg0: boolean) => void;
}

function validateApartmentName(name: string, existingNames: string[]): string | null {
    const trimmedName = name.trim();
    if (!trimmedName) {
        return "Can't be empty";
    }
    const exists = existingNames.some(
        (aptName) => aptName.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
        return "Name taken";
    }
    return null;
}

export default function ApartmentNameEditableSection(
    { apartmentName, onNameChange, isEditing, setIsEditing, householdId }: ApartmentNameEditableSectionProps
) {
    const [tempName, setTempName] = useState(apartmentName);
    const { data: allApartments = [] } = useApartments(householdId);
    const existingNames = useMemo(() => allApartments.map(apt => apt.display_name), [allApartments]);


    useEffect(() => {
        setTempName(apartmentName);
    }, [apartmentName]);

    
    const handleSave = () => {
        onNameChange(tempName);
        setIsEditing(false);
    };

    const hasValidationError = !!validateApartmentName(tempName, existingNames);

    return (
        <div className="flex items-center gap-3">
                <label className="text-lg font-bold text-gray-800 dark:text-gray-300 shrink-0 min-w-[70px] ml-8">
                    Name:
                </label>
                
                <div className="flex-1">
                    {isEditing ? (
                        <TextInput
                            value={tempName}
                            onChange={(val) => {
                            setTempName(val);
                            }}
                            autoFocus
                            errorFn={(val) => validateApartmentName(val, existingNames)}
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
                    disableSave={ hasValidationError}
                    labelType="apartment name"
                    
                />
            </div>
    )
}