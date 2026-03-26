import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-medium rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-wall-textDim disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-wall-accent text-black hover:bg-white',
    secondary:
      'bg-wall-card border border-wall-cardBorder text-wall-text hover:bg-wall-cardHover hover:border-wall-textDim',
    ghost: 'bg-transparent text-wall-textMuted hover:text-wall-text hover:bg-wall-card',
    danger: 'bg-red-900/30 border border-red-800/50 text-red-300 hover:bg-red-900/50',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};