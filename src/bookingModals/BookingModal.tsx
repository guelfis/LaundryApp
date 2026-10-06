import { IonToast} from '@ionic/react';
import BottomModal from '../baseComponents/BottomModal';
import ModalButton from '../baseComponents/ModalButton';
import { SlotStatus } from '../constants/SlotStatus';
import { Slot, useBookingActions, useBookingFilters } from '../hooks/useBookings';
import { AggregatedSlotInfo, getSlotLabel, SlotTimeState } from '../utils/slotsUtils';
import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo } from 'react';
import { SlotBadge } from '../components/SlotBadge';
import { SlotSpecsCard } from '../components/SlotSpecCard';
import SuggestionToggle from '../components/SuggestionToggle';
import { HouseholdSlot } from '../lib/databaseTypes';
import { getDateString } from '../utils/datesGetter';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: { dateStr: string, slot: HouseholdSlot, slotTimeState: SlotTimeState; } | null;
  currentSlot: AggregatedSlotInfo;
  nextSlotAvailable?: boolean; // Pass true from the parent grid if the next chronological slot row is empty
  nextSlot?: HouseholdSlot| null;   // e.g., [10, 11]
}

export default function BookingModal({ 
  isOpen, 
  onClose, 
  selectedSlot, 
  currentSlot,
  nextSlotAvailable = false,
  nextSlot
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

  const displayDate = useMemo(() => {
    if (!selectedSlot?.dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(selectedSlot.dateStr)) {
      const [y, m, d] = selectedSlot.dateStr.split('-').map(Number);
      return getDateString(d, m - 1, y);
    }
    return selectedSlot.dateStr;
  }, [selectedSlot?.dateStr]);

  if (!isOpen || !selectedSlot) return null;

  const handleBook = async () => {
    if (!apartmentId) return;
    try {
      const finalSlot = bookConsecutive && nextSlot
        ? [selectedSlot.slot, nextSlot]
        : [selectedSlot.slot];

      const slots: Slot[] = [];

      // 2. Loop through the flat array in pairs of 2 to extract [start, end] for each atomic slot
      finalSlot.forEach((slot) => {
        slots.push({ startHour: slot.start, endHour: slot.end });
      });

      // 3. Fire the mutation with matching parallel arrays
      // Single booking passes: startHour:, endHour: [10]
      // Consecutive booking passes: startHour:, endHour: [10, 12]
      await bookSlot({
        apartmentId,
        dateStr: selectedSlot.dateStr, 
        slotHours: slots,
        isAdminBlock: isAdminMode 
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
  
  const displaySlotLabel = bookConsecutive && nextSlot
    ? `${selectedSlot.slot.start} - ${nextSlot.end}`
    : getSlotLabel(selectedSlot.slot);

  const isYours = currentSlot.status === SlotStatus.BOOKED_BY_USER;
  const isBooked = currentSlot.status === SlotStatus.BOOKED;
  const isBlocked = currentSlot.status === SlotStatus.NOT_RESERVABLE || currentSlot.status === SlotStatus.OVERRIDDEN;
  const isAvailable = currentSlot.status === SlotStatus.AVAILABLE || currentSlot.status === SlotStatus.RELEASED;

  const modalTitle = isYours 
    ? t('slotModal.title_yours') 
    : isBooked 
      ? t('slotModal.title_occupied') 
      : isBlocked 
        ? t('slotModal.title_blocked') 
        : t('slotModal.title_available');

  const canRelease = isYours || (isAdminMode && isBlocked);

  return (
    <BottomModal
      isOpen={isOpen} 
      onClose={onClose} 
      title={modalTitle}
    >
      <div className="space-y-6 mt-4 mb-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ion-color-step-400)' }}>
            Slot Summary
          </span>
          <SlotBadge status={currentSlot.status} isLive={selectedSlot.slotTimeState === 'live'} />
        </div>

        {/* 2. SPECIFICATION BLOCK: Clean, Scannable Grid Card */}
        <SlotSpecsCard dateString={displayDate} slotLabel={displaySlotLabel} />

        {/* CONSECUTIVE SUGGESTION ENGINE: Renders only if slot is empty and next one is free */}
        {isAvailable && nextSlotAvailable && nextSlot && selectedSlot.slotTimeState === 'future' && (
          <SuggestionToggle
            checked={bookConsecutive}
            onToggle={setBookConsecutive}
            title={`${isAdminMode ? t('slotModal.suggest_consecutive_admin') : t('slotModal.suggest_consecutive')} (${getSlotLabel(nextSlot)})`}
            description={isAdminMode ? t('slotModal.suggest_consecutive_desc_admin') : t('slotModal.suggest_consecutive_desc')}
          />
        )}

        <p className="text-sm leading-relaxed px-1" style={{ color: 'var(--ion-color-step-700)' }}>
          {selectedSlot.slotTimeState === 'past' 
            ? t('slotModal.message_past')
            : isYours 
              ? t('slotModal.message_is_yours') 
              : (isAdminMode && isBlocked)
                ? t('slotModal.message_is_admin_block')
                : `${t('slotModal.message_selected')} ${currentSlot.displaySubstring}`
          }
        </p>

        {currentSlot.notes && (
          <div className='flex items-center mt-4'>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ion-color-step-400)' }}>
              {t('slotModal.notes')} :
            </span>
            <p className="text-sm leading-relaxed px-1" style={{ color: 'var(--ion-color-step-700)' }}>
              {currentSlot.notes}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 pb-4">
        {selectedSlot.slotTimeState !== 'past' && (
          <>
            {isAvailable && (
              <ModalButton variant="primary" disabled={isBooking} onClick={handleBook}>
                {isAdminMode ? t('slotModal.block_button') : t('slotModal.book_button')}
              </ModalButton>
            )}

            {canRelease && (
              <ModalButton variant="danger" disabled={isReleasing} onClick={handleRelease}>
                {isAdminMode ? t('slotModal.unblock_button') : t('slotModal.release_button')}
              </ModalButton>
            )}

            {(isBooked || (!isAdminMode && isBlocked)) && (
              <div className="flex items-center justify-center gap-1.5 p-3 rounded-xl text-center text-sm" style={{ backgroundColor: 'var(--ion-color-step-100)', color: 'var(--ion-color-step-500)' }}>
                <Lock className="w-4 h-4" />
                {isBlocked ? t('dashboardSlotCard.not_reservable_desc') : t('slotModal.not_editable')}
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
