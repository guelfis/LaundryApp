export default function Button({ label, onClick, icon }: { label: string; onClick: () => void; icon?: React.ReactNode }) {
    return (
        <button
          type="button"
          onClick={onClick}
          className="w-[calc(100%-2rem)] mx-auto py-4 bg-white dark:bg-slate-900 border border-dashed border-gray-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm shadow-xs active:scale-[0.98]"        >
          {icon}
          {label}
        </button>
        );
    }