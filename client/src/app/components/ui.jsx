import { cn } from '../lib/utils';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className, 
  as: Component = 'button',
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';
  
  const variants = {
    primary: 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500',
    secondary: 'bg-card text-foreground hover:bg-card/5 focus:ring-orange-500',
    outline: 'border border-border bg-card text-foreground hover:bg-card/5 focus:ring-orange-500',
    ghost: 'text-foreground hover:bg-card/5 focus:ring-orange-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  return (
    <Component
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </Component>
  );
};

export const Card = ({ children, className, ...props }) => {
  return (
    <div 
      className={cn('bg-card rounded-xl border border-border', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const Badge = ({ children, variant = 'default', className }) => {
  const variants = {
    default: 'bg-card/10 text-foreground',
    success: 'bg-emerald-500/10 text-emerald-500',
    warning: 'bg-amber-500/10 text-amber-500',
    danger: 'bg-red-500/10 text-red-500',
    info: 'bg-blue-500/10 text-blue-500',
    purple: 'bg-purple-500/10 text-purple-500'
  };
  
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs', variants[variant], className)}>
      {children}
    </span>
  );
};

export const Input = ({ label, error, className, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm text-muted-foreground mb-1.5">
          {label}
        </label>
      )}
      <input
        className={cn(
          'w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-muted-foreground',
          error && 'border-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export const Select = ({ label, options, className, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm text-muted-foreground mb-1.5">
          {label}
        </label>
      )}
      <select
        className={cn(
          'w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-card text-foreground',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export const Textarea = ({ label, className, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm text-muted-foreground mb-1.5">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          'w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none placeholder:text-muted-foreground',
          className
        )}
        {...props}
      />
    </div>
  );
};

export const ProgressBar = ({ value, max = 100, className, showLabel = true }) => {
  const percentage = (value / max) * 100;
  
  return (
    <div className="w-full">
      <div className={cn('w-full bg-black/20 rounded-full h-2', className)}>
        <div
          className="bg-orange-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-muted-foreground mt-1">{value} / {max}</p>
      )}
    </div>
  );
};

export const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {Icon && <Icon className="w-12 h-12 text-muted-foreground mb-4" />}
      <h3 className="text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">{description}</p>
      {action}
    </div>
  );
};

export const LoadingSpinner = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  return (
    <div className="flex items-center justify-center p-8">
      <div className={cn('animate-spin rounded-full border-b-2 border-orange-500', sizes[size])} />
    </div>
  );
};
