import { useState } from "react";
import { IonInput } from "@ionic/react";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'password' | 'email';
  autoFocus?: boolean;
  className?: string; 
  errorFn?: (value: string) => string | null; 
  disabled?:boolean;
}

export default function TextInput({
  value,
  onChange,
  placeholder = '',
  type = 'text',
  autoFocus = false,
  className = '',
  errorFn = () => null,
  disabled = false,
}: TextInputProps) {

  const [isTouched, setIsTouched] = useState(false);
  const [isValid, setIsValid] = useState<boolean>();
  const [errorText, setErrorText] = useState<string>('');
  
  const validate = (event: CustomEvent) => {
    const inputValue = (event.target as HTMLInputElement).value || '';

    setIsValid(undefined);

    // Run the translation error validation check
    const errorResult = errorFn(inputValue);
    console.log(errorResult)

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
    <div className={className} style={{
        width: '100%',
    }}>
        <IonInput
          type={type}
          value={value}
          fill="outline"
          shape="round"
          placeholder={placeholder}
          autofocus={autoFocus}
          errorText={errorText}
          onIonBlur={() => markTouched()}
          disabled={disabled}
          onIonInput={(e) => {
            onChange(e.detail.value!);
            validate(e);
          }}
          className={`unified-text-input ${isValid ? 'ion-valid' : ''} ${isValid === false ? 'ion-invalid' : ''} ${isTouched ? 'ion-touched' : ''}`}
        />      
    </div>
  );
}