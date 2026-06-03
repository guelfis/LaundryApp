import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Search } from 'lucide-react';
import tzlookup from 'tz-lookup';

export interface LocationResolution {
  formattedAddress: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

interface AddressSearchProps {
  onLocationResolved: (location: LocationResolution) => void;
  isPending?: boolean;
}

interface PhotonGeometry {
  type: "Point";
  coordinates: [number, number];
}

interface PhotonProperties {
  name?: string;
  street?: string;
  housenumber?: string;
  postcode?: string;
  city?: string;
  town?: string;
  state?: string;
  country?: string;
}

interface PhotonFeature {
  type: "Feature";
  geometry: PhotonGeometry;
  properties: PhotonProperties;
}

export default function AddressSearch({ onLocationResolved, isPending = false }: AddressSearchProps) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<PhotonFeature[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim().length > 3) {
      try {
        const currentLang = i18n.language || 'en';
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(value.trim())}&limit=5&lang=${currentLang}`
        );
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json() as { features: PhotonFeature[] };
        setPredictions(data.features || []);
        setIsDropdownOpen(true);
      } catch (error) {
        console.error("Photon OSM Autocomplete communication flight failed:", error);
      }
    } else {
      setPredictions([]);
      setIsDropdownOpen(false);
    }
  };

  const handleSelectAddress = (feature: PhotonFeature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const props = feature.properties;
    
    const street = props.street ? `${props.street} ${props.housenumber || ''}`.trim() : props.name || '';
    const city = props.city || props.town || props.state || '';
    const postcode = props.postcode || '';
    const country = props.country || '';
    
    const fullAddress = [street, `${postcode} ${city}`.trim(), country]
      .filter(Boolean)
      .join(', ');

    const resolvedTimezone = tzlookup(lat, lng);

    onLocationResolved({
      formattedAddress: fullAddress,
      latitude: lat,
      longitude: lng,
      timezone: resolvedTimezone
    });

    setQuery(fullAddress);
    setPredictions([]);
    setIsDropdownOpen(false);
  };

  return (
    // FIX: Removed horizontal padding classes from the outer container reference to keep absolute width 100% matched
    <div ref={containerRef} className="w-full relative">
      
      <div className="relative w-full">
        <input
          type="text"
          value={query}
          disabled={isPending}
          onChange={handleInputChange}
          placeholder={t("householdSetup.placeholder_address", "Search for an address...")}
          className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-white transition-all shadow-sm disabled:opacity-50"
        />
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
      </div>

      {/* FIXED POSITIONING: Dropdown alignment exactly covers the layout boundaries */}
      {isDropdownOpen && predictions.length > 0 && (
        <div className="absolute top-[105%] left-0 w-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-lg z-50 divide-y divide-gray-100 dark:divide-slate-700/50 max-h-60 overflow-y-auto">
          {predictions.map((item, idx) => {
            const p = item.properties;
            const displayStreet = p.street ? `${p.street} ${p.housenumber || ''}`.trim() : p.name || '';
            const displayCity = p.city || p.town || p.state || '';
            const itemLabel = [displayStreet, displayCity, p.country].filter(Boolean).join(', ');

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectAddress(item)}
                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-slate-700/60 text-gray-700 dark:text-gray-200 transition-colors flex items-start gap-2.5 outline-none"
              >
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <span className="truncate block flex-1 font-medium">{itemLabel}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
