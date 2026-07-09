import { IonButton, IonIcon } from '@ionic/react';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps {
  label: string;
  onClick: () => void;
  icon?: string;
  disabled?: boolean
  isLoading?: boolean;
  variant?: ButtonVariant;
}

export default function Button({ label, onClick, icon, disabled=false, isLoading = false , variant = 'primary'
}: ButtonProps) {
  const variantStyles: Record<ButtonVariant, string> = {
    // Primary: Clean Ionic Blue
    primary: "[--background:var(--ion-color-primary,#3880ff)] [--background-hover:var(--ion-color-primary-shade)] [--color:#ffffff]",
    
    // Secondary: Light Gray (Light Mode) / Dark Gray (Dark Mode)
    secondary: "[--background:var(--ion-color-light,#f4f5f8)] [--background-hover:var(--ion-color-light-shade)] [--color:var(--ion-color-light-contrast,#000000)] dark:[--background:var(--ion-color-step-150,#222428)] dark:[--color:var(--ion-color-step-850,#ffffff)]",
    
    // Danger: Clean Ionic Red
    danger: "[--background:var(--ion-color-danger,#eb445a)] [--background-hover:var(--ion-color-danger-shade)] [--color:#ffffff]"
  };
  return (
    <IonButton
      fill="clear" // Allows our custom background and dashed borders to render properly
      onClick={onClick}
      style={styles.button}
      className={`ion-text-center ${variantStyles[variant]}`}
      disabled={disabled}
      shape='round'
    >
      {isLoading && (
        <IonIcon slot="start" icon="crescent" style={{ fontSize: '18px', marginRight: '4px' }} />
      )}
      {/* Renders the dynamic icon on the left of the label if provided */}
      {icon && <IonIcon slot="start" icon={icon} style={styles.icon} />}
      {label}
    </IonButton>
  );
}

const styles = {
  button: {
    // 1. DIMENSIONS & CENTERING: Copies your exact w-[calc(100%-2rem)] mx-auto logic
    width: 'calc(100% - 2rem)',
    margin: '0 auto',
    height: '48px', // Matches your py-4 vertical space nicely
    
    // 3. BORDERS: Implements your custom dashed border layout
    border: '1px var(--ion-color-step-300, #b3b3b3)',
    
    // 4. TEXT FORMATTING: Enforces structural font weights
    fontWeight: '700',
    fontSize: '14px',
    
    // 5. SHADOW SCALES
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: '18px',
    marginRight: '4px',
    color: 'inherit' 
  }
};
