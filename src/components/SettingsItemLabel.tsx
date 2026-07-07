import { IonLabel, IonNote } from "@ionic/react";
import { LucideIcon } from "lucide-react"; // Import the structural type definitions

interface SettingsItemLabelProps {
  label: string;
  icon: LucideIcon; // Expects a Lucide icon component type directly
  note?: string;
}

export function SettingsItemLabel({ label, icon: Icon, note }: SettingsItemLabelProps) {
  return (
    <>
      <div slot="start" className="flex items-center justify-center mr-3">
        <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      </div>
      
      <IonLabel className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {label}
      </IonLabel>
      
      {note && (
        <IonNote slot="end" className="text-sm font-semibold text-gray-500 dark:text-gray-400">
          {note}
        </IonNote>
      )}
    </>
  );
}
