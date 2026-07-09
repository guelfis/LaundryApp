export function SettingsBlock({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
      <div className="flex flex-row items-center px-4 pt-4 pb-1">
        {icon && <span className="mr-2">{icon}</span>}
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
        </span>
      </div>
      {children}
    </div>
  );
}