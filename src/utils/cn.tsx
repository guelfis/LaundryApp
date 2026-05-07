import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind classes and handles conflicts 
 * (e.g., if you pass 'p-4' and 'p-2', it keeps only the last one)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}