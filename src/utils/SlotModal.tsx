import { useMemo } from 'react';
import BottomModal from '../components/BottomModal';
import ModalButton from '../components/ModalButton';
import StatusDot from '../components/StatusDot';
import { SlotStatus } from '../constants/SlotStatus';
import { useBookingActions } from '../useBookings';
import { AggregatedSlotInfo, getSlotLabel } from './slotsUtils';
import { getCleanStorageItem } from '../auth/authUtils';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: { dateString: string; slotTimes: number[], isLive: boolean } | null;
  currentSlot: AggregatedSlotInfo;
}

export default function BookingModal({ 
  isOpen, 
  onClose, 
  selectedSlot, 
  currentSlot,
}: BookingModalProps) {

  
  const apartmentId = useMemo(() => getCleanStorageItem('apartmentId') || '', []);
  const { bookSlot, isBooking, releaseSlot, isReleasing } = useBookingActions();

  if (!isOpen || !selectedSlot) return null;
  const handleBook = async () => {
    try {
      await bookSlot({
        apartmentId,
        dateStr: selectedSlot.dateString, 
        startHour: selectedSlot.slotTimes[0],
        endHour: selectedSlot.slotTimes[1]
      });
      onClose();
    } catch (err) {
      const errorInstance = err as Error;
      alert(errorInstance.message); 
    }
  };
   const handleRelease = async () => {
    if (!currentSlot.id) return;
    try {
      const response = await releaseSlot(currentSlot.id);
      alert(response.message); // released or deleted
      onClose();
    } catch (err) {
      const errorInstance = err as Error;
      alert(errorInstance.message);
    }
  };
      
  const slotLabel = getSlotLabel(selectedSlot.slotTimes);
  const isYours = currentSlot.status === SlotStatus.BOOKED_BY_USER;
  const isBooked = currentSlot.status === SlotStatus.BOOKED;


  return (
    <BottomModal
      isOpen={isOpen} 
      onClose={onClose} 
      title={isYours ? "Your Booking" : isBooked ? "Slot Occupied" : "Available Slot"}
    >
      <div className="space-y-6 mt-4 mb-4">
      {/* 1. STATUS CONTEXT BADGE (Dynamic UI indicator) */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
          Timeframe Summary
        </span>
        {isYours ? (
          <span className="flex items-center gap-1.5 bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold text-xs px-3 py-1.5 rounded-xl">
            <StatusDot color="blue" pulse={selectedSlot.isLive} />
            Reserved
          </span>
          
        ) : isBooked ? (
          <span className="flex items-center gap-1.5 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-bold text-xs px-3 py-1.5 rounded-xl">
            <StatusDot color="red" pulse={selectedSlot.isLive} />
            Booked
          </span>
        ) : (
          <span className="flex items-center gap-1.5 bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 font-bold text-xs px-3 py-1.5 rounded-xl">
            <StatusDot color="green" pulse={selectedSlot.isLive} />
            Free
          </span>
        )}
      </div>

      {/* 2. SPECIFICATION BLOCK: Clean, Scannable Grid Card */}
      <div className="bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center border-b border-gray-200/60 dark:border-slate-700/50 pb-2.5">
          <span className="text-sm text-gray-500 dark:text-slate-400">Date</span>
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            {selectedSlot.dateString}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-slate-400">Hours Block</span>
          <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2.5 py-1 rounded-lg text-sm">
            {slotLabel}
          </span>
        </div>
      </div>

      {/* 3. EXPLANATORY DYNAMIC DESCRIPTION */}
      <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed px-1">
        {isYours 
          ? "You are holding this laundry spot. If you no longer need to use the machines, please release it so other apartments can book it."
          : `The selected timeframe ${currentSlot.displaySubstring}`
        }
      </p>
    </div>

      {/* 3. Logical User Actions Blueprint Structure Wrapper */}
      <div className="flex flex-col gap-4 pb-4">
        
        {/* CASE A: Slot is empty or has been fully released -> Anyone can book */}
        {(currentSlot.status === SlotStatus.AVAILABLE || currentSlot.status === SlotStatus.RELEASED) && (
          <ModalButton variant="primary" disabled={isBooking} onClick={() => handleBook()}>
            Book Slot
          </ModalButton>
        )}

        {/* CASE B: Slot is active and belongs to MY apartment -> I can release it */}
        {currentSlot.status === SlotStatus.BOOKED_BY_USER && (
          <ModalButton variant="danger" disabled={isReleasing} onClick={() => handleRelease}>
            Release Slot
          </ModalButton>
        )}

        {/* CASE C: Slot is active but belongs to SOMEONE ELSE -> View only state */}
        {currentSlot.status === SlotStatus.BOOKED && (
          <div className="p-3 bg-gray-100 dark:bg-slate-800 rounded-xl text-center text-sm text-gray-500">
            🔒 You cannot modify bookings owned by other apartments.
          </div>
        )}

        <ModalButton variant="secondary" disabled={isBooking || isReleasing} onClick={onClose}>
          Close
        </ModalButton>
      </div>
    </BottomModal>
  );
}
