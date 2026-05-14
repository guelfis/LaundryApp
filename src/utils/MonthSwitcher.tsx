import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTHS } from '../constants/dates';

type MonthSwitcherProps = {
    activeMonth: number;
    setActiveMonth: (month: number) => void;
};

function MonthSwitcher({ activeMonth, setActiveMonth }: MonthSwitcherProps) {
    const handlePrevMonth = () => {
        setActiveMonth(activeMonth === 0 ? 11 : activeMonth - 1);
    };
    const handleNextMonth = () => {
        setActiveMonth(activeMonth === 11 ? 0 : activeMonth + 1);
    };

    return (
        <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:bg-white/60 dark:hover:bg-white/10 rounded-full transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white w-40 text-center">{MONTHS[activeMonth]}</h2>
        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-white/60 dark:hover:bg-white/10 rounded-full transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    )
}

export default MonthSwitcher;