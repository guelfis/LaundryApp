import React from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { IconButton } from '../baseComponents/IconButton';

interface EditSaveButtonProps {
  isEditing: boolean;
  setIsEditing: (arg0: boolean) => void;
  onSaveClick?: () => void;
  onCancelClick?: () => void;
  labelType?: string;
  size?: 'normal' | 'compact'; // Forward the size specification prop downward
  disableSave?: boolean; // New prop to control save button state
}

const EditSaveButton: React.FC<EditSaveButtonProps> = ({ 
  isEditing, 
  setIsEditing,
  onSaveClick, 
  onCancelClick,
  labelType = "name",
  size = "normal",
  disableSave = false,
}) => {
  const iconClass = size === 'compact' ? "w-4 h-4" : "w-5 h-5";

  if (!isEditing) {
    return (
      <IconButton size={size} onClick={() => setIsEditing(true)} aria-label={`Edit ${labelType}`}>
        <Pencil className={`${iconClass} text-gray-700 dark:text-gray-300`} />
      </IconButton>
    );
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <IconButton size={size} onClick={onSaveClick} aria-label={`Confirm ${labelType}`} disabled={disableSave}>
        <Check className={`${iconClass} text-green-600 dark:text-green-400`} />
      </IconButton>
      <IconButton size={size} variant="danger" onClick={onCancelClick} aria-label={`Cancel ${labelType}`}>
        <X className={`${iconClass} text-red-600 dark:text-red-400`} />
      </IconButton>
      
    </div>
  );
};

export default EditSaveButton;
