import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = {
  primary: "bg-gradient-to-r from-accent to-accent-dark hover:from-accent-light hover:to-accent text-white shadow-lg shadow-accent/20",
  secondary: "bg-brand-bg hover:bg-brand-border text-gray-900 border border-brand-border dark:bg-brand-bg dark:text-white dark:border-brand-border",
  outline: "bg-transparent border border-brand-border hover:bg-brand-bg text-gray-700 dark:border-brand-border dark:text-gray-300 dark:hover:bg-brand-bg",
  ghost: "bg-transparent hover:bg-brand-bg text-gray-700 dark:text-gray-300 dark:hover:bg-brand-bg",
  danger: "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20",
};

const buttonSizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
  icon: "p-2",
};

export const Button = React.forwardRef(({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  icon: Icon,
  children, 
  disabled,
  ...props 
}, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]",
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : Icon ? (
        <Icon className={cn("w-4 h-4", children ? "mr-2" : "")} />
      ) : null}
      {children}
    </button>
  );
});

Button.displayName = "Button";
