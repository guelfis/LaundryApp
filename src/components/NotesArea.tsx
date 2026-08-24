import { IonTextarea } from '@ionic/react';

interface NotesAreaProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export default function NotesArea({ label, placeholder, value, onChange }: NotesAreaProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-bold uppercase tracking-wider px-1" style={{ color: 'var(--ion-color-step-400, #888)' }}>
        {label}
      </span>
      <IonTextarea 
        placeholder={placeholder}
        value={value}
        onIonInput={e => onChange(e.detail.value || '')}
        rows={3}
        style={{
          '--background': 'var(--ion-color-step-50, var(--ion-item-background, #fafafa))',
          '--border-radius': '14px',
          '--padding-start': '12px',
          '--padding-end': '12px',
          '--color': 'var(--ion-text-color, #111)'
        }}
      />
    </div>
  );
}
