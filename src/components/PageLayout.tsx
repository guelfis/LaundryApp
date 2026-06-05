import React from 'react';
import { IonPage, IonHeader, IonContent, IonFooter } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import LaundryIcon from './LaundryIcon';

interface PageLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, header, footer }) => {
  const { t } = useTranslation();

  return (
    /* 1. IonPage provides full viewport bounding and native lifecycle support */
    <IonPage style={{ backgroundColor: 'var(--ion-background-color)' }}>
      
      {/* 2. IonHeader contains top layout blocks, isolated from scroll containers */}
      <IonHeader collapse="fade" style={{ boxShadow: 'none', background: 'transparent' }}>
        <div style={{ flexShrink: 0 }}>
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
              {t('app.title')}
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

      {/* 3. IonContent implements native momentum scrolling and dark mode color inheritance */}
      <IonContent 
        scrollEvents={true}
        style={{
          '--background': 'var(--ion-background-color)',
          '--color': 'var(--ion-text-color)'
        }}
      >
        <main style={{ 
          height: '100%',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {children}
        </main>
      </IonContent>

      {/* 4. IonFooter properly adjusts content above mobile system navigation pills */}
      {footer && (
        <IonFooter style={{ boxShadow: 'none', background: 'transparent' }}>
          <div style={{ 
            flexShrink: 0, 
            paddingBottom: 'env(safe-area-inset-bottom)'
          }}>
            {footer}
          </div>
        </IonFooter>
      )}
    </IonPage>
  );
};

export default PageLayout;
