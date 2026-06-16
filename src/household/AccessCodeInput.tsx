import { IonInput } from '@ionic/react';
import { useState } from 'react';
import i18n from '../locales/i18n'; 

interface AccessCodeInputProps {
  accessCode: string;
  setAccessCode: (value: string) => void;
  disabled?: boolean;
}

const ACCESS_CODE_DIGITIS = 6;

const errorFn=(code:string) : string | null => {
  if (code.length !== ACCESS_CODE_DIGITIS){
    return i18n.t('accessCode.error_lenght',{ count: ACCESS_CODE_DIGITIS });
  }
  return null;
}

export default function AccessCodeInput({ accessCode, setAccessCode, disabled=false }: AccessCodeInputProps) {

  const [isTouched, setIsTouched] = useState(false);
  const [isValid, setIsValid] = useState<boolean>();
  const [errorText, setErrorText] = useState<string>('');

  const validate = (event: CustomEvent) => {
    const inputValue = (event.target as HTMLInputElement).value || '';

    setIsValid(undefined);
    const errorResult = errorFn(inputValue);

    // Run the translation error validation check
    if (errorResult !== null) {
        setErrorText(errorResult);
        setIsValid(false); 
    } else {
        setErrorText('');
        setIsValid(true);    
    }
   };
   
   const markTouched = () => {
    setIsTouched(true);
  };

  return (
    <div style={styles.wrapper}>
      <IonInput
        type="password"
        fill="outline"
        shape='round'
        inputmode="text"
        maxlength={ACCESS_CODE_DIGITIS}
        value={accessCode}
        disabled={disabled}
        errorText={errorText}
        onIonBlur={() => markTouched()}
        placeholder="••••"
        onIonInput={(e) => {
          const rawValue = e.detail.value! || '';
          // Save only the numbers to your state variable
          setAccessCode(rawValue);
          validate(e);
        }}
        style={styles.inputOverrides}
        className={`unified-text-input access-code-input ${isValid ? 'ion-valid' : ''} ${isValid === false ? 'ion-invalid' : ''} ${isTouched ? 'ion-touched' : ''}`}
      />
    </div>
  );
}

const styles = {
  wrapper: {
    width: '100%',
  },
  inputOverrides: {
    textAlign: 'center' as const,
    fontFamily: 'monospace',
    fontSize: '20px',
  }
};
