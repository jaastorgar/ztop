import React from 'react';

export const InputTexto = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  type = 'text', 
  disabled = false, 
  error = '' 
}) => {
  return (
    <div className="w-full flex flex-col gap-1.5 px-1">
      {label && (
        <label className="font-heading font-bold text-xs uppercase tracking-wider text-muted-text">
          {label}
        </label>
      )}
      
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-3.5 rounded-xl border font-sans text-base transition-all duration-200 outline-none
          ${disabled 
            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
            : 'bg-white text-dark-text border-[#e6e6e6] focus:border-secondary-purple focus:ring-2 focus:ring-light-purple'
          }
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''}
        `}
      />
      
      {error && (
        <span className="text-xs font-semibold text-red-500 pl-1">
          {error}
        </span>
      )}
    </div>
  );
};

export default InputTexto;