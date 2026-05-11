import CalendarGrid from './CalendarGrid';
import { useState } from 'react';
import SlotModal from './SlotModal';
import PageLayout from './components/PageLayout';

function Dashboard() {
  
const [selectedSlot, setSelectedSlot] = useState<{ day: string, slot: string, slotKey: string } | null>(null);

const handleOpenModal = (dayNum: string, time: string, slotKey: string) => {
  setSelectedSlot({ day: dayNum, slot: time, slotKey: slotKey });
};

  return (
    <PageLayout>
        <CalendarGrid onSlotClick={handleOpenModal}/>
        <SlotModal 
        isOpen={!!selectedSlot} 
        onClose={() => setSelectedSlot(null)} 
        selectedSlot={selectedSlot} 
      />
      
    </PageLayout>
  );
}

export default Dashboard;
