import BottomModal from '../baseComponents/BottomModal';
import { Send, Clock, Home } from 'lucide-react';
import { useState } from 'react';
import ModalButton from '../baseComponents/ModalButton';
import { useRequestToJoin } from '../hooks/useApartments';
import { useTranslation } from 'react-i18next';

interface JoinRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartmentName: string | null;
  apartmentId: string | null;
}

export default function JoinRequestModal({ isOpen, onClose, apartmentName, apartmentId }: JoinRequestModalProps) {
  const { t } = useTranslation();
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const requestToJoinMutation = useRequestToJoin();

  const handleSendRequest = async () => {
    if (!apartmentId) return;
    setErrorMessage(null);

    try {
      await requestToJoinMutation.mutateAsync(apartmentId);
      setIsSent(true);
    } catch (err) {
      const errorInstance = err as Error;
      console.error('Database insertion error:', errorInstance);
      // Fallback to standard global translation string if message is empty
      setErrorMessage(errorInstance.message || t('common.error'));
    }
  };

  const handleClose = () => {
    setIsSent(false);
    setErrorMessage(null);
    onClose();
  };

  return (
    <BottomModal 
      isOpen={isOpen} 
      onClose={handleClose} 
      /* Title swaps dynamically based on translation state */
      title={isSent ? t('joinRequest.title_sent', 'Request Sent!') : t('joinRequest.title_request', 'Request Access')}
    >
      <div className="space-y-6">
        {!isSent ? (
          <>
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm">
                <Home size={24} className="text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('joinRequest.requesting_to_join', 'You are requesting to join:')}</p>
                <p className="font-bold text-gray-900 text-lg">{apartmentName}</p>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              {t('joinRequest.description', "Once you send the request, an admin of this apartment will need to approve your access. You'll be notified once they accept.")}
            </p>

            {errorMessage && (
              <p className="text-sm text-red-500 font-semibold bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-100 dark:border-red-900/50">
                {errorMessage}
              </p>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <ModalButton 
                variant="primary"
                onClick={handleSendRequest}
                disabled={requestToJoinMutation.isPending}
              >
                {requestToJoinMutation.isPending ? t('joinRequest.status_sending', 'Sending...') : (
                  <>
                    <Send size={18} />
                    {t('joinRequest.btn_send', 'Send Request')}
                  </>
                )}
              </ModalButton>
              
              {/* Using generic action path for Cancel button */}
              <ModalButton 
                variant="secondary"
                onClick={handleClose}
                disabled={requestToJoinMutation.isPending}
              >
                {t('common.cancel', 'Cancel')}
              </ModalButton>
            </div>
          </>
        ) : (
          <div className="text-center py-4 space-y-6">
            <div className="w-20 h-20 bg-green-50 dark:bg-green-950/30 text-green-500 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={40} />
            </div>
            {/* Interpolating dynamic context safely with secondary options parameters */}
            <p className="text-gray-600 dark:text-gray-300">
              {t('joinRequest.success_msg', 'Great! Your request to join {{name}} is now pending.', { name: apartmentName })}
            </p>
            <button 
              onClick={handleClose}
              className="w-full py-4 bg-gray-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-2xl active:scale-[0.98] transition-all"
            >
              {t('joinRequest.btn_success_close', 'Got it, thanks!')}
            </button>
          </div>
        )}
      </div>
    </BottomModal>
  );
}
