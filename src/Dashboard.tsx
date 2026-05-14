import CalendarGrid from './CalendarGrid';
import { useState } from 'react';
import SlotModal from './SlotModal';
import PageLayout from './components/PageLayout';
import { PageHeader } from './components/PageHeader';
import { Calendar, Home } from 'lucide-react';
import MyApartmentTab from './MyApartmentTab';

enum DashboardTabs {
  Calendar = 'calendar',
  Apartment = 'apartment'
}

function Dashboard() {


  const [activeTab, setActiveTab] = useState<DashboardTabs>(DashboardTabs.Calendar);
  const [selectedSlot, setSelectedSlot] = useState<{ day: string, slot: string, slotKey: string } | null>(null);

  const handleOpenModal = (dayNum: string, time: string, slotKey: string) => {
    setSelectedSlot({ day: dayNum, slot: time, slotKey: slotKey });
  };

  const renderHeader = () => {
    if (activeTab === 'calendar') {
      return (
        <PageHeader 
          title="Calendar" 
          icon={<Calendar className="w-7 h-7 text-blue-500" />} 
        />
      );
    }
    return (
      <PageHeader
        title="Your Apartment"
        icon={<Home className="w-7 h-7 text-blue-500" />}
      />
    );
  };

    return (
      <PageLayout header={
        renderHeader()
      } 
      footer={
        <footer className="flex h-18 border-t border-[#b8cbe0] dark:border-slate-700 bg-[#dce8f5] dark:bg-slate-900 shrink-0 pb-[env(safe-area-inset-bottom)]">
          <nav className="flex w-full" aria-label="Footer Navigation">
            <button 
              onClick={() => setActiveTab(DashboardTabs.Calendar)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 border-none border-r border-[#b8cbe0] dark:border-slate-700 text-sm cursor-pointer transition-colors
                ${activeTab === DashboardTabs.Calendar 
                  ? 'bg-[#cbdcf0] dark:bg-slate-800 text-gray-900 dark:text-white font-bold' 
                  : 'bg-transparent text-gray-700 dark:text-gray-300 font-normal hover:bg-white/20 dark:hover:bg-slate-800/50'
                }`}
            >
              <Calendar className="w-5 h-5" />
              <span>my calendar</span>
            </button>
            
            <button 
              onClick={() => setActiveTab(DashboardTabs.Apartment)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 border-none text-sm cursor-pointer transition-colors
                ${activeTab === DashboardTabs.Apartment 
                  ? 'bg-[#cbdcf0] dark:bg-slate-800 text-gray-900 dark:text-white font-bold' 
                  : 'bg-transparent text-gray-700 dark:text-gray-300 font-normal hover:bg-white/20 dark:hover:bg-slate-800/50'
                }`}
            >
              <Home className="w-5 h-5" />
              <span>my apartment</span>
            </button>
          </nav>
        </footer>
      }>
        {activeTab === DashboardTabs.Calendar && (
          <>
            <CalendarGrid onSlotClick={handleOpenModal}/>
            <SlotModal 
            isOpen={!!selectedSlot} 
            onClose={() => setSelectedSlot(null)} 
            selectedSlot={selectedSlot} 
            />
        </>
        )}
        {activeTab === DashboardTabs.Apartment && (
          <MyApartmentTab />
        )}
      </PageLayout>
    );
}

export default Dashboard;
