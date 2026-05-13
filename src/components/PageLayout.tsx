import React from 'react';
import LaundryIcon from './LaundryIcon';

interface PageLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode; // Accept a custom header component as input
  footer?: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, header, footer }) => {
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
      backgroundColor: 'var(--background-color)', /* Dynamically reads global theme */
      color: 'var(--text-color)'                 /* Dynamically reads global theme */
    }}>
      
      <div style={{ flexShrink: 0 }}>
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '20px 20px 10px 20px', 
          width: '100%',
          opacity: 0.8
        }}>
          {/* This text automatically inherits the dark/light text color */}
          <h1 style={{
            fontSize: '12px', 
            fontWeight: 'bold',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {'Laundry Planner'}
          </h1>
          <LaundryIcon/>
        </header>

        {header && (
          <div style={{ padding: '0 20px 10px 20px' }}>
            {header}
          </div>
        )}
      </div>

      <main style={{ 
        flex: 1, 
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0, 
        overflowY: 'auto', 
        WebkitOverflowScrolling: 'touch'
      }}>
        {children}
      </main>

      {footer && (
        <div style={{ 
          flexShrink: 0, 
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}>
          {footer}
        </div>
      )}
    </div>
  );
};


export default PageLayout;
