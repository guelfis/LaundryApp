import { IonToast} from '@ionic/react';
import BottomModal from '../components/BottomModal';
import ModalButton from '../components/ModalButton';
import { SlotStatus } from '../constants/SlotStatus';
import { useBookingActions, useBookingFilters } from '../hooks/useBookings';
import { AggregatedSlotInfo, getSlotLabel, SlotTimeState } from '../utils/slotsUtils';
import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { SlotBadge } from '../utils/SlotBadge';
import { SlotSpecsCard } from '../utils/SlotSpecCard';
import SuggestionToggle from '../components/SuggestionToggle';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: { dateString: string; slotTimes: number[], slotTimeState: SlotTimeState; } | null;
  currentSlot: AggregatedSlotInfo;
  nextSlotAvailable?: boolean; // Pass true from the parent grid if the next chronological slot row is empty
  nextSlotTimes?: number[] | null;   // e.g., [10, 11]
}

export default function BookingModal({ 
  isOpen, 
  onClose, 
  selectedSlot, 
  currentSlot,
  nextSlotAvailable = false,
  nextSlotTimes
}: BookingModalProps) {

  const { t } = useTranslation();
  const { apartmentId, isAdminMode } = useBookingFilters();
  const [bookConsecutive, setBookConsecutive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastColor, setToastColor] = useState<'success' | 'warning' | 'danger'>('success');

  const { bookSlot, isBooking, releaseSlot, isReleasing } = useBookingActions();

  useEffect(() => {
    if (isOpen) setBookConsecutive(false);
  }, [isOpen]);

  if (!isOpen || !selectedSlot) return null;

  const handleBook = async () => {
  if (!apartmentId) return;
  try {
    // 1. Establish the array of slots to book
    // Standard slot looks like: 
    // Consecutive slot looks like: 
    const finalSlotTimes = bookConsecutive && nextSlotTimes 
      ? [...selectedSlot.slotTimes, ...nextSlotTimes]
      : selectedSlot.slotTimes;

    const startHoursArray: number[] = [];
    const endHoursArray: number[] = [];

    // 2. Loop through the flat array in pairs of 2 to extract [start, end] for each atomic slot
    for (let i = 0; i < finalSlotTimes.length; i += 2) {
      startHoursArray.push(finalSlotTimes[i]);
      endHoursArray.push(finalSlotTimes[i + 1]);
    }

    // 3. Fire the mutation with matching parallel arrays
    // Single booking passes: startHour:, endHour: [10]
    // Consecutive booking passes: startHour:, endHour: [10, 12]
    await bookSlot({
      apartmentId,
      dateStr: selectedSlot.dateString, 
      startHour: startHoursArray,
      endHour: endHoursArray,
    });
    
    onClose();
  } catch (err) {
    setToastMessage((err as Error).message); 
    setToastColor('danger');
  }
};

  const handleRelease = async () => {
    if (!currentSlot.id) return;
    try {
      const response = await releaseSlot(currentSlot.id);
      setToastMessage(response.message); 
      setToastColor('success');
      onClose();
    } catch (err) {
      setToastMessage((err as Error).message);
      setToastColor('danger');
    }
  };
  
  const displaySlotLabel = bookConsecutive && nextSlotTimes
    ? `${selectedSlot.slotTimes[0]} - ${nextSlotTimes[nextSlotTimes.length - 1]}`
    : getSlotLabel(selectedSlot.slotTimes);

  const isYours = currentSlot.status === SlotStatus.BOOKED_BY_USER;
  const isBooked = currentSlot.status === SlotStatus.BOOKED;

  return (
    <BottomModal
      isOpen={isOpen} 
      onClose={onClose} 
      title={isYours ? t('slotModal.title_yours') : isBooked ? t('slotModal.title_occupied') : t('slotModal.title_available')}
    >
      <div className="space-y-6 mt-4 mb-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ion-color-step-400)' }}>
            Slot Summary
          </span>
          <SlotBadge status={currentSlot.status} isLive={selectedSlot.slotTimeState === 'live'} />
        </div>

      {/* 2. SPECIFICATION BLOCK: Clean, Scannable Grid Card */}
      <SlotSpecsCard dateString={selectedSlot.dateString} slotLabel={displaySlotLabel} />

        {/* CONSECUTIVE SUGGESTION ENGINE: Renders only if slot is empty and next one is free */}
        {currentSlot.status === SlotStatus.AVAILABLE && nextSlotAvailable && nextSlotTimes && selectedSlot.slotTimeState === 'future' && !isAdminMode && (
          <SuggestionToggle
            checked={bookConsecutive}
            onToggle={setBookConsecutive}
            title={`${t('slotModal.suggest_consecutive', 'Book Consecutive Slot')} (${getSlotLabel(nextSlotTimes)})`}
            description={t('slotModal.suggest_consecutive_desc', 'Book this slot as well')}
          />
        )}

        <p className="text-sm leading-relaxed px-1" style={{ color: 'var(--ion-color-step-700)' }}>
          {selectedSlot.slotTimeState === 'past' 
            ? t('slotModal.message_past')
            : isYours ? t('slotModal.message_is_yours') : `${t('slotModal.message_selected')} ${currentSlot.displaySubstring}`
          }
        </p>
      </div>

      <div className="flex flex-col gap-4 pb-4">
        {selectedSlot.slotTimeState !== 'past' && (
          <>
            {(currentSlot.status === SlotStatus.AVAILABLE || currentSlot.status === SlotStatus.RELEASED) && !isAdminMode && (
              <ModalButton variant="primary" disabled={isBooking} onClick={handleBook}>
                {t('slotModal.book_button')}
              </ModalButton>
            )}

            {isYours && (
              <ModalButton variant="danger" disabled={isReleasing} onClick={handleRelease}>
                {t('slotModal.release_button')}
              </ModalButton>
            )}

            {isBooked && (
              <div className="flex items-center justify-center gap-1.5 p-3 rounded-xl text-center text-sm" style={{ backgroundColor: 'var(--ion-color-step-100)', color: 'var(--ion-color-step-500)' }}>
                <Lock className="w-4 h-4" />
                {t('slotModal.not_editable')}
              </div>
            )}
          </>
        )}

        <ModalButton variant="secondary" disabled={isBooking || isReleasing} onClick={onClose}>
          {t('common.button_close')}
        </ModalButton>
        
        <IonToast isOpen={!!toastMessage} message={toastMessage} duration={3000} onDidDismiss={() => setToastMessage('')} color={toastColor} />
      </div>
    </BottomModal>
  );
}
