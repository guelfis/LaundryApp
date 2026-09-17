import { HouseholdSlot } from '../lib/databaseTypes';
import { getSlotLabel } from '../utils/slotsUtils';

interface SlotsGridProps {
  slots: HouseholdSlot[];
  selectedSlots: HouseholdSlot[];
  onToggleSlot: (slot: HouseholdSlot) => void;
}

export default function SlotsGrid({ slots, selectedSlots, onToggleSlot }: SlotsGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2 mt-1">
      {slots.map((slot) => {
        const label = getSlotLabel(slot);
        const isSelected = selectedSlots.some(s => s.start === slot.start && s.end === slot.end);
        return (
          <button
            key={`slot-btn-${label}`}
            type="button"
            onClick={() => onToggleSlot(slot)}
            className="py-2.5 rounded-xl text-xs font-bold border transition-all outline-none"
            style={{
              backgroundColor: isSelected ? 'rgba(219,76,99,0.15)' : 'transparent',
              borderColor: isSelected ? 'rgba(219,76,99,0.8)' : 'var(--ion-color-step-200, #e0e0e0)',
              color: isSelected ? 'rgba(219,76,99,1)' : 'var(--ion-text-color, #111)'
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
