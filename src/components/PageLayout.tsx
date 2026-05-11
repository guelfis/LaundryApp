import React from 'react';
import LaundryIcon from './LaundryIcon';

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  return (
    /* Main Container */
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: '#dce8f5'
    }}>
      
      {/* Header : text on the left, icon on the right */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '20px 20px 0 20px', 
        width: '100%',
        opacity: 0.8
      }}>
        <h1 style={{
          fontSize: '12px', 
          fontWeight: 'bold',
          color: '#4A90E2',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {'Laundry Planner'}
        </h1>
        
        <LaundryIcon/>
      </header>

      {/* Main Content: it adapts to the remaining space */}
      <main style={{ 
        flex: 1, 
        padding: '10px 10px 10px 10px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {children}
      </main>
    </div>
  );
};

export default PageLayout;
