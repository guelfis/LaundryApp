import { IonToast } from '@ionic/react';
import BottomModal from '../components/BottomModal';
import ModalButton from '../components/ModalButton';
import { SlotStatus } from '../constants/SlotStatus';
import { useBookingActions, useBookingFilters } from '../hooks/useBookings';
import { AggregatedSlotInfo, getSlotLabel, SlotTimeState } from './slotsUtils';
import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { SlotBadge } from './SlotBadge';
import { SlotSpecsCard } from './SlotSpecCard';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: { dateString: string; slotTimes: number[], slotTimeState: SlotTimeState; } | null;
  currentSlot: AggregatedSlotInfo;
}

export default function BookingModal({ 
  isOpen, 
  onClose, 
  selectedSlot, 
  currentSlot,
}: BookingModalProps) {

  const { t } = useTranslation();
  const { apartmentId } = useBookingFilters();
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastColor, setToastColor] = useState<'success' | 'warning' | 'danger'>('success');
  
  const { bookSlot, isBooking, releaseSlot, isReleasing } = useBookingActions();

  if (!isOpen || !selectedSlot) return null;
  const handleBook = async () => {
    if (!apartmentId){
      return;
    }
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
      setToastMessage(errorInstance.message); 
      setToastColor('danger');
    }
  };
   const handleRelease = async () => {
    if (!currentSlot.id) return;
    try {
      const response = await releaseSlot(currentSlot.id);
      setToastMessage(response.message); // released or deleted
      setToastColor('success');
      onClose();
    } catch (err) {
      const errorInstance = err as Error;
      setToastMessage(errorInstance.message);
      setToastColor('danger');
    }
  };
      
  const displaySlotLabel = getSlotLabel(selectedSlot.slotTimes);
  const slotLabel = getSlotLabel(selectedSlot.slotTimes);
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

        </div>
      </div>

      {/* 3. EXPLANATORY DYNAMIC DESCRIPTION */}
        <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed px-1">
          {selectedSlot.slotTimeState ==='past' 
            ? t('slotModal.message_past')
            :  isYours 
            ?  t('slotModal.message_is_yours')
            :`${t('slotModal.message_selected')} ${currentSlot.displaySubstring}`
          }
        </p>
      
    </div>

      {/* 3. Logical User Actions Blueprint Structure Wrapper */}
      <div className="flex flex-col gap-4 pb-4">
          
        {/* BLOCK PAST SLOTS COMPLETELY */}
        {selectedSlot.slotTimeState !== 'past' && (
          <>
            {/* CASE A: Slot is empty -> Anyone can book */}
            {(currentSlot.status === SlotStatus.AVAILABLE || currentSlot.status === SlotStatus.RELEASED) && (
              <ModalButton variant="primary" disabled={isBooking} onClick={handleBook}>
                {t('slotModal.book_button')}
              </ModalButton>
            )}

            {/* CASE B: Slot is active and belongs to MY apartment -> I can release it */}
            {currentSlot.status === SlotStatus.BOOKED_BY_USER && (
              <ModalButton variant="danger" disabled={isReleasing} onClick={handleRelease}>
                {t('slotModal.release_button')}
              </ModalButton>
            )}

            {/* CASE C: Slot is active but belongs to SOMEONE ELSE */}
            {currentSlot.status === SlotStatus.BOOKED && (
              <div className="flex flex-center gap-1.5 p-3 bg-gray-100 dark:bg-slate-800 rounded-xl text-center text-sm text-gray-500">
                <Lock />
              {t('slotModal.not_editable')}
              </div>
            )}
          </>
        )}

        <ModalButton variant="secondary" disabled={isBooking || isReleasing} onClick={onClose}>
          {t('common.button_close')}
        </ModalButton>
        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage}
          duration={3000}
          onDidDismiss={() => setToastMessage('')}
          color={toastColor}
        />
      </div>
    </BottomModal>
  );
}
