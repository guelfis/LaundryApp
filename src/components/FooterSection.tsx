import { IonNote } from "@ionic/react";
import Button from "./Button";

interface FooterSectionProps {
  buttonLabel: string;
  onButtonClick: () => void;
  buttonIcon?: string;
  text?: string;
  disableButton?:boolean
}

export default function FooterSection({
  buttonLabel,
  onButtonClick,
  buttonIcon,
  text,
  disableButton
}: FooterSectionProps) {
  return (
    <div style={styles.footerContainer}>
      {text && (
        /* 
          Using IonNote handles the text color automatically.
          It uses your global step variables to render a muted gray in light mode 
          and an appropriately adjusted readable gray/white in dark mode.
        */
        <IonNote style={styles.helperText}>
          {text}
        </IonNote>
      )}
      
      <Button 
        label={buttonLabel} 
        onClick={onButtonClick} 
        icon={buttonIcon} 
        disabled={disableButton}
      />
    </div>
  );
}

const styles = {
  footerContainer: {
    width: '100%',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px', // Creates space between the descriptive note text and your button component
  },
  helperText: {
    display: 'block',
    textAlign: 'center' as const,
    fontSize: '14px', 
    marginTop: '16px',
    marginBottom: '8px',
  }
};
