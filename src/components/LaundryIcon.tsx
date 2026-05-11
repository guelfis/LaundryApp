const LaundryIcon = () => {
  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '20px',
      display: 'flex',
      opacity: 0.8           
    }}>
      {/* Icon: Calendar with laundry machine */}
      <svg 
        width="32" 
        height="32" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://w3.org"
      >
        <rect x="3" y="4" width="18" height="17" rx="2" stroke="#4A90E2" strokeWidth="1.5"/>
        <line x1="3" y1="9" x2="21" y2="9" stroke="#4A90E2" strokeWidth="1.5"/>
        <rect x="7" y="2" width="2" height="4" rx="1" fill="#4A90E2"/>
        <rect x="15" y="2" width="2" height="4" rx="1" fill="#4A90E2"/>
        <circle cx="12" cy="15" r="4.5" stroke="#4A90E2" strokeWidth="1.5"/>
        <path d="M10 15C10 13.8954 10.8954 13 12 13C13.1046 13 14 13.8954 14 15" stroke="#4A90E2" strokeWidth="1"/>
      </svg>
    </div>
  );
};

export default LaundryIcon;
