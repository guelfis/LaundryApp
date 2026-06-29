import { IonButton, IonIcon, IonSpinner } from '@ionic/react';
import React from 'react';

interface ActionButtonProps {
  label: string;
  icon: string; // Accepts Ionicons (e.g., logOutOutline)
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  color?: 'danger' | 'primary' | 'secondary' | 'light' | 'dark' | 'medium';
}

const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  icon,
  onClick,
  disabled = false,
  isLoading = false,
  loadingLabel,
  color = 'danger'
}) => {
  return (
    <IonButton
      fill="clear"
      color={color}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <IonSpinner slot="start" name="crescent" style={{ width: '18px', height: '18px' }} />
      ) : (
        <IonIcon slot="start" icon={icon} style={{ fontSize: '18px' }} />
      )}
      {isLoading && loadingLabel ? loadingLabel : label}
    </IonButton>
  );
};

export default ActionButton;
