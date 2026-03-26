import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-wall-textMuted">{label}</label>
      )}
      <input
        className={`w-full px-3 py-2 bg-wall-card border border-wall-cardBorder rounded-md text-sm text-wall-text placeholder-wall-textDim focus:outline-none focus:border-wall-textMuted transition-colors ${className}`}
        {...props}
      />
    </div>
  );
};