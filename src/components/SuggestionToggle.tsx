import { IonItem, IonLabel, IonCheckbox } from '@ionic/react';

interface SuggestionToggleProps {
  checked: boolean;
  onToggle: (checked: boolean) => void;
  title: string;
  description?: string;
}

export default function SuggestionToggle({ 
  checked, 
  onToggle, 
  title, 
  description 
}: SuggestionToggleProps) {
  return (
    <IonItem 
      lines="none" 
      style={{ 
        '--background': 'rgba(var(--ion-color-primary-rgb), 0.05)', 
        borderRadius: '12px', 
        '--padding-start': '12px',
        margin: '8px 0'
      }}
    >
      <IonCheckbox 
        slot="start" 
        checked={checked} 
        onIonChange={e => onToggle(e.detail.checked)}
      />
      <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <IonLabel className="text-sm font-bold" style={{ color: 'var(--ion-color-primary)' }}>
          {title}
        </IonLabel>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {description}
          </p>
        )}
      </div>
    </IonItem>
  );
}
