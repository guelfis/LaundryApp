import React from 'react';
import { IonPage, IonHeader, IonContent, IonFooter } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import LaundryIcon from './LaundryIcon';

interface PageLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  scrollable?: boolean; // NEW: Controls scrolling per-page dynamically
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, header, footer, scrollable = true }) => {
  const { t } = useTranslation();

  return (
    <IonPage style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <IonHeader style={{ boxShadow: 'none', background: 'transparent', flexShrink: 0 }}>
        <div>
          <header style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '20px 20px 10px 20px', 
            width: '100%',
            opacity: 0.8
          }}>
            <h1 style={{
              fontSize: '12px', 
              fontWeight: 'bold',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: 'var(--ion-text-color)'
            }}>
              {t('app.title', 'Laundry Planner')}
            </h1>
            <LaundryIcon />
          </header>

          {header && (
            <div style={{ padding: '0 20px 10px 20px' }}>
              {header}
            </div>
          )}
        </div>
      </IonHeader>

      {/* 
        Uses the scrollable parameter flag.
        True for all standard pages, False exclusively for the specialized Grid layout view.
      */}
      <IonContent 
        scrollY={scrollable} 
        style={{
          '--background': 'var(--ion-background-color)',
          '--color': 'var(--ion-text-color)'
        }}
      >
        <main style={{ 
          height: '100%',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0 // Crucial for nested flex child scrolling calculations
        }}>
          {children}
        </main>
      </IonContent>

      {footer && (
        <IonFooter style={{ boxShadow: 'none', background: 'transparent', flexShrink: 0 }}>
          <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {footer}
          </div>
        </IonFooter>
      )}
    </IonPage>
  );
};

export default PageLayout;
