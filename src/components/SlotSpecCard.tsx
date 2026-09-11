import { useTranslation } from "react-i18next";

interface SpecsCardProps {
  dateString: string;
  slotLabel: string;
}

// 2. SHARED METRICS SPECIFICATION CARD
export function SlotSpecsCard({ dateString, slotLabel }: SpecsCardProps) {
  const { t } = useTranslation();
  return (
    <div className="bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 space-y-3">
      <div className="flex justify-between items-center border-b border-gray-200/60 dark:border-slate-700/50 pb-2.5">
        <span className="text-sm text-gray-500 dark:text-slate-400">{t('slotModal.date')}</span>
        <span className="font-semibold text-gray-800 dark:text-gray-200">
          {dateString}
        </span>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500 dark:text-slate-400">{t('slotModal.hours')}</span>
        <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2.5 py-1 rounded-lg text-sm">
          {slotLabel}
        </span>
      </div>
    </div>
  );
}