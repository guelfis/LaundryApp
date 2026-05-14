import BottomModal from '../components/BottomModal';
import { Send, Clock, Home } from 'lucide-react';
import { useState } from 'react';
import ModalButton from '../components/ModalButton';
import { useRequestToJoin } from '../useApartments';

interface JoinRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartmentName: string | null;
  apartmentId: string | null;
}

export default function JoinRequestModal({ isOpen, onClose, apartmentName, apartmentId }: JoinRequestModalProps) {
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Call the custom React Query mutation hook
  const requestToJoinMutation = useRequestToJoin();

  const handleSendRequest = async () => {
    if (!apartmentId) return;
    setErrorMessage(null);

    try {
      // Triggers the 'create_join_request' RPC function in Supabase
      await requestToJoinMutation.mutateAsync(apartmentId);
      setIsSent(true);
    } catch (err) {
      const errorInstance = err as Error;
      console.error('Database insertion error:', errorInstance);
      setErrorMessage(errorInstance.message || 'Failed to submit request. Please try again.');
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
      title={isSent ? "Request Sent!" : "Request Access"}
    >
      <div className="space-y-6">
        {!isSent ? (
          <>
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm">
                <Home size={24} className="text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">You are requesting to join:</p>
                <p className="font-bold text-gray-900 text-lg">{apartmentName}</p>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              Once you send the request, an admin of this apartment will need to approve your access. You'll be notified once they accept.
            </p>

            {/* Error Message banner wrapper */}
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
                {requestToJoinMutation.isPending ? 'Sending...' : (
                  <>
                    <Send size={18} />
                    Send Request
                  </>
                )}
              </ModalButton>
              
              <ModalButton 
                variant="secondary"
                onClick={handleClose}
                disabled={requestToJoinMutation.isPending}
              >
                Cancel
              </ModalButton>
            </div>
          </>
        ) : (
          <div className="text-center py-4 space-y-6">
            <div className="w-20 h-20 bg-green-50 dark:bg-green-950/30 text-green-500 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={40} />
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Great! Your request to join <span className="font-bold text-gray-900 dark:text-white">{apartmentName}</span> is now pending. 
            </p>
            <button 
              onClick={handleClose}
              className="w-full py-4 bg-gray-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-2xl active:scale-[0.98] transition-all"
            >
              Got it, thanks!
            </button>
          </div>
        )}
      </div>
    </BottomModal>
  );
}
