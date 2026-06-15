import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IonSearchbar, IonList, IonItem, IonIcon, IonLabel, IonSpinner } from '@ionic/react';
import { pinOutline } from 'ionicons/icons';
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
  const [loading, setLoading] = useState(false);

  const handleInputChange = async (value: string) => {
    setQuery(value);

    if (value.trim().length > 3) {
      setLoading(true);
      try {
        const currentLang = i18n.language || 'en';
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(value.trim())}&limit=5&lang=${currentLang}`
        );
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json() as { features: PhotonFeature[] };
        setPredictions(data.features || []);
      } catch (error) {
        console.error("Photon OSM Autocomplete communication flight failed:", error);
      } finally {
        setLoading(false);
      }
    } else {
      setPredictions([]);
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
  };

  return (
    <div>
      <div >
        <IonSearchbar
          value={query}
          disabled={isPending}
          onIonInput={(e) => handleInputChange(e.detail.value!)}
          // Clear predictions when the single native Ionic 'X' button clears out the text
          onIonClear={() => setPredictions([])}
          placeholder={t("householdSetup.placeholder_address", "Search for an address...")}
          animated={true}
          debounce={300}
          showCancelButton="never" 
          style={{
            '--color': 'var(--ion-text-color)',
            '--icon-color': 'var(--ion-color-step-500)',
            '--placeholder-color': 'var(--ion-color-step-500)',
          }}
        />
        {loading && (
          <div>
            <IonSpinner name="crescent" />
          </div>
        )}
      </div>

      {predictions.length > 0 && (
        <IonList>
          {predictions.map((item, idx) => {
            const p = item.properties;
            const displayStreet = p.street ? `${p.street} ${p.housenumber || ''}`.trim() : p.name || '';
            const displayCity = p.city || p.town || p.state || '';
            const subTitle = [displayCity, p.country].filter(Boolean).join(', ');

            return (
              <IonItem
                key={idx}
                button={true}
                detail={false}
                onClick={() => handleSelectAddress(item)}
              >
                <IonIcon slot="start" icon={pinOutline} />
                <IonLabel>
                  <h3>{displayStreet}</h3>
                  <p>{subTitle}</p>
                </IonLabel>
              </IonItem>
            );
          })}
        </IonList>
      )}
    </div>
  );
}
