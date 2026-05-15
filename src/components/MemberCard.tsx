interface MemberCardProps {
  avatarContent: React.ReactNode;
  avatarBgClass: string;
  title: React.ReactNode;
  subtitle: string;
  subtitleClass?: string;
  isClickable: boolean;
  onClick?: () => void;
}

// 
export const MemberCard: React.FC<MemberCardProps> = ({
  avatarContent,
  avatarBgClass,
  title,
  subtitle,
  subtitleClass = 'text-gray-500',
  isClickable,
  onClick,
}) => {
  const RowComponent = isClickable ? 'button' : 'div';

  return (
    <RowComponent
      {...(isClickable ? { onClick, type: 'button' } : {})}
      className={`flex items-center justify-between py-3 border-b border-gray-200 dark:border-slate-800 last:border-b-0 min-h-[64px] w-full text-left transition-all ${
        isClickable
          ? 'active:scale-[0.99] active:bg-gray-50/50 dark:active:bg-slate-800/30 px-2 -mx-2 rounded-xl'
          : ''
      }`}
    >
      {/* Left Box: Avatar + Info */}
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm tracking-wider shrink-0 select-none ${avatarBgClass}`}>
          {avatarContent}
        </div>

        <div className="flex flex-col justify-center">
          <span className="text-base font-semibold text-gray-800 dark:text-gray-200 leading-snug">
            {title}
          </span>
          <span className={`text-xs font-medium mt-0.5 ${subtitleClass}`}>
            {subtitle}
          </span>
        </div>
      </div>

    </RowComponent>
  );
};