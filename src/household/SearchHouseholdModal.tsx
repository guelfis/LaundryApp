import { useTranslation } from "react-i18next";
import BottomModal from "../components/BottomModal";
import AddressSearch, { LocationResolution } from "./AddressSearch";
import { LoadingSpinner } from "../components/LoadingSpinner";
import SlotCard from "../components/SlotCard";
import { useState, useEffect } from "react";
import { useSearchHousehold } from "../hooks/useHousehold";

interface SearchHouseholdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchHouseholdModal({ isOpen, onClose }: SearchHouseholdModalProps) {
  const { t } = useTranslation();
  const [selectedLocation, setSelectedLocation] = useState<LocationResolution | null>(null);

  const { 
    data: resolvedHousehold = null,
    isLoading: isLoadingSearch,
    error: searchError
  } = useSearchHousehold(
    selectedLocation?.latitude ?? 0, 
    selectedLocation?.longitude ?? 0, 
    { enabled: !!selectedLocation }
  );

  //  Reset state whenever modal closing transitions complete
  useEffect(() => {
    if (!isOpen) {
      setSelectedLocation(null);
    }
  }, [isOpen]);

  if (searchError) {
    console.error("Supabase RPC Query Execution Failure:", searchError);
  }

  const handleLocationResolved = (location: LocationResolution) => {        
    setSelectedLocation(location); 
  };

  return (
    <BottomModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t('searchHousehold.title', 'Search Household')}
    >
      {/* added pb-32 to give padding at bottom so absolute dropdown can flow freely without getting cut off */}
      <div className="flex flex-col gap-4 mt-4 mb-4 pb-32">
        <span className="text-sm text-gray-500">
          {t('searchHousehold.instruction', 'Enter your household address to find your building and manage laundry reservations.')}
        </span>
        
        <AddressSearch onLocationResolved={handleLocationResolved} />
        
        {isLoadingSearch && <LoadingSpinner />}

        {!isLoadingSearch && resolvedHousehold && (
          <div className="mt-4 animate-fadeIn">
            <SlotCard
              title={resolvedHousehold.address}
              subtitle={resolvedHousehold.name}
              onClick={() => {
                onClose(); // Cleanly close modal before navigating away
                // navigate to the page to scan QR or insert the code
              }}
            />
          </div>
        )}
      </div>
    </BottomModal>
  );
}
