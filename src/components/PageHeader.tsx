
interface PageHeaderProps {
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
}

export function PageHeader({ title, subtitle, icon }: PageHeaderProps) {
    return (
        <header className="px-4 mt-2 mb-2">
            {/* Title and Icon on the same line */}
            <div className="flex items-center justify-center gap-3 mb-2">
            <div className="bg-transparent p-2 rounded-xl ">
                {icon}
            </div>
            <h1 className="text-2xl font-black text-gray-900">
                {title}
            </h1>
            </div>
            {/* Optional subtitle */}
            {subtitle && (
            <p className="text-sm text-gray-600 text-center">
                {subtitle}
            </p>
            )}
      </header>
    )
}