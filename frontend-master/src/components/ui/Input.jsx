import React from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

export const Input = React.forwardRef(({ 
  className, 
  label, 
  error, 
  icon: Icon, 
  type = 'text',
  disableReveal = false,
  ...props 
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword && !disableReveal ? 'text' : 'password') : type;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          ref={ref}
          type={inputType}
          className={cn(
            "w-full rounded-xl border bg-brand-bg dark:bg-brand-bg text-gray-900 dark:text-white outline-none transition-all duration-200",
            "border-brand-border dark:border-brand-border focus:border-accent focus:ring-2 focus:ring-accent/20",
            Icon ? "pl-14" : "px-4",
            isPassword && !disableReveal ? "pr-12" : "px-4",
            "py-3",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          {...props}
        />
        {isPassword && !disableReveal && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500 animate-in slide-in-from-top-1 fade-in duration-200">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";
