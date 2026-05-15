import { useEffect, useState } from "react";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'password' | 'email';
  autoFocus?: boolean;
  className?: string; 
  errorFn?: (value: string) => string | null; 
  onErrorChange?: (hasError: boolean) => void;
}

export default function TextInput({
  value,
  onChange,
  placeholder = '',
  type = 'text',
  autoFocus = false,
  className = '',
  errorFn,
  onErrorChange,
}: TextInputProps) {
    const [localError, setLocalError] = useState<string | null>(null);
    useEffect(() => {
        if (errorFn) {
            const errorMessage = errorFn(value);
            setLocalError(errorMessage);
            if (onErrorChange) {
                onErrorChange(!!errorMessage);
            }
        }
    }, [value, errorFn, onErrorChange]);
    
  return (
    <div className="w-full flex flex-col gap-1">
        <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none transition-all ${
            localError 
                ? 'border-red-500 focus:border-red-500 dark:border-red-500' 
                : 'border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400'
            } ${className}`}
        />
        {localError && (
            <span className="text-xs font-semibold text-red-500 pl-1">
            {localError}
            </span>
        )}
        </div>
    );
}
