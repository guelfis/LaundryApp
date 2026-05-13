import { LoadingSpinner } from "../components/LoadingSpinner";
import { Apartment } from "../lib/databaseTypes";
import { Lock } from 'lucide-react';

const ApartmentsList = ({isLoading, apartments, onSelect, lock}: {isLoading: boolean, apartments: Apartment[], onSelect: (apt: Apartment) => void, lock: boolean}) => {
    return (
        <div className="flex-grow border-gray-200 rounded-xl p-4 overflow-y-auto">
                {isLoading ? (
                  <LoadingSpinner />
                ) : (
                  <div className="space-y-3">
                    {apartments?.map((apt) => (
                      <button
                        key={apt.id}
                        onClick={() => {
                          onSelect(apt);
                        }}
                        className="w-full flex items-center gap-3 text-left p-4 bg-white border border-gray-200 rounded-lg shadow-sm active:scale-95 transition-transform"                      > 
                      {/* Lock icon if lock is true */}
                        {lock && (
                            <Lock size={18} className="text-gray-400" />
                        )}
                        <span className="font-semibold text-lg text-gray-700">{apt.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
    );
}

export default ApartmentsList;