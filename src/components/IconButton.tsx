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
  className = '', 
  ...props 
}) => {
  return (
    <button
      className={`${baseIconButtonStyles} ${iconButtonVariants[variant]} ${iconButtonSizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default IconButton;
