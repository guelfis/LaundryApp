import SlotCard from "../baseComponents/SlotCard";
import { Wrench } from "lucide-react"; 
import { Booking } from "../lib/databaseTypes";
import SectionText from "../baseComponents/SectionText";
import { useTranslation } from "react-i18next";


interface FormattedMaintenanceBlock {
  title: string;
  subtitle: string;
}

/**
 * Transforms absolute maintenance ISO strings into clean, responsive card layouts.
 * Outputs readable structures like "Sep 29 – 30, 2026"
 */
function formatMaintenanceBlockDisplay(startTimeStr: string, endTimeStr: string): FormattedMaintenanceBlock {
  const startObj = new Date(startTimeStr);
  const endObj = new Date(endTimeStr);

  // 1. Core time tokens (24h format, e.g., "12:00")
  const startTimeStrFormatted = startObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const endTimeStrFormatted = endObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  // 2. Core calendar tokens
  const startDay = startObj.getDate();
  const endDay = endObj.getDate();
  const startMonthStr = startObj.toLocaleDateString('en-US', { month: 'short' }); // "Sep"
  const endMonthStr = endObj.toLocaleDateString('en-US', { month: 'short' });   // "Sep"
  const startYear = startObj.getFullYear();
  const endYear = endObj.getFullYear();

  const isMultiDay = startDay !== endDay || startMonthStr !== endMonthStr || startYear !== endYear;

  // 3. Dynamic Title Generation
  let title = startObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); // Single day default
  
  if (isMultiDay) {
    if (startYear !== endYear) {
      // Cross-year: "Dec 30, 2026 – Jan 2, 2027"
      title = `${startMonthStr} ${startDay}, ${startYear} – ${endMonthStr} ${endDay}, ${endYear}`;
    } else if (startMonthStr !== endMonthStr) {
      // Cross-month: "Sep 30 – Oct 1, 2026"
      title = `${startMonthStr} ${startDay} – ${endMonthStr} ${endDay}, ${startYear}`;
    } else {
      // Standard multi-day same month: "Sep 29 – 30, 2026"
      title = `${startMonthStr} ${startDay} – ${endDay}, ${startYear}`;
    }
  }

  // 4. Dynamic Subtitle Generation
  const subtitle = isMultiDay 
    ? `${startTimeStrFormatted} on ${startMonthStr} ${startDay} — ${endTimeStrFormatted} on ${endMonthStr} ${endDay}`
    : `${startTimeStrFormatted} - ${endTimeStrFormatted}`;

  return { title, subtitle };
}

interface AggregatedMaintenanceBlockProps {
  sectionTitle: string;
  aggregatedBlocks: Booking[]
  onClickBlock?: (block: Booking) => void; 
}

export default function AggregatedMaintenanceBlock({ sectionTitle, aggregatedBlocks, onClickBlock }: AggregatedMaintenanceBlockProps) {

  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
        <SectionText title={sectionTitle} />
        
        {aggregatedBlocks.length > 0 ? (
          <div className="flex flex-col gap-3">
            {aggregatedBlocks.map((block) => {
              const { title, subtitle } = formatMaintenanceBlockDisplay(block.start_time, block.end_time);

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
                      onClickBlock(block);
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