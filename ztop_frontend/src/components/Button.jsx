import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', // primary | secondary | accent | outline
  disabled = false, 
  icon: Icon = null,
  className = '' 
}) => {
  // Clases base para asegurar ergonomía y respuesta inmediata en smartphones
  const baseStyles = "h-14 w-full rounded-xl font-sans font-medium flex items-center justify-center space-x-2 shadow-touch-2 active:scale-[0.98] transition-all duration-150 select-none";
  
  // Mapeo directo a tus tokens oficiales de Tailwind
  const variants = {
    primary: "bg-brand-primary text-white hover:bg-brand-hoverDark border border-white/5",
    secondary: "bg-brand-secondary text-white hover:opacity-90",
    accent: "bg-brand-accent text-brand-darkBg font-title font-bold tracking-wide hover:bg-brand-accent/90",
    outline: "bg-transparent border-2 border-brand-lightBg/20 text-brand-lightBg hover:border-brand-lightBg/40"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed active:scale-100' : ''} ${className}`}
    >
      {Icon && <Icon className="w-5 h-5 text-current" />}
      <span>{children}</span>
    </button>
  );
};

export default Button;