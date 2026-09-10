import { IonIcon } from "@ionic/react";
import { LoadingSpinner } from "../components/LoadingSpinner";
import SlotCard from "../components/SlotCard";
import { Apartment } from "../lib/databaseTypes";
import { lockClosedOutline } from 'ionicons/icons';

interface ApartmentsListProps {
  isLoading?: boolean; 
  apartments: Apartment[];
  onSelect: (apt: Apartment) => void;
  lock?: boolean; 
}

const ApartmentsList = ({ 
  isLoading = false, 
  apartments = [], 
  onSelect, 
  lock = false 
}: ApartmentsListProps) => {

  if (!apartments || apartments.length === 0) {
    return null;
  }

  return (
    <div style={styles.listContainer}>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div style={styles.gridGap}>
          {apartments.map((apt) => {
            if (!apt || !apt.id) return null;

            return (
              <SlotCard 
                key={apt.id}
                onClick={() => {
                  onSelect(apt);
                }}
                title={apt.display_name}
                icon={lock ? <IonIcon icon={lockClosedOutline} style={styles.lockIcon} /> : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  listContainer: {
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box' as const,
    padding: '0px'
  },
  gridGap: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    width: '100%',
    maxWidth: '100%'
  },
  lockIcon: {
    color: 'var(--ion-color-step-400, #808080)',
    fontSize: '18px'
  }
};

export default ApartmentsList;
