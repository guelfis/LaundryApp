import React from 'react';
import { baseIconButtonStyles, iconButtonSizes, iconButtonVariants } from '../constants/IconButtonConstants';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'standard' | 'danger';
  size?: 'normal' | 'compact'; // Added size parameter option
}




export const IconButton: React.FC<IconButtonProps> = ({ 
  children, 
  variant = 'standard', 
  size = 'normal',
  disabled,
  className = '', 
  ...props 
}) => {
  return (
    <button
      className={`
        ${baseIconButtonStyles} 
        ${iconButtonVariants[variant]} 
        ${iconButtonSizes[size]} 
        ${disabled ? 'opacity-40 cursor-not-allowed bg-gray-100 dark:bg-slate-800 pointer-events-none' : ''} 
        ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default IconButton;
