import React from 'react';

const InputField = ({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  icon: Icon = null,
  required = false,
  maxLength,
  disabled = false,
  className = '',
  textAlign = 'left' // left | center
}) => {
  return (
    <div className="relative w-full select-none">
      {/* Renderizado condicional del ícono con opacidad armónica */}
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
          <Icon className="w-5 h-5 text-brand-lightBg/40" />
        </div>
      )}
      <input
        type={type}
        required={required}
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full h-14 pr-4
          bg-brand-primary text-white font-sans text-base
          placeholder:text-white/20
          border border-transparent
          rounded-xl shadow-touch-1
          focus:ring-2 focus:ring-brand-accent focus:border-brand-accent focus:outline-none
          transition-all duration-150
          ${Icon ? 'pl-12' : 'pl-4'}
          ${textAlign === 'center' ? 'text-center' : 'text-left'}
          ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
          ${className}
        `}
      />
    </div>
  );
};

export default InputField;