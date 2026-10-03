import SlotCard from "../baseComponents/SlotCard";
import { Wrench } from "lucide-react"; 
import SectionText from "../baseComponents/SectionText";
import { useTranslation } from "react-i18next";
import { AggregatedBookings } from "../utils/slotsUtils";
import { formatMaintenanceBlockDisplay } from "../utils/formatMaintenanceBlockDisplay";



interface AggregatedMaintenanceBlockProps {
  sectionTitle: string;
  aggregatedBlocks: AggregatedBookings[]
  onClickBlock?: (block_id: string ) => void; 
}

export default function AggregatedMaintenanceBlock({ sectionTitle, aggregatedBlocks, onClickBlock }: AggregatedMaintenanceBlockProps) {

  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
        <SectionText title={sectionTitle} />
        
        {aggregatedBlocks.length > 0 ? (
          <div className="flex flex-col gap-3">
            {aggregatedBlocks.map((block) => {
              const { title, subtitle } = formatMaintenanceBlockDisplay(block.startDate, block.startHour, block.endDate, block.endHour);

              return (
                <SlotCard 
                  key={block.id}
                  icon={<Wrench className="w-5 h-5 text-amber-600" />}
                  iconBgClass="bg-amber-50 dark:bg-amber-950/20"
                  title={title}
                  subtitle={subtitle}
                  containerClass="border-amber-100 dark:border-amber-900/20"
                  endContent={
                    block.notes ? (
                      <div className="max-w-[140px] truncate text-xs font-normal text-gray-400 bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                        {block.notes}
                      </div>
                    ) : undefined
                  }
                  onClick={() => {
                    if (onClickBlock) {
                      onClickBlock(block.id);
                    }
                  }}
                />
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-400 pl-1 mt-1">
            {t("adminDashboard.no_active_maintenance")}
          </p>
        )}
      </div>
    );
}