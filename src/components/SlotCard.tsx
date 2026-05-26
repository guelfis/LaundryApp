import React from 'react';
import { cn } from '../utils/cn';

interface SlotCardProps {
  icon: React.ReactNode;
  iconBgClass?: string;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  containerClass?: string;
  endContent?: React.ReactNode;
  onClick?: () => void;
}

export default function SlotCard({
  icon,
  iconBgClass,
  title,
  subtitle,
  containerClass,
  endContent,
  onClick
}: SlotCardProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      {...(onClick ? { onClick, type: 'button' } : {})}
      className={cn(
        "w-full p-4 border rounded-2xl flex items-center justify-between shadow-sm text-left transition-all",
        onClick ? "active:scale-[0.99] active:bg-gray-100/40 dark:active:bg-slate-800/40" : "",
        containerClass || "bg-white dark:bg-slate-800/40 border-gray-100 dark:border-slate-800"
      )}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Left Icon Block Badge Container Wrapper */}
        <div className={cn("p-2 rounded-xl shrink-0 flex items-center justify-center", iconBgClass)}>
          {icon}
        </div>
        
        {/* Central Metadata Typography Stack */}
        <div className="flex flex-col min-w-0 truncate">
          <span className="font-bold text-gray-800 dark:text-gray-200 text-sm leading-snug truncate">
            {title}
          </span>
          <span className="text-xs text-gray-500 font-medium tracking-wide mt-0.5 truncate">
            {subtitle}
          </span>
        </div>
      </div>

      {/* Right Custom Floating Component Node Hook */}
      {endContent && (
        <div className="shrink-0 ml-3 flex items-center justify-center">
          {endContent}
        </div>
      )}
    </Component>
  );
}
