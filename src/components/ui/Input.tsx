import React, { type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, style, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {label && <p style={{ fontSize: 11, color: '#555', fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.06em' }}>{label.toUpperCase()}</p>}
    <input
      style={{
        width: '100%', padding: '7px 10px', background: '#1a1a1a', border: '1px solid #2a2a2a',
        borderRadius: 5, fontSize: 12, color: '#ccc', outline: 'none',
        fontFamily: 'IBM Plex Sans, sans-serif', boxSizing: 'border-box', ...style,
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = '#3a3a3a')}
      onBlur={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
      {...props}
    />
  </div>
);
