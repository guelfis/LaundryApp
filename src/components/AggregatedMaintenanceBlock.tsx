import SlotCard from "../baseComponents/SlotCard";
import { Wrench } from "lucide-react"; 
import SectionText from "../baseComponents/SectionText";
import { useTranslation } from "react-i18next";
import { AggregatedBookings } from "../utils/slotsUtils";


interface FormattedMaintenanceBlock {
  title: string;
  subtitle: string;
}

/**
 * Transforms absolute maintenance ISO strings into clean, responsive card layouts.
 * Outputs readable structures like "Sep 29 – 30, 2026"
 */
function formatMaintenanceBlockDisplay(startDate: string, startHour: number, endDate:string, endHour:number): FormattedMaintenanceBlock {

  // dates are in the format "year-month-day"
  // 2. Core calendar tokens
  
  const startDateArray = startDate.split('-');
  const endDateArray = endDate.split('-');
  const startYear = startDateArray[0]; // "2026"
  const endYear = endDateArray[0];   // "2026"
  const startDay = startDateArray.slice(-1);
  const endDay = endDateArray.slice(-1);

  // 2. Safely get the short month name ("Sep") using a neutral UTC date string
  // Adding "T00:00:00Z" guarantees JavaScript parses it exactly as written without timezone shifts
  const startDateObj = new Date(`${startDate}T00:00:00Z`)
  const startMonthStr = startDateObj.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  const endMonthStr = new Date(`${endDate}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });

  const isMultiDay = startDay !== endDay || startMonthStr !== endMonthStr || startYear !== endYear;

  // 3. Dynamic Title Generation
  let title = startDateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); // Single day default
  
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
    ? `${startHour} on ${startMonthStr} ${startDay} — ${endHour} on ${endMonthStr} ${endDay}`
    : `${startHour} - ${endHour}`;

  return { title, subtitle };
}

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