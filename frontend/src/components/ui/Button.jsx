import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = {
  primary: "bg-accent hover:bg-accent-dark text-white font-semibold",
  secondary: "bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200 dark:bg-white/5 dark:text-white dark:border-white/5 dark:hover:bg-white/10",
  outline: "bg-transparent border border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300",
  ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300",
  danger: "bg-red-600 hover:bg-red-700 text-white border border-red-500/10",
};

const buttonSizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
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
        "inline-flex items-center justify-center rounded-md font-semibold transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-accent/40 disabled:opacity-50 disabled:cursor-not-allowed",
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
