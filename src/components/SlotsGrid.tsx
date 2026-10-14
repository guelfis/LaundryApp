import { HouseholdSlot } from '../lib/databaseTypes';
import { getSlotLabel } from '../utils/slotsUtils';
import { useTranslation } from 'react-i18next';

interface SlotsGridProps {
  slots: HouseholdSlot[];
  selectedSlots: HouseholdSlot[];
  availableSlots?: HouseholdSlot[];
  disabledSlots?: HouseholdSlot[];
  onToggleSlot: (slot: HouseholdSlot) => void;
  startSlot?: HouseholdSlot | null;
  endSlot?: HouseholdSlot | null;
}

export default function SlotsGrid({
  slots,
  selectedSlots,
  availableSlots,
  disabledSlots,
  onToggleSlot,
  startSlot,
  endSlot,
}: SlotsGridProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-3 gap-2 mt-1">
      {slots.map((slot) => {
        const label = getSlotLabel(slot);
        const isSelected = selectedSlots.some(s => s.start === slot.start && s.end === slot.end);
        
        // Disabled if it is in the past
        const isPast = disabledSlots
          ? disabledSlots.some(s => s.start === slot.start && s.end === slot.end)
          : false;

        // Is already blocked by admin (not available to book, but not past)
        const isAlreadyBlocked = availableSlots
          ? !availableSlots.some(s => s.start === slot.start && s.end === slot.end) && !isPast
          : false;

        const isDisabled = isPast;

        const isStartBoundary = startSlot
          ? startSlot.start === slot.start && startSlot.end === slot.end
          : false;
        const isEndBoundary = endSlot
          ? endSlot.start === slot.start && endSlot.end === slot.end
          : false;

        let backgroundColor = 'transparent';
        let borderColor = 'var(--ion-color-step-200, #e0e0e0)';
        let color = 'var(--ion-text-color, #111)';

        if (isPast) {
          backgroundColor = 'var(--ion-color-step-100, rgba(0,0,0,0.05))';
          borderColor = 'var(--ion-color-step-200, #e0e0e0)';
          color = 'var(--ion-color-step-400, #888)';
        } else if (isSelected) {
          if (isAlreadyBlocked) {
            backgroundColor = 'rgba(219,76,99,0.08)';
            borderColor = 'rgba(219,76,99,0.5)';
            color = 'rgba(219,76,99,0.7)';
          } else {
            backgroundColor = 'rgba(219,76,99,0.18)';
            borderColor = 'rgba(219,76,99,0.85)';
            color = 'rgba(219,76,99,1)';
          }
        } else if (isAlreadyBlocked) {
          backgroundColor = 'var(--ion-color-step-100, rgba(0,0,0,0.03))';
          borderColor = 'var(--ion-color-step-200, #e0e0e0)';
          color = 'var(--ion-color-step-400, #888)';
        }

        return (
          <button
            key={`slot-btn-${label}`}
            type="button"
            disabled={isDisabled}
            onClick={() => onToggleSlot(slot)}
            className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all outline-none flex flex-col items-center justify-center gap-0.5 relative ${
              isPast ? 'opacity-40 cursor-not-allowed line-through' : ''
            } ${
              isAlreadyBlocked && !isSelected ? 'opacity-60' : ''
            }`}
            style={{
              backgroundColor,
              borderColor,
              color,
              boxShadow: (isStartBoundary || isEndBoundary) ? '0 0 0 2px rgba(219,76,99,0.3)' : undefined,
            }}
          >
            <span className={isPast || (isAlreadyBlocked && !isSelected) ? 'line-through' : ''}>
              {label}
            </span>
            {isAlreadyBlocked && (
              <span className="text-[10px] font-normal opacity-80 leading-none">
                {t('adminBlockModal.blocked_badge', 'Blocked')}
              </span>
            )}
            {!isAlreadyBlocked && isStartBoundary && !isEndBoundary && (
              <span className="text-[9px] font-semibold text-pink-600 dark:text-pink-400 leading-none">
                Start
              </span>
            )}
            {!isAlreadyBlocked && isEndBoundary && !isStartBoundary && (
              <span className="text-[9px] font-semibold text-pink-600 dark:text-pink-400 leading-none">
                End
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
