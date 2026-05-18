import BottomModal from '../components/BottomModal';
import ModalButton from '../components/ModalButton';
import { SlotStatus } from '../constants/SlotStatus';
import { AggregatedSlotInfo } from './slotsUtils';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: { day: string; slot: string } | null;
  currentSlot: AggregatedSlotInfo;
}

export default function BookingModal({ 
  isOpen, 
  onClose, 
  selectedSlot, 
  currentSlot,
}: BookingModalProps) {

  if (!isOpen || !selectedSlot) return null;

  return (
    <BottomModal
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Slot ${selectedSlot.slot}: ${currentSlot.status.toUpperCase()}`}
    >
      <header className="mb-8">
        <p className="text-gray-600 dark:text-gray-300 mt-2 font-medium">
          {`You have selected ${selectedSlot.day}`}
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          The selected timeframe {currentSlot.displaySubstring}
        </p>
      </header>

      {/* 3. Logical User Actions Blueprint Structure Wrapper */}
      <div className="flex flex-col gap-4 pb-4">
        
        {/* CASE A: Slot is empty or has been fully released -> Anyone can book */}
        {(currentSlot.status === SlotStatus.AVAILABLE || currentSlot.status === SlotStatus.RELEASED) && (
          <ModalButton variant="primary" onClick={() => console.log('Creating booking...', selectedSlot)}>
            Book Slot
          </ModalButton>
        )}

        {/* CASE B: Slot is active and belongs to MY apartment -> I can release it */}
        {currentSlot.status === SlotStatus.BOOKED_BY_USER && (
          <ModalButton variant="danger" onClick={() => console.log('Releasing my slot...', selectedSlot)}>
            Release Slot Early
          </ModalButton>
        )}

        {/* CASE C: Slot is active but belongs to SOMEONE ELSE -> View only state */}
        {currentSlot.status === SlotStatus.BOOKED && (
          <div className="p-3 bg-gray-100 dark:bg-slate-800 rounded-xl text-center text-sm text-gray-500">
            🔒 You cannot modify bookings owned by other apartments.
          </div>
        )}

        <ModalButton variant="secondary" onClick={onClose}>
          Close Window
        </ModalButton>
      </div>
    </BottomModal>
  );
}
