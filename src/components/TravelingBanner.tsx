import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

export function TravelingBanner({ userTz, buildingTz }: { userTz: string; buildingTz: string }) {
    const { t } = useTranslation();
    
    return (
        <div className="w-full p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex items-start gap-3 shadow-xs">
          <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-blue-900 dark:text-blue-300">
              {t("travelingBanner.title")}
            </span>
            <span className="text-xs text-blue-700/90 dark:text-blue-400/80 leading-relaxed">
              {t("travelingBanner.description", { userTz: userTz, buildingTz: buildingTz })}
            </span>
          </div>
        </div>
    );
}