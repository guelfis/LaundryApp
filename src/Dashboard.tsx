import CalendarGrid from './CalendarGrid';
import { useState } from 'react';
import SlotModal from './SlotModal';

function Dashboard() {
  
const [selectedSlot, setSelectedSlot] = useState<{ day: string, slot: string, slotKey: string } | null>(null);

const handleOpenModal = (dayNum: string, time: string, slotKey: string) => {
  setSelectedSlot({ day: dayNum, slot: time, slotKey: slotKey });
};

  return (
    <div className="min-h-screen bg-[#dce8f5] flex flex-col items-center py-8 px-4">
      <h1 className="text-xl font-semibold text-gray-700 mb-6 tracking-wide">Hello {localStorage.getItem('apartmentName') || 'there'}!</h1>
        <CalendarGrid onSlotClick={handleOpenModal}/>
        <SlotModal 
        isOpen={!!selectedSlot} 
        onClose={() => setSelectedSlot(null)} 
        selectedSlot={selectedSlot} 
      />
      
    </div>
  );
}

export default Dashboard;
