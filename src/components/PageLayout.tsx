import React from 'react';
import LaundryIcon from './LaundryIcon';

interface PageLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode; // Accept a custom header component as input
  footer?: React.ReactNode;
  scrollableContent?: boolean; // Optional prop to enable/disable scrollable content
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, header, footer, scrollableContent }) => {
  return (
    /* Main Container */
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: '#dce8f5',
      overflow: 'hidden' // Prevents the outer window from scrolling
    }}>
      
      {/* Permanent Core App Header Container */}
      <div style={{ flexShrink: 0, backgroundColor: '#dce8f5' }}>
        
        {/* Always Visible: App Title and Icon */}
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
            color: '#4A90E2',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {'Laundry Planner'}
          </h1>
          <LaundryIcon/>
        </header>

       {/* Conditionally Rendered Extra Header Input */}
        {header && (
          <div style={{ padding: '0 20px 10px 20px' }}>
            {header}
          </div>
        )}
        
      </div>

      {/* Scrollable Main Content */}
      <main style={{ 
        flex: 1, 
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        overflowY: scrollableContent ? 'auto' : 'hidden', // Dynamically sets scrolling behavior
        WebkitOverflowScrolling: scrollableContent ? 'touch' : 'auto'  // iOS touch momentum fixes
      }}>
        {children}
      </main>

      {/* Permanent Fixed Bottom Layout Wrapper */}
      {footer && (
        <div style={{ 
          flexShrink: 0, 
          backgroundColor: '#dce8f5',
          paddingBottom: 'env(safe-area-inset-bottom)' // Native OS gesture home bar spacer
        }}>
          {footer}
        </div>
      )}

    </div>
  );
};

export default PageLayout;
