import React from 'react';
import { cn } from '@/lib/utils';

export const Card = ({ className, children, ...props }) => {
  return (
    <div 
      className={cn(
        "bg-white dark:bg-juri-900 rounded-2xl shadow-sm border border-gray-100 dark:border-juri-800 overflow-hidden",
        "bg-brand-bg border-brand-border",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ className, children, ...props }) => (
  <div className={cn("p-6 border-b border-brand-border dark:border-brand-border", className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className, children, ...props }) => (
  <h3 className={cn("text-xl font-bold text-gray-900 dark:text-white", className)} {...props}>
    {children}
  </h3>
);

export const CardContent = ({ className, children, ...props }) => (
  <div className={cn("p-6", className)} {...props}>
    {children}
  </div>
);
