import React from 'react';

const AvatarBubble = ({ 
  url, 
  username = 'User', 
  level = null, 
  size = 'md' // sm | md | lg 
}) => {
  // Fallback inteligente usando DiceBear para generar avatares estilo robot únicos por username
  const fallbackUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
  
  const sizes = {
    sm: { container: "w-12 h-12 p-0.5", badge: "h-4 px-1 text-[9px] -bottom-1" },
    md: { container: "w-16 h-16 p-1", badge: "h-5 px-1.5 text-[10px] -bottom-1" },
    lg: { container: "w-24 h-24 p-1", badge: "h-6 px-2 text-xxs font-black -bottom-1" }
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div className="relative inline-block select-none">
      {/* Contenedor circular con el gradiente oficial del pantallazo */}
      <div className={`${currentSize.container} rounded-full bg-gradient-to-tr from-brand-secondary to-brand-accent shadow-touch-2`}>
        <img 
          src={url || fallbackUrl} 
          alt={`${username}'s avatar`} 
          className="w-full h-full object-cover bg-brand-darkBg rounded-full"
        />
      </div>
      
      {/* Badge flotante de Nivel (Útil para Perfil y Podio) */}
      {level !== null && (
        <span className={`absolute right-1/2 translate-x-1/2 bg-brand-accent text-brand-darkBg font-title font-black uppercase rounded-md flex items-center justify-center tracking-wider border border-brand-darkBg shadow-touch-1 ${currentSize.badge}`}>
          LVL {level}
        </span>
      )}
    </div>
  );
};

export default AvatarBubble;