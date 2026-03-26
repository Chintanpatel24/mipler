import React, { type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary', size = 'md', children, style, ...props
}) => {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    border: 'none', borderRadius: 5, cursor: 'pointer', fontFamily: 'IBM Plex Sans, sans-serif',
    fontSize: size === 'sm' ? 11 : 12, padding: size === 'sm' ? '4px 10px' : '7px 14px',
    transition: 'opacity 0.1s',
  };
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: '#0e639c', color: '#fff' },
    secondary: { background: '#2a2a2a', color: '#ccc', border: 'none' },
    ghost: { background: 'transparent', color: '#888', border: 'none' },
    danger: { background: '#7a1a1a', color: '#f87171' },
  };
  return (
    <button style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={(e) => { if (!props.disabled) (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
      {...props}>
      {children}
    </button>
  );
};
