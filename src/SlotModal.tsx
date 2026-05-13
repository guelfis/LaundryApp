import { useBookingFilters, useMonthBookings } from './useBookings';
import { useMemo } from 'react';
import { LoadingSpinner } from './components/LoadingSpinner';
import { getBookingsMap, getBookingStatus } from './utils/slotsUtils';
import BottomModal from './components/BottomModal';
import ModalButton from './components/ModalButton';


interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: { day: string; slot: string, slotKey: string } | null;
}

export default function BookingModal({ isOpen, onClose, selectedSlot }: BookingModalProps) {
  

  const { viewDate, householdId } = useBookingFilters();
  const { data: bookings = [], isLoading } = useMonthBookings(householdId, viewDate); 
        
  // Create a map for quick lookup of bookings by slotKey only when bookings change
  const bookingsMap = useMemo(() => {
    return getBookingsMap(bookings);
  }, [bookings]);

  const currentSlot = selectedSlot ? (bookingsMap[selectedSlot.slotKey] || []) : [];
  const slotStatus = getBookingStatus(currentSlot);

  // check if the slot is already booked by the same household to allow them to release it
  // const isBookedBySameHousehold = currentSlot.some(booking => booking.apartment_id === householdId); // WRONG

  // Determine the substring to display based on the slot status
   const substring = useMemo(() => {
    if (slotStatus === 'Available') return 'is available for booking.';
    if (slotStatus === 'Booked') return 'is already booked';
    if (slotStatus === 'Released') return 'has been released, it can be booked again for the remaining time before the next slot starts.';
    return '';
  }, [slotStatus]);


  if (!isOpen || !selectedSlot) return null;
  if (isLoading) return <LoadingSpinner />;

 
  return (
    <BottomModal
            isOpen={isOpen} 
            onClose={onClose} 
            title={`Slot ${selectedSlot.slot}: ${slotStatus}`}
          >

        <header className="mb-8">
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {`You have selected ${selectedSlot.day} at ${selectedSlot.slot}`}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">The selected slot {substring}.</p>
          
        </header>

        <div className="flex flex-col gap-4 pb-4">
          <ModalButton 
            variant="primary"
            onClick={() => console.log('Booking...', selectedSlot)}
          >
            Book Slot
          </ModalButton>

          <ModalButton 
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </ModalButton>
        </div>
      </BottomModal>
  );
}