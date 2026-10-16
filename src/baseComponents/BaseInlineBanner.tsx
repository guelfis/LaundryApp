import React from "react";

interface BaseInlineBannerProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  variant?: "blue" | "amber";
  action?: React.ReactNode;
}

export function BaseInlineBanner({ 
  title, 
  description, 
  icon, 
  variant = "blue", 
  action 
}: BaseInlineBannerProps) {
  
  // Minimalist, semi-transparent dark-mode-first color tokens
  const variantClasses = {
    blue: "bg-blue-500/5 dark:bg-blue-500/5 border-blue-500/10 text-blue-700 dark:text-blue-400",
    amber: "bg-amber-500/5 dark:bg-amber-500/5 border-amber-500/10 text-amber-700 dark:text-amber-400"
  };

  return (
    <div className={`px-3 py-2 border rounded-xl flex items-center justify-between gap-3 ${variantClasses[variant]}`}>
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div className="shrink-0 text-current opacity-80">
          {icon}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold tracking-wide text-current">
            {title}
          </span>
          {description && (
            <span className="text-[11px] opacity-75 dark:text-zinc-400 ">
              {description}
            </span>
          )}
        </div>
      </div>
      
      {action && (
        <div className="shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
