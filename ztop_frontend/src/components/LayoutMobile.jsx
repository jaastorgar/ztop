import React from 'react';

export const LayoutMobile = ({ children }) => {
  return (
    // Fondo oscuro profundo para que el mockup del celular resalte en el monitor
    <div className="min-h-screen w-full bg-[#1A002C] flex items-center justify-center p-0 sm:p-4">
      
      {/* Contenedor con aspecto de pantalla de Smartphone */}
      <div className="w-full h-screen sm:max-w-[412px] sm:h-[892px] bg-white sm:rounded-[40px] sm:shadow-[0_18px_44px_rgba(0,0,0,0.22)] overflow-hidden flex flex-col relative border border-transparent sm:border-[#2C0140]">
        
        {/* Barra de estado estética superior (Simulación de Isla Dinámica / Notch) */}
        <div className="hidden sm:flex justify-between items-center px-6 pt-3 pb-1 bg-white text-xs font-semibold text-gray-400 select-none">
          <span className="font-sans">9:41</span>
          <div className="w-24 h-4 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-2"></div>
          <div className="flex items-center gap-1 font-sans">
            <span>5G</span>
            <div className="w-5 h-2.5 border border-gray-400 rounded-sm p-0.5 flex items-center">
              <div className="w-full h-full bg-gray-400 rounded-2xs"></div>
            </div>
          </div>
        </div>

        {/* Contenido Dinámico e Interactivo de la Aplicación */}
        <div className="flex-1 overflow-y-auto flex flex-col bg-white">
          {children}
        </div>

        {/* Indicador de barra de inicio táctil (iOS/Android) */}
        <div className="hidden sm:block h-4 bg-white pb-2 flex justify-center items-center">
          <div className="w-32 h-1 bg-gray-200 rounded-full"></div>
        </div>

      </div>
    </div>
  );
};

export default LayoutMobile;