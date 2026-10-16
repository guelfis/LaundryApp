import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BaseInlineBanner } from "../baseComponents/BaseInlineBanner";

export function TravelingBanner({ userTz, buildingTz }: { userTz: string; buildingTz: string }) {
  const { t } = useTranslation();
  
  return (
    <BaseInlineBanner
      variant="blue"
      icon={<Globe className="w-4 h-4" />} // Smaller icon
      title={t("travelingBanner.title")}
      description={t("travelingBanner.description", { userTz, buildingTz })}
    />
  );
}
