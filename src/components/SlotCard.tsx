import React from 'react';
import { IonButton } from '@ionic/react';
import { cn } from '../utils/cn';

interface SlotCardProps {
  icon?: React.ReactNode;
  iconBgClass?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  containerClass?: string;
  endContent?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties; 
}

export default function SlotCard({
  icon,
  iconBgClass,
  title,
  subtitle,
  containerClass,
  endContent,
  onClick,
  style 
}: SlotCardProps) {
  
  const baseClasses = cn(
    "w-full border rounded-2xl flex items-center justify-between shadow-sm text-left transition-all min-h-0",
    "bg-white dark:bg-slate-800/40 border-gray-100 dark:border-slate-800",
    containerClass
  );

  if (onClick) {
    return (
      <IonButton
        fill="clear"
        onClick={onClick}
        
        className={cn(
          baseClasses,
          "p-4 active:scale-[0.99] active:bg-gray-100/40 dark:active:bg-slate-800/40",
          "ion-no-padding normal-case text-initial font-normal"
        )}
        style={{ 
          ...style,
          '--padding-start': '0',
          '--padding-end': '0',
          '--padding-top': '0',
          '--padding-bottom': '0',
          '--background-activated': 'transparent', 
          width: '100%'
        } as React.CSSProperties}
      >
        <CardContent icon={icon} iconBgClass={iconBgClass} title={title} subtitle={subtitle} endContent={endContent} />
      </IonButton>
    );
  }

  return (
    <div style={style} className={cn(baseClasses, "p-4")}>
      <CardContent icon={icon} iconBgClass={iconBgClass} title={title} subtitle={subtitle} endContent={endContent} />
    </div>
  );
}

interface CardContentProps {
  icon?: React.ReactNode;
  iconBgClass?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  endContent?: React.ReactNode;
}

function CardContent({ icon, iconBgClass, title, subtitle, endContent }: CardContentProps) {
  return (
    <div className="flex w-full items-center justify-between pointer-events-none">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {icon && (
          <div className={cn("p-2 rounded-xl shrink-0 flex items-center justify-center", iconBgClass)}>
            {icon}
          </div>
        )}
        
        <div className="flex flex-col min-w-0 truncate">
          <span className="font-bold text-gray-800 dark:text-gray-200 text-sm leading-snug truncate">
            {title}
          </span>
          {subtitle && (
            <span className="text-xs text-gray-500 font-medium tracking-wide mt-0.5 truncate">
              {subtitle}
            </span>
          )}   
        </div>
      </div>

      {endContent && (
        <div className="shrink-0 ml-3 flex items-center justify-center">
          {endContent}
        </div>
      )}
    </div>
  );
}
