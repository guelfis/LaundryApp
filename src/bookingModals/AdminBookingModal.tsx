import { IonToast } from '@ionic/react';
import BottomModal from '../baseComponents/BottomModal';
import ModalButton from '../baseComponents/ModalButton';
import { useBookingActions, useBookingFilters } from '../hooks/useBookings';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo } from 'react';
import SuggestionToggle from '../components/SuggestionToggle';
import SlotsGrid from '../components/SlotsGrid';
import NotesArea from '../components/NotesArea';
import { DatePicker } from '../baseComponents/DatePicker';
import { HouseholdSlot } from '../lib/databaseTypes';
import {
  calculateMaxEndDate,
  calculatePayloadsForBooking,
  getAvailableSlotsForDate,
  getFirstAvailableStartDate,
  getPastSlotsForDate,
  getSlotsInPeriodForDate,
  processAdminBlocks,
} from '../utils/adminModalUtils';
import { NormalizedBooking } from '../utils/normalizeBookings';

interface AdminBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: NormalizedBooking[]; // Pass the list of all admin bookings from the parent component
  apartmentId: string; // Optional, in case you want to filter bookings by apartment
}

export default function AdminBlockModal({ isOpen, onClose, bookings, apartmentId }: AdminBlockModalProps) {
  const { t } = useTranslation();
  const { slotsPolicy } = useBookingFilters();
  const { bookSlot, isBooking } = useBookingActions();

  // Generate the dictionary of admin blocks for quick lookup and validation
  const adminBlocksMap = useMemo(() => {
    return processAdminBlocks(bookings, slotsPolicy.slots);
  }, [bookings, slotsPolicy]);

  // Unified visual interaction states matching your grid template
  const [isMultiDay, setIsMultiDay] = useState(false);
  
  const absoluteMinStartDate = useMemo(() => {
    return getFirstAvailableStartDate(adminBlocksMap);
  }, [adminBlocksMap]);

  // Format as strings instead of split arrays to ensure clean IonDatetime string tracking
  const [startDate, setStartDate] = useState<string>(() => absoluteMinStartDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(() => absoluteMinStartDate || new Date().toISOString().split('T')[0]);

  // Start slot and final/end slot for the maintenance period
  const [startSlot, setStartSlot] = useState<HouseholdSlot | null>(null);
  const [endSlot, setEndSlot] = useState<HouseholdSlot | null>(null);
  const [notes, setNotes] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastColor, setToastColor] = useState<'success' | 'warning' | 'danger'>('success');

  const maxEndDate = useMemo(() => {
    return calculateMaxEndDate(startDate, adminBlocksMap);
  }, [startDate, adminBlocksMap]);

  // Ionic calendar validation filter: Disable a day ONLY if it is completely full
  const isDateEnabled = (dateString: string) => {
    const pureDateIso = dateString.split('T')[0];
    return !adminBlocksMap[pureDateIso]?.isFullyBooked;
  };

  const availableSlotsForStartDay = useMemo(() => {
    return getAvailableSlotsForDate(startDate, adminBlocksMap, slotsPolicy.slots);
  }, [startDate, adminBlocksMap, slotsPolicy.slots]);

  const availableSlotsForEndDay = useMemo(() => {
    return getAvailableSlotsForDate(endDate, adminBlocksMap, slotsPolicy.slots);
  }, [endDate, adminBlocksMap, slotsPolicy.slots]);

  const pastSlotsForStartDay = useMemo(() => {
    return getPastSlotsForDate(startDate, slotsPolicy.slots);
  }, [startDate, slotsPolicy.slots]);

  const pastSlotsForEndDay = useMemo(() => {
    return getPastSlotsForDate(endDate, slotsPolicy.slots, startDate, startSlot);
  }, [endDate, slotsPolicy.slots, startDate, startSlot]);

  // Compute constituent slots in the requested period for start day
  const startDaySlotsInPeriod = useMemo(() => {
    if (!startSlot) return [];
    if (!isMultiDay) {
      return getSlotsInPeriodForDate(startDate, startDate, startDate, startSlot, endSlot || startSlot, slotsPolicy.slots);
    }
    if (startDate === endDate && endSlot) {
      return getSlotsInPeriodForDate(startDate, startDate, endDate, startSlot, endSlot, slotsPolicy.slots);
    }
    return slotsPolicy.slots.filter(s => s.start >= startSlot.start);
  }, [startSlot, endSlot, isMultiDay, startDate, endDate, slotsPolicy.slots]);

  // Compute constituent slots in the requested period for end day
  const endDaySlotsInPeriod = useMemo(() => {
    if (!endSlot) return [];
    if (startDate === endDate && startSlot) {
      return getSlotsInPeriodForDate(endDate, startDate, endDate, startSlot, endSlot, slotsPolicy.slots);
    }
    return slotsPolicy.slots.filter(s => s.end <= endSlot.end);
  }, [startSlot, endSlot, startDate, endDate, slotsPolicy.slots]);

  useEffect(() => {
    if (isOpen) {
      setIsMultiDay(false);
      setStartSlot(null);
      setEndSlot(null);
      setNotes('');
      if (absoluteMinStartDate) {
        setStartDate(absoluteMinStartDate);
        setEndDate(absoluteMinStartDate);
      }
    }
  }, [isOpen, absoluteMinStartDate]);

  useEffect(() => {
    setStartSlot(null);
    if (!isMultiDay) {
      setEndSlot(null);
    }
  }, [startDate]);

  useEffect(() => {
    if (isMultiDay) {
      setEndSlot(null);
    }
  }, [endDate]);

  useEffect(() => {
    if (isMultiDay && endDate < startDate) {
      setEndDate(startDate);
    }
  }, [startDate, isMultiDay, endDate]);

  const handleToggleMultiDay = (checked: boolean) => {
    setIsMultiDay(checked);
    if (checked) {
      if (endDate < startDate) {
        setEndDate(startDate);
      }
      if (!endSlot && startSlot) {
        setEndSlot(startSlot);
      }
    } else {
      setEndDate(startDate);
      if (startSlot && !endSlot) {
        setEndSlot(startSlot);
      }
    }
  };

  // Single-day period selection: Click 1 slot sets single slot; Click 2nd slot sets [min, max] range
  const handleToggleSingleDaySlot = (slot: HouseholdSlot) => {
    if (!startSlot) {
      setStartSlot(slot);
      setEndSlot(slot);
    } else if (startSlot.start === endSlot?.start && startSlot.end === endSlot?.end) {
      if (slot.start === startSlot.start && slot.end === startSlot.end) {
        setStartSlot(null);
        setEndSlot(null);
      } else {
        const first = slot.start < startSlot.start ? slot : startSlot;
        const second = slot.start < startSlot.start ? startSlot : slot;
        setStartSlot(first);
        setEndSlot(second);
      }
    } else {
      // Reset to clicked slot
      setStartSlot(slot);
      setEndSlot(slot);
    }
  };

  // Multi-day start slot selection (from this slot to end of start day)
  const handleToggleStartSlot = (slot: HouseholdSlot) => {
    if (startSlot && startSlot.start === slot.start && startSlot.end === slot.end) {
      setStartSlot(null);
    } else {
      setStartSlot(slot);
    }
  };

  // Multi-day final slot selection (from start of end day up to this slot)
  const handleToggleEndSlot = (slot: HouseholdSlot) => {
    if (endSlot && endSlot.start === slot.start && endSlot.end === slot.end) {
      setEndSlot(null);
    } else {
      setEndSlot(slot);
    }
  };

  const isDateSelected = () => {
    if (!startSlot) return false;
    if (isMultiDay && !endSlot) return false;
    return true;
  };

  if (!isOpen) return null;

  const handleApplyBlock = async () => {
    if (!apartmentId) {
      setToastMessage(t('adminBlockModal.error_admin_missing'));
      setToastColor('danger');
      return;
    }

    if (!isDateSelected()) {
      setToastMessage(t('adminBlockModal.error_incomplete'));
      setToastColor('warning');
      return;
    }

    try {
      const bookingPayloads = calculatePayloadsForBooking({
        apartmentId,
        isMultiDay,
        startDate,
        endDate,
        startSlot,
        endSlot: isMultiDay ? endSlot : (endSlot || startSlot),
        allSlotsConfig: slotsPolicy.slots,
        adminBlocksMap,
      });

      if (bookingPayloads.length === 0) {
        setToastMessage(t('adminBlockModal.error_already_blocked'));
        setToastColor('warning');
        return;
      }

      // Map payload items sequentially into atomic database updates
      for (const payload of bookingPayloads) {
        await bookSlot(payload);
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

          <p className="text-xs font-semibold text-gray-500 pl-1 mt-1">
            {isMultiDay
              ? t('adminBlockModal.start_slot_label', 'Start time (from this slot onwards):')
              : t('adminBlockModal.single_day_slot_label', 'Select time period for this day:')}
          </p>
          
          <SlotsGrid 
            slots={slotsPolicy.slots}
            availableSlots={availableSlotsForStartDay}
            disabledSlots={pastSlotsForStartDay}
            selectedSlots={startDaySlotsInPeriod} 
            onToggleSlot={isMultiDay ? handleToggleStartSlot : handleToggleSingleDaySlot}
            startSlot={startSlot}
            endSlot={isMultiDay ? null : endSlot}
          />
        </div>

        {/* 2. MULTI-DAY ACCORDION TOGGLE CHECKBOX */}
        <SuggestionToggle
          checked={isMultiDay}
          onToggle={handleToggleMultiDay}
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

            <p className="text-xs font-semibold text-gray-500 pl-1 mt-1">
              {t('adminBlockModal.end_slot_label', 'End time (up to this slot):')}
            </p>
            
            <SlotsGrid 
              slots={slotsPolicy.slots}
              availableSlots={availableSlotsForEndDay}
              disabledSlots={pastSlotsForEndDay}
              selectedSlots={endDaySlotsInPeriod} 
              onToggleSlot={handleToggleEndSlot}
              startSlot={null}
              endSlot={endSlot}
            />
          </div>
        )}

        {/* 4. DYNAMIC PERIOD SUMMARY BANNER */}
        {isDateSelected() && (
          <div className="p-3.5 rounded-xl border bg-gray-50/50 dark:bg-zinc-800/50 space-y-1 text-xs">
            <div className="font-semibold text-gray-700 dark:text-gray-200 flex items-center justify-between">
              <span>{t('adminBlockModal.period_summary')}</span>
              <span className="text-pink-600 dark:text-pink-400 font-bold">
                {!isMultiDay
                  ? `${startDate}: ${startSlot?.start}:00 – ${(endSlot || startSlot)?.end}:00`
                  : `${startDate} (${startSlot?.start}:00) – ${endDate} (${endSlot?.end}:00)`}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {t('adminBlockModal.already_blocked_note')}
            </p>
          </div>
        )}

        {/* 5. OPTIONAL NOTES FIELD */}
        <NotesArea 
          label={t('adminBlockModal.notes_label')}
          placeholder={t('adminBlockModal.notes_placeholder')}
          value={notes}
          onChange={setNotes}
        />
      </div>

      {/* 6. ACTION CONTROLS */}
      <div className="flex flex-col gap-4 pb-4">
        <ModalButton variant="danger" disabled={isBooking || !isDateSelected()} onClick={handleApplyBlock}>
          {t('adminBlockModal.btn_apply')}
        </ModalButton>

        <ModalButton variant="secondary" disabled={isBooking} onClick={onClose}>
          {t('common.button_close')}
        </ModalButton>

        <IonToast isOpen={!!toastMessage} message={toastMessage} duration={3000} onDidDismiss={() => setToastMessage('')} color={toastColor} />
      </div>
    </BottomModal>
  );
}
