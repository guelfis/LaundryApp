import React, { useRef } from 'react';
import { IonModal, IonContent } from '@ionic/react';

interface BottomModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export default function BottomModal({ isOpen, onClose, children, title }: BottomModalProps) {
  const modalRef = useRef<HTMLIonModalElement>(null);

  return (
    <IonModal
      ref={modalRef}
      isOpen={isOpen}
      onDidDismiss={onClose}
      // 1. SHEET MODAL PROPERTIES: This turns the modal into a native bottom sheet
      initialBreakpoint={0.75} // Opens up covering 75% of the screen height
      breakpoints={[0, 0.5, 0.75, 0.95]} // Snapping steps (0 handles drag-to-dismiss)
      handle={true} // Automatically generates the centered drag handle pill bar at the top!
      style={{
        '--background': 'var(--ion-background-color, #ffffff)', // Theme-aware variables
        '--color': 'var(--ion-text-color, #000000)',
        '--border-radius': '2.5rem 2.5rem 0 0', 
        '--max-width': '448px', 
      }}
    >
      {/* 
        2. IONCONTENT SCROLL BUFFER: Ensures if content overflowing height limits,
        touchscreen momentum gestures handle scrolling gracefully inside the pill sheet.
      */}
      <IonContent 
        style={{
          '--background': 'var(--ion-background-color)',
          '--color': 'var(--ion-text-color)'
        }}
      >
        <div style={{ padding: '32px', paddingTop: '32px', paddingBottom: '16px' }}>
          
          {/* Title Element with integrated system text dark/light color shifts */}
          {title && (
            <h2 
              style={{ 
                fontSize: '1.25rem', 
                fontWeight: 'bold', 
                marginBottom: '24px',
                marginTop: '0px',
                color: 'var(--ion-text-color)' 
              }}
            >
              {title}
            </h2>
          )}
          
          {/* Consumer Children Render Target Injection */}
          {children}
          
        </div>
      </IonContent>
    </IonModal>
  );
}