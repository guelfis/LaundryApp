import { useState } from 'react';
import { usePendingRequests, useResolveJoinRequest } from '../useApartments';
import { Check, X, User } from 'lucide-react';
import SectionText from '../components/SectionText';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface PendingRequestsSectionProps {
  apartmentId: string;
}

export default function PendingRequestsSection({ apartmentId }: PendingRequestsSectionProps) {
  // 1. Fetch pending requests for this apartment
  const { data: requests = [], isLoading } = usePendingRequests(apartmentId);
  
  // 2. Setup the mutation to handle approval/rejection
  const resolveRequestMutation = useResolveJoinRequest(apartmentId);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (requestId: string, action: 'approved' | 'rejected') => {
    setProcessingId(requestId);
    try {
      await resolveRequestMutation.mutateAsync({ requestId, action });
    } catch (err) {
      const errorInstance = err as Error;
      console.error(`Failed to ${action} request:`, errorInstance);
      alert(`Error updating request: ${errorInstance.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="py-4 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // If there are no pending requests, don't render the section at all to save space
  if (requests.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-3 mt-4">
      <SectionText title={`Join Requests (${requests.length})`} />
      
      <div className="space-y-2">
        {requests.map((req) => {
          const isCurrentProcessing = processingId === req.id;
          // Extract full_name from the profile join mapping
          const applicantName = req.profiles?.full_name || 'Unknown User';

          return (
            <div 
              key={req.id} 
              className="w-full p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-center justify-between shadow-sm transition-all"
            >
              {/* Left Side: User Info */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-amber-600 dark:text-amber-400">
                  <User size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {applicantName}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-slate-400">
                    wants to join your apartment
                  </span>
                </div>
              </div>

              {/* Right Side: Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAction(req.id, 'rejected')}
                  disabled={isCurrentProcessing}
                  className="p-2.5 bg-white dark:bg-slate-800 text-gray-500 hover:text-red-500 border border-gray-200 dark:border-slate-700 rounded-xl active:scale-95 transition-all disabled:opacity-40"
                  aria-label="Reject user"
                >
                  <X size={18} />
                </button>
                
                <button
                  onClick={() => handleAction(req.id, 'approved')}
                  disabled={isCurrentProcessing}
                  className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-100 dark:shadow-none active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center"
                  aria-label="Approve user"
                >
                  {isCurrentProcessing ? (
                    <div className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check size={18} />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
