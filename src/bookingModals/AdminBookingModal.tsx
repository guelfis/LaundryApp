import { IonToast, IonDatetime, IonModal } from '@ionic/react';
import BottomModal from '../baseComponents/BottomModal';
import ModalButton from '../baseComponents/ModalButton';
import { SLOTS } from '../constants/dates';
import { useBookingActions, useBookingFilters } from '../hooks/useBookings';
import { useApartments } from '../hooks/useApartments';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo } from 'react';
import SuggestionToggle from '../components/SuggestionToggle';
import SlotsGrid from '../components/SlotsGrid';
import NotesArea from '../components/NotesArea';
import { DatePicker } from '../baseComponents/DatePicker';
import { Booking } from '../lib/databaseTypes';
import { calculateMaxEndDate, getAvailableSlotsForDate, getFirstAvailableStartDate, processAdminBlocks, toggleSlotInCollection } from '../utils/adminModalUtils';

interface AdminBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[]; // Pass the list of all admin bookings from the parent component
}

export default function AdminBlockModal({ isOpen, onClose, bookings }: AdminBlockModalProps) {
  const { t } = useTranslation();
  const { householdId } = useBookingFilters();
  const { data: apartments = [] } = useApartments(householdId);
  const { bookSlot, isBooking } = useBookingActions();

  const adminApartment = apartments.find(a => a.display_name === '_ADMIN_');
  
  //  Generate the dictionary of admin blocks for quick lookup and validation
  const adminBlocksMap = useMemo(() => {
    return processAdminBlocks(bookings, SLOTS);
  }, [bookings]);

  
  // Unified visual interaction states matching your grid template
  const [isMultiDay, setIsMultiDay] = useState(false);
  
  // Format as strings instead of split arrays to ensure clean IonDatetime string tracking
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const absoluteMinStartDate = useMemo(() => {
    return getFirstAvailableStartDate(adminBlocksMap);
  }, [adminBlocksMap]);

  const maxEndDate = useMemo(() => {
    return calculateMaxEndDate(startDate, adminBlocksMap);
  }, [startDate, adminBlocksMap]);

  // Ionic calendar validation filter: Disable a day ONLY if it is completely full
  const isDateEnabled = (dateString: string) => {
    const pureDateIso = dateString.split('T')[0];
    return !adminBlocksMap[pureDateIso]?.isFullyBooked;
  };

  const availableSlotsForStartDay = useMemo(() => {
    return getAvailableSlotsForDate(startDate, adminBlocksMap, SLOTS);
  }, [startDate, adminBlocksMap]);

  const availableSlotsForEndDay = useMemo(() => {
    return getAvailableSlotsForDate(endDate, adminBlocksMap, SLOTS);
  }, [endDate, adminBlocksMap]);

  // Converted to arrays to support picking multiple slots for a single day!
  const [selectedStartSlots, setSelectedStartSlots] = useState<number[][]>([]);
  const [selectedEndSlots, setSelectedEndSlots] = useState<number[][]>([]);
  const [notes, setNotes] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastColor, setToastColor] = useState<'success' | 'warning' | 'danger'>('success');

  useEffect(() => {
    if (isOpen) {
      setIsMultiDay(false);
      setSelectedStartSlots([]);
      setSelectedEndSlots([]);
      setNotes('');
    }
  }, [isOpen]);

  // Helper toggle to add or remove slots from the administrative array list
  const toggleStartSlotSelection = (slot: number[]) => {
    setSelectedStartSlots(prev => toggleSlotInCollection(prev, slot));
  };

  const toggleEndSlotSelection = (slot: number[]) => {
    setSelectedEndSlots(prev => toggleSlotInCollection(prev, slot));
  };

  if (!isOpen) return null;

  const handleApplyBlock = async () => {
    if (!adminApartment) {
      setToastMessage(t('adminBlockModal.error_admin_missing'));
      setToastColor('danger');
      return;
    }

    if (selectedStartSlots.length === 0 || (isMultiDay && selectedEndSlots.length === 0)) {
      setToastMessage(t('adminBlockModal.error_incomplete'));
      setToastColor('warning');
      return;
    }

    try {
      const startHoursArray: number[] = [];
      const endHoursArray: number[] = [];

      if (!isMultiDay) {
        // CASE A: Single day block -> Push all selected atomic slots into parallel parameter arrays
        selectedStartSlots.forEach(slot => {
          startHoursArray.push(slot[0]);
          endHoursArray.push(slot[1]);
        });

        await bookSlot({
          apartmentId: adminApartment.id,
          dateStr: startDate,
          startHour: startHoursArray,
          endHour: endHoursArray,
          isAdminBlock: true
        });
      } else {
        // CASE B: Multiple days calculation range loop engine
        const currentDay = new Date(startDate);
        const finalDay = new Date(endDate);
        currentDay.setHours(0, 0, 0, 0);
        finalDay.setHours(23, 59, 59, 999);

        while (currentDay <= finalDay) {
          const dateStrToken = currentDay.toISOString().split('T')[0];

          SLOTS.forEach((slotConfig) => {
            startHoursArray.push(slotConfig[0]);
            endHoursArray.push(slotConfig[1]);
          });

          await bookSlot({
            apartmentId: adminApartment.id,
            dateStr: dateStrToken,
            startHour: startHoursArray,
            endHour: endHoursArray,
            isAdminBlock: true
          });

          startHoursArray.length = 0;
          endHoursArray.length = 0;

          currentDay.setDate(currentDay.getDate() + 1);
        }
      }

      setToastMessage(t('adminBlockModal.success'));
      setToastColor('success');
      onClose();
    } catch (err) {
      setToastMessage((err as Error).message);
      setToastColor('danger');
    }
  };

   return (
    <BottomModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('adminBlockModal.title')}
    >
      <div className="space-y-6 mt-4 mb-4">
        
        {/* 1. START TIMELINE SELECTOR */}
        <div className="flex flex-col gap-2">
          <DatePicker 
            label={t('adminBlockModal.select_start_date', 'Start Date:')}
            datetimeId="admin-start-picker-id"
            value={startDate}
            onChange={setStartDate}
            isDateEnabled={isDateEnabled}
            minDate={absoluteMinStartDate}
          />
          
          <SlotsGrid 
            slots={availableSlotsForStartDay} 
            selectedSlots={selectedStartSlots} 
            onToggleSlot={toggleStartSlotSelection} 
          />
        </div>

        {/* 2. MULTI-DAY ACCORDION TOGGLE CHECKBOX */}
        <SuggestionToggle
          checked={isMultiDay}
          onToggle={setIsMultiDay}
          title={t('adminBlockModal.multiple_days')}
        />
        

        {/* 3. DYNAMIC END DATE FORM MATRIX SECTION */}
        {isMultiDay && (
          <div className="flex flex-col gap-2 space-y-2">
            <DatePicker
              label={t('adminBlockModal.select_end_date', 'End Date:')}
              datetimeId="admin-end-picker-id"
              value={endDate}
              minDate={startDate} 
              onChange={setEndDate}
              maxDate={maxEndDate}
              isDateEnabled={isDateEnabled}
            />
            
          
            <SlotsGrid 
              slots={availableSlotsForEndDay} 
              selectedSlots={selectedEndSlots} 
              onToggleSlot={toggleEndSlotSelection} 
            />
          </div>
        )}

        {/* 4. OPTIONAL NOTES FIELD */}
        <NotesArea 
          label={t('adminBlockModal.notes_label')}
          placeholder={t('adminBlockModal.notes_placeholder')}
          value={notes}
          onChange={setNotes}
        />
      </div>

      {/* 5. ACTION CONTROLS & SUB-MODALS */}
      <div className="flex flex-col gap-4 pb-4">
        <ModalButton variant="danger" disabled={isBooking} onClick={handleApplyBlock}>
          {t('adminBlockModal.btn_apply')}
        </ModalButton>

        <ModalButton variant="secondary" disabled={isBooking} onClick={onClose}>
          {t('common.button_close')}
        </ModalButton>

        <IonModal keepContentsMounted={true}>
          <IonDatetime 
            id="admin-start-picker-id" 
            presentation="date" 
            value={startDate}
            onIonChange={e => {
              const val = e.detail.value as string;
              if (val) setStartDate(val.split('T')[0]);
            }} 
          />
        </IonModal>
        
        <IonModal keepContentsMounted={true}>
          <IonDatetime 
            id="admin-end-picker-id" 
            presentation="date" 
            min={startDate}
            value={endDate}
            onIonChange={e => {
              const val = e.detail.value as string;
              if (val) setEndDate(val.split('T')[0]);
            }} 
          />
        </IonModal>

        <IonToast isOpen={!!toastMessage} message={toastMessage} duration={3000} onDidDismiss={() => setToastMessage('')} color={toastColor} />
      </div>
    </BottomModal>
  );
}
