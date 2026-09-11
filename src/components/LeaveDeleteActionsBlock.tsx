import React, { useState } from 'react';
import { IonButton, IonIcon, IonAlert } from '@ionic/react';
import { logOutOutline, trashOutline, informationCircleOutline } from 'ionicons/icons';
import ActionButton from '../baseComponents/ActionButton';
import SectionText from '../baseComponents/SectionText';
import { useTranslation } from 'react-i18next';

interface LeaveDeleteActionsBlockProps {
  // Action triggers
  onLeave: () => void;
  onDelete: () => void;
  
  // State flags from your hooks
  canLeave: boolean;
  canDelete: boolean;
  isLeaving: boolean;
  isDeleting: boolean;

  // Localization translation keys
  leaveLabelKey: string;     // e.g., 'buildingTab.leave' or 'myApartmentTab.leave'
  deleteLabelKey: string;    // e.g., 'buildingTab.delete' or 'myApartmentTab.delete'
  infoTitleKey: string;      // e.g., 'buildingTab.info_title'
  infoMessageKey: string;    // e.g., 'buildingTab.info_message'
}

const LeaveDeleteActionsBlock: React.FC<LeaveDeleteActionsBlockProps> = ({
  onLeave,
  onDelete,
  canLeave,
  canDelete,
  isLeaving,
  isDeleting,
  leaveLabelKey,
  deleteLabelKey,
  infoTitleKey,
  infoMessageKey
}) => {
  const { t } = useTranslation();
  const [isInfoAlertOpen, setIsInfoAlertOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px', marginBottom: '32px' }}>
      <SectionText title={t('common.more_actions')} />
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px', width: '100%', paddingBottom: '40px' }}>
        
        {/* LEAVE ROW */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px', width: '100%' }}>
          <ActionButton
            label={leaveLabelKey}
            loadingLabel={t('common.leaving')}
            icon={logOutOutline}
            onClick={onLeave}
            disabled={!canLeave}
            isLoading={isLeaving}
            color="danger"
          />
          {!canLeave && (
            <IonButton 
              fill="clear" 
              color="medium"
              onClick={() => setIsInfoAlertOpen(true)}
              style={{ '--padding-start': '4px', '--padding-end': '4px', margin: 0 }}
            >
              <IonIcon slot="icon-only" icon={informationCircleOutline} style={{ fontSize: '18px' }} />
            </IonButton>
          )}
        </div>

        {/* DELETE ROW */}
        {canDelete && (
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px', width: '100%' }}>
            <ActionButton
              label={deleteLabelKey}
              loadingLabel={t('common.deleting')}
              icon={trashOutline}
              onClick={onDelete}
              isLoading={isDeleting}
              color="danger"
            />
          </div>
        )}
      </div>

      <IonAlert
        isOpen={isInfoAlertOpen}
        onDidDismiss={() => setIsInfoAlertOpen(false)}
        header={infoTitleKey}
        message={infoMessageKey}
        buttons={[
          {
            text: t('common.btn_ok'),
            role: 'cancel',
            handler: () => setIsInfoAlertOpen(false)
          }
        ]}
      />
    </div>
  );
};

export default LeaveDeleteActionsBlock;
