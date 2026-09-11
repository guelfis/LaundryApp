import React from 'react';
import { IonDatetimeButton, IonModal, IonDatetime } from '@ionic/react';
import { useTranslation } from 'react-i18next';

interface DatePickerProps {
  label: string;             // The translated label to display
  datetimeId: string;        // Unique ID linking the button to the correct modal
  value: string;             // Current date string (YYYY-MM-DD)
  minDate?: string;          // Optional minimum date validation boundary
  maxDate?: string;          // Optional maximum date validation boundary
  isDateEnabled?: (date: string) => boolean;  // Optional function to enable/disable specific dates
  onChange: (date: string) => void;
  
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  datetimeId,
  value,
  minDate,
  maxDate,
  isDateEnabled,
  onChange,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Visual trigger container - styled natively for dark & bright mode */}
      <div 
        className="flex items-center justify-between p-4 rounded-xl border" 
        style={{ 
          backgroundColor: 'var(--ion-item-background, var(--ion-background-color, #fff))', 
          borderColor: 'var(--ion-color-step-200, #e0e0e0)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <span className="text-sm font-medium" style={{ color: 'var(--ion-text-color)' }}>
          {label}
        </span>
        <IonDatetimeButton datetime={datetimeId} />
      </div>

      {/* Underlying Ionic Modal layer */}
      <IonModal keepContentsMounted={true} className="ion-datetime-modal">
          <IonDatetime
            id={datetimeId}
            presentation="date"
            multiple={false}
            value={value}
            min={minDate}
            max={maxDate}
            isDateEnabled={isDateEnabled}
            className="mx-auto" // Centers the calendar horizontally
            doneText={t('common.done', 'Done')}
            cancelText={t('common.button_cancel', 'Cancel')}
            showDefaultButtons={true}
            onIonChange={(e) => {
              const val = e.detail.value as string;
              if (val) onChange(val.split('T')[0]);
            }}
            style={{
              '--background': 'var(--ion-background-color, #fff)',
              '--background-rgb': 'var(--ion-background-color-rgb, 255, 255, 255)',
              '--color': 'var(--ion-text-color, #111)',
              '--border-radius': '14px',
              '--padding-start': '12px',
              '--padding-end': '12px',
            }}
          />
      </IonModal>
    </>
  );
};
