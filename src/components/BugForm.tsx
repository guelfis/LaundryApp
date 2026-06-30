import { IonButton, IonSpinner, IonTextarea } from "@ionic/react";
import { Send, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface BugFormProps {
  setShowBugForm: (show: boolean) => void;
  bugDescription: string;
  setBugDescription: (description: string) => void;
  sendingBug: boolean;
  onSend: () => void;
}

export default function BugForm({
  setShowBugForm,
  bugDescription,
  setBugDescription,
  sendingBug,
  onSend
}: BugFormProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                {t('bugForm.bug_form_subtitle', 'Describe what happened:')}
            </span>
            <button 
                onClick={() => setShowBugForm(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
                type="button"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
        
        <IonTextarea
            value={bugDescription}
            onIonInput={(e) => setBugDescription(e.detail.value || "")}
            placeholder={t('bugForm.bug_placeholder', 'Example: When I search a location with Photon, the map view freezes...')}
            rows={4}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm p-2 --padding-start: 4px;"
        />

        <div className="flex gap-2 justify-end">
            <IonButton 
                size="small" 
                color="light" 
                onClick={() => setShowBugForm(false)}
                disabled={sendingBug}
            >
                {t('common.button_cancel', 'Cancel')}
            </IonButton>
            <IonButton 
                size="small" 
                color="primary" 
                onClick={onSend}
                disabled={sendingBug || !bugDescription.trim()}
            >
                {sendingBug ? (
                    <IonSpinner name="crescent" className="w-4 h-4 mr-1" />
                ) : (
                    <Send className="w-4 h-4 mr-1" />
                )}
                {t('common.btn_send', 'Send')}
            </IonButton>
        </div>
    </div>
  );
}
