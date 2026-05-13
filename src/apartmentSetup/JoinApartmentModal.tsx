import BottomModal from '../components/BottomModal';
import { Send, Clock } from 'lucide-react';
import { useState } from 'react';

interface JoinRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartmentName: string | null;
  apartmentId: string | null;
}

export default function JoinApartmentModal({ isOpen, onClose, apartmentName, apartmentId }: JoinRequestModalProps) {
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSendRequest = async () => {
    setIsSending(true);
    // TODO: In the future, insert a row into a 'join_requests' table in Supabase
    console.log(`Request sent for apartment ID: ${apartmentId}`);
    
    // Simulate a delay
    setTimeout(() => {
      setIsSending(false);
      setIsSent(true);
    }, 1000);
  };

  return (
    <BottomModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isSent ? "Request Sent!" : "Request Access"}
    >
      <div className="space-y-6">
        {!isSent ? (
          <>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="bg-white p-3 rounded-xl shadow-sm">
                <span className="text-2xl">🏠</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">You are requesting to join:</p>
                <p className="font-bold text-gray-900 text-lg">{apartmentName}</p>
              </div>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed">
              Once you send the request, an admin of this apartment will need to approve your access. You'll be notified once they accept.
            </p>

            <div className="flex flex-col gap-3 pt-2">
              <button 
                onClick={handleSendRequest}
                disabled={isSending}
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isSending ? 'Sending...' : (
                  <>
                    <Send size={18} />
                    Send Request
                  </>
                )}
              </button>
              
              <button 
                onClick={onClose}
                disabled={isSending}
                className="w-full py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-4 space-y-6">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={40} />
            </div>
            <p className="text-gray-600">
              Great! Your request to join <span className="font-bold">{apartmentName}</span> is now pending. 
            </p>
            <button 
              onClick={onClose}
              className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl"
            >
              Got it, thanks!
            </button>
          </div>
        )}
      </div>
    </BottomModal>
  );
}
