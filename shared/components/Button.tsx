import React from 'react';
import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  label, 
  icon, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...props 
}) => {
  const isDisabled = disabled || loading;
  
  return (
    <button 
      className={`hub-button hub-button--${variant} hub-button--${size} ${fullWidth ? 'hub-button--full' : ''} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <div className="hub-button__loader" />
      ) : (
        <>
          {icon && <span className="hub-button__icon">{icon}</span>}
          <span className="hub-button__label">{label || children}</span>
        </>
      )}
    </button>
  );
};

export default Button;
