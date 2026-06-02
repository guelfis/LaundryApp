import { ArrowLeft, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    onBack?: () => void;
}

export function PageHeader({ title, subtitle, icon, onBack }: PageHeaderProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    return (
        <header className="px-4 mt-4 mb-2 w-full">
            {/* Main Row Container with relative positioning */}
            <div className="relative flex items-center justify-center min-h-[48px] w-full px-12">
                
                {/* Back Button positioned absolutely on the left side */}
                {onBack && (
                    <button 
                        onClick={onBack}
                        className="absolute left-0 p-2 text-gray-600 dark:text-gray-300 active:scale-90 transition-transform"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                )}

                {/* Centered Content: Icon + Title */}
                <div className="flex items-center gap-2 truncate">
                    {icon &&(<div className="bg-transparent p-1 text-gray-900 dark:text-white shrink-0">
                        {icon}
                    </div>)}
                    <h1 className="text-xl font-black text-gray-900 dark:text-white truncate">
                        {title}
                    </h1>
                </div>

                <button
                    onClick={() => navigate("/dashboard/settings")} // Adjust your route path here
                    aria-label={t("common.btn_settings", "Settings")}
                    className="absolute right-0 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                    <Settings className="w-5 h-5" />
                </button>
            </div>

            {/* Subtitle remains centered underneath */}
            {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1 px-6">
                    {subtitle}
                </p>
            )}
        </header>
    );
}
