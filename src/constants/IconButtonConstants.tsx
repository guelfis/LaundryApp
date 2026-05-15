export const iconButtonVariants = {
  // Added disabled:active background resets to freeze touch triggers
  standard: "border-gray-400 dark:border-slate-600 active:bg-gray-100 dark:active:bg-slate-700 disabled:active:bg-white dark:disabled:active:bg-slate-800",
  danger: "border-red-300 dark:border-red-900 active:bg-red-50 dark:active:bg-red-950/30 disabled:active:bg-white dark:disabled:active:bg-slate-800"
};

// Size spacing variants mapping padding dimensions
export const iconButtonSizes = {
  normal: "p-2",      // Original size for large layout fields
  compact: "p-1.5"   // Compact configuration for inner list rows
};

export const baseIconButtonStyles = "border rounded-xl bg-white dark:bg-slate-800 transition-colors shrink-0 flex items-center justify-center";
