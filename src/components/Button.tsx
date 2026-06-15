import { IonButton, IonIcon } from '@ionic/react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  // Migrated from React.ReactNode to string to accept standard Ionic icon assets smoothly
  icon?: string;
  disabled?: boolean
}

export default function Button({ label, onClick, icon, disabled=false }: ButtonProps) {
  return (
    <IonButton
      fill="clear" // Allows our custom background and dashed borders to render properly
      onClick={onClick}
      style={styles.button}
      className="ion-text-center"
      disabled={disabled}
      shape='round'
    >
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
    
    '--background': 'var(--custom-btn-bg)',
    '--color': 'var(--custom-btn-text)',
    
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
    color: 'var(--custom-btn-text)'
  }
};
