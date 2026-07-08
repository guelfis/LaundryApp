import React from 'react';
import { IonButton } from '@ionic/react';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends React.ComponentPropsWithoutRef<typeof IonButton> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

export default function ModalButton({ 
  variant = 'primary', 
  children, 
  className = '', 
  ...props 
}: ButtonProps) {
  
  const baseStyles = "w-full rounded-2xl font-bold text-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none normal-case h-[56px] [--padding-top:0px] [--padding-bottom:0px] ion-no-margin";

  const variantStyles: Record<ButtonVariant, string> = {
    primary: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none",
    
    secondary: "bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700 dark:active:bg-slate-700",
    
    danger: "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
  };

  return (
    <IonButton
      fill="clear"
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </IonButton>
  );
}
