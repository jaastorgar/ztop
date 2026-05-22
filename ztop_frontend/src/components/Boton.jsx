import React from 'react';

export const Boton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false, 
  fullWidth = true 
}) => {
  
  // Estilos base de Tailwind para botones táctiles
  const baseStyles = "px-6 py-4 rounded-xl font-heading font-bold text-base tracking-wide transition-all duration-200 flex items-center justify-center shadow-1 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100";
  
  // Variantes cromáticas asociadas a la paleta de ztop!
  const variants = {
    primary: "bg-primary-purple text-white hover:bg-hover-dark-purple",
    secondary: "bg-light-purple text-secondary-purple hover:bg-hover-light-purple",
    stop: "bg-turquoise text-primary-purple font-extrabold uppercase tracking-widest shadow-2 text-lg py-5 animate-pulse focus:animate-none",
    danger: "bg-red-500 text-white hover:bg-red-600"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''}`}
    >
      {children}
    </button>
  );
};

export default Boton;