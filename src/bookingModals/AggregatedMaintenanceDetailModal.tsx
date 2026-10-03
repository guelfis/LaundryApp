import { useState, useMemo, useEffect } from 'react';
import { IonToast, IonSpinner } from '@ionic/react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Clock, Trash2 } from 'lucide-react';

import BottomModal from '../baseComponents/BottomModal';
import ModalButton from '../baseComponents/ModalButton';
import StatusDot from '../baseComponents/StatusDot';
import { SlotSpecsCard } from '../components/SlotSpecCard';
import { useBookingActions } from '../hooks/useBookings';
import { NormalizedBooking } from '../utils/normalizeBookings';
import { AggregatedBookings } from '../utils/slotsUtils';
import { formatMaintenanceBlockDisplay } from '../utils/formatMaintenanceBlockDisplay';
import { getDateStringFromDate } from '../utils/datesGetter';

interface AggregatedMaintenanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  block: AggregatedBookings | null;
  bookingsById: Record<string, NormalizedBooking>;
}

export default function AggregatedMaintenanceDetailModal({
  isOpen,
  onClose,
  block,
  bookingsById,
}: AggregatedMaintenanceDetailModalProps) {
  const { t } = useTranslation();
  const { releaseSlot } = useBookingActions();
  const queryClient = useQueryClient();

  const [loadingSlotId, setLoadingSlotId] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'warning' | 'danger'>('success');

  // Resolve bookings belonging to this aggregated block (future slots only by design)
  const slotsInBlock = useMemo(() => {
    if (!block) return [];
    return block.bookings_ids
      .map((id) => bookingsById[id])
      .filter((b): b is NormalizedBooking => !!b)
      .sort((a, b) => {
        if (a.dateStr !== b.dateStr) return a.dateStr.localeCompare(b.dateStr);
        return a.startHour - b.startHour;
      });
  }, [block, bookingsById]);

  // Group slots by calendar date
  const slotsByDate = useMemo(() => {
    const map: Record<string, NormalizedBooking[]> = {};
    for (const slot of slotsInBlock) {
      if (!map[slot.dateStr]) map[slot.dateStr] = [];
      map[slot.dateStr].push(slot);
    }
    return map;
  }, [slotsInBlock]);

  // Auto-close if all slots in the block were deleted
  useEffect(() => {
    if (isOpen && block && slotsInBlock.length === 0) {
      onClose();
    }
  }, [isOpen, block, slotsInBlock.length, onClose]);

  if (!isOpen || !block) return null;

  const { title: blockTitle, subtitle: blockSubtitle } = formatMaintenanceBlockDisplay(
    block.startDate,
    block.startHour,
    block.endDate,
    block.endHour
  );

  const handleDeleteSingle = async (slotId: string) => {
    setLoadingSlotId(slotId);
    try {
      await releaseSlot(slotId);
      await queryClient.invalidateQueries({ queryKey: ['upcoming-admin-bookings'] });
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setToastMessage(t('aggregatedMaintenanceModal.toast_deleted'));
      setToastColor('success');
    } catch (err) {
      setToastMessage((err as Error).message);
      setToastColor('danger');
    } finally {
      setLoadingSlotId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (slotsInBlock.length === 0) return;
    setIsDeletingAll(true);
    try {
      await Promise.all(slotsInBlock.map((slot) => releaseSlot(slot.id)));
      await queryClient.invalidateQueries({ queryKey: ['upcoming-admin-bookings'] });
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setToastMessage(t('aggregatedMaintenanceModal.all_deleted'));
      setToastColor('success');
      onClose();
    } catch (err) {
      setToastMessage((err as Error).message);
      setToastColor('danger');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const isBusy = !!loadingSlotId || isDeletingAll;

  return (
    <BottomModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('aggregatedMaintenanceModal.title')}
    >
      <div className="space-y-6 mt-4 mb-4">
        {/* 1. SLOT SUMMARY BADGE (StatusDot with Scheduled label) */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ion-color-step-400)' }}>
            Slot Summary
          </span>
          <span
            className="flex items-center gap-1.5 font-bold text-xs px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40"
          >
            <StatusDot color="blue" />
            {t('aggregatedMaintenanceModal.scheduled')}
          </span>
        </div>

        {/* 2. SPECIFICATION CARD (Reuses SlotSpecsCard) */}
        <SlotSpecsCard dateString={blockTitle} slotLabel={blockSubtitle} />

        {/* 3. OPTIONAL NOTES */}
        {block.notes && (
          <div className="flex items-center px-1">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ion-color-step-400)' }}>
              {t('slotModal.notes')} :
            </span>
            <p className="text-sm leading-relaxed px-1" style={{ color: 'var(--ion-color-step-700)' }}>
              {block.notes}
            </p>
          </div>
        )}

        {/* 4. INDIVIDUAL SLOTS LIST (Grouped by Date, each slot as a clean card) */}
        <div className="flex flex-col gap-4">
          {Object.entries(slotsByDate).map(([dateStr, dateSlots]) => {
            const dateObj = new Date(`${dateStr}T00:00:00Z`);
            const localizedDateStr = getDateStringFromDate(dateObj);

            return (
              <div key={dateStr} className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 px-1">
                  {localizedDateStr}
                </span>

                <div className="flex flex-col gap-2">
                  {dateSlots.map((slot) => {
                    const isSlotLoading = loadingSlotId === slot.id;

                    return (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xs"
                      >
                        {/* LEFT: TIME & STATUS WITH STATUS DOT */}
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                              {`${String(slot.startHour).padStart(2, '0')}:00 - ${String(slot.endHour).padStart(2, '0')}:00`}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 pl-6">
                            <StatusDot color="blue" />
                            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                              {t('aggregatedMaintenanceModal.scheduled')}
                            </span>
                          </div>
                        </div>

                        {/* RIGHT: DELETE BUTTON */}
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleDeleteSingle(slot.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/30 dark:hover:bg-red-950/50 dark:text-red-400 border border-red-200/60 dark:border-red-900/40 transition-all disabled:opacity-50"
                        >
                          {isSlotLoading ? (
                            <IonSpinner name="crescent" className="w-3.5 h-3.5" />
                          ) : (
                            <>
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{t('aggregatedMaintenanceModal.btn_delete_slot')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* 5. MODAL ACTIONS */}
        <div className="flex flex-col gap-4 pb-4">
          {slotsInBlock.length > 0 && (
            <ModalButton
              variant="danger"
              disabled={isBusy}
              onClick={handleDeleteAll}
            >
              {isDeletingAll ? (
                <div className="flex items-center justify-center gap-2">
                  <IonSpinner name="crescent" className="w-4 h-4" />
                  <span>{t('common.deleting', 'Deleting ...')}</span>
                </div>
              ) : (
                t('aggregatedMaintenanceModal.btn_delete_all')
              )}
            </ModalButton>
          )}

          <ModalButton variant="secondary" disabled={isBusy} onClick={onClose}>
            {t('common.button_close')}
          </ModalButton>
        </div>

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
