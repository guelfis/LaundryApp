import React, { useRef } from 'react';
import { IonModal, IonContent, IonHeader, IonToolbar, IonTitle } from '@ionic/react';

interface BottomModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  initialBreakpoint?: number;
  breakpoints?: number[];
}

export default function BottomModal({
  isOpen,
  onClose,
  children,
  title,
  initialBreakpoint = 0.75,
  breakpoints = [0, 0.5, 0.75, 0.95],
}: BottomModalProps) {
  const modalRef = useRef<HTMLIonModalElement>(null);

  return (
    <IonModal
      ref={modalRef}
      isOpen={isOpen}
      onDidDismiss={onClose}
      // 1. SHEET MODAL PROPERTIES: This turns the modal into a native bottom sheet
      initialBreakpoint={initialBreakpoint}
      breakpoints={breakpoints}
      backdropBreakpoint={0.5} // Dims the background page as soon as the sheet opens!
      handle={true} // Automatically generates the centered drag handle pill bar at the top!
      style={{
        '--background': 'var(--ion-background-color, #ffffff)', // Theme-aware variables
        '--color': 'var(--ion-text-color, #000000)',
        '--border-radius': '2.5rem 2.5rem 0 0', 
        '--max-width': '448px', 

        // 1. Dim the page underneath so the sheet pops out visually
        '--backdrop-opacity': '0.4',

        // 2. Strong upward elevation shadow
        '--box-shadow': '0 -12px 40px -4px rgba(0, 0, 0, 0.22), 0 -2px 10px rgba(0, 0, 0, 0.08)',

        // 3. Crisp top & side border to separate from the page
        '--border-width': '1.5px 1.5px 0 1.5px',
        '--border-style': 'solid',
        '--border-color': 'var(--ion-color-step-150, #cbd5e1)',

        // 4. Prominent drag handle
        '--handle-background': 'var(--ion-color-step-400, #94a3b8)',
      }}
    >
      {title && (
        <IonHeader className="ion-no-border" style={{ backgroundColor: 'var(--ion-background-color, #ffffff)', borderRadius: '2.5rem 2.5rem 0 0' }}>
          <IonToolbar style={{ '--background': 'var(--ion-background-color, #ffffff)', '--border-width': '0px', paddingTop: '20px', paddingBottom: '4px' }}>
            <IonTitle style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--ion-text-color)', paddingInlineStart: '24px' }}>
              {title}
            </IonTitle>
          </IonToolbar>
        </IonHeader>
      )}
      {/* 
        2. IONCONTENT SCROLL BUFFER: Ensures if content overflowing height limits,
        touchscreen momentum gestures handle scrolling gracefully inside the pill sheet.
      */}
      <IonContent 
        scrollY={true}
        style={{
          '--background': 'var(--ion-background-color)',
          '--color': 'var(--ion-text-color)'
        }}
      >
        <div style={{ padding: '24px', paddingTop: '8px', paddingBottom: '16px' }}>
          
          {/* Title Element with integrated system text dark/light color shifts */}
          
     
          
          {/* Consumer Children Render Target Injection */}
          {children}
          
        </div>
      </IonContent>
    </IonModal>
  );
}