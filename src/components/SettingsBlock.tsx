export function SettingsBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 pt-4 pb-1">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
        </span>
      </div>
      {children}
    </div>
  );
}