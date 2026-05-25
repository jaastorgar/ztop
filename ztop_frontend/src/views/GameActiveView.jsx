import React, { useState, useContext } from 'react';
// 🧵 Importamos los íconos de la librería instalada (Heroicons set)
import { HiUser, HiGlobeAlt, HiPencil, HiCube, HiHandThumbUp } from "react-icons/hi2"; 
import { ZtopContext } from '../context/ZtopContext';

const GameActiveView = () => {
  // 🧠 Conectamos al contexto global para la lógica de Sockets
  const { letraActiva, presionarStop, segundosRestantes, estadoJuego } = useContext(ZtopContext);

  // 📱 Estado local para las respuestas táctiles responsivas
  const [respuestas, setRespuestas] = useState({
    nombre: '',
    apellido: '',
    ciudadPais: '',
    animal: '',
    cosa: ''
  });

  // 📝 Manejador universal de cambios en los inputs responsivos
  const handleInputChange = (categoria, valor) => {
    setRespuestas(prev => ({
      ...prev,
      [categoria]: valor
    }));
    // Opcional: Aquí podrías enviar ráfagas de escritura por socket si quisieras ver lo que escriben los rivales en tiempo real
  };

  // 🛑 Acción del botón principal turquesa ¡STOP!
  const handleStop = () => {
    // Solo permitimos presionar Stop si la ronda está activa
    if (estadoJuego === 'en_ronda') {
      presionarStop();
    }
  };

  // 🛡️ Bloqueo visual si el estado cambia a cuenta regresiva o evaluación
  const inputsBloqueados = estadoJuego === 'cuenta_regresiva' || estadoJuego === 'evaluacion';

  // 📦 Estructura de definición de los inputs para un mapeo limpio
  const camposInput = [
    { id: 'nombre', label: 'Nombre', icon: HiUser, placeholder: 'Ingresa un nombre...' },
    { id: 'apellido', label: 'Apellido', icon: HiHandThumbUp, placeholder: 'Ingresa un apellido...' },
    { id: 'ciudadPais', label: 'Ciudad / País', icon: HiGlobeAlt, placeholder: 'Ingresa una ciudad o país...' },
    { id: 'animal', label: 'Animal', icon: HiPencil, placeholder: 'Ingresa un animal...' },
    { id: 'cosa', label: 'Cosa', icon: HiCube, placeholder: 'Ingresa una cosa...' },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-brand-darkBg overflow-hidden">
      
      {/* 🟢 HEADER: Sección de la Letra Gigante B y Ronda (Réplica del pantallazo) */}
      <div className="w-full flex flex-col items-center pt-8 pb-4">
        <span className="font-title text-sm font-light text-white/80 tracking-wide">
          Ronda 1
        </span>
        <h1 className="font-title text-9xl font-bold text-white mt-1 mb-2 tracking-tighter">
          {letraActiva || 'B'} {/* Letra dinámica desde ZtopContext */}
        </h1>
        <p className="font-sans text-sm font-medium text-white/90">
          Escribe palabras que comiencen con la letra: <span className="text-brand-accent font-bold">{letraActiva || 'B'}</span>
        </p>
      </div>

      {/* 🟠 CUERPO: Listado de Inputs Responsivos ( space-y-4 para el espaciado vertical) */}
      <div className="flex-grow w-full px-6 py-4 space-y-4 overflow-y-auto scrollbar-hide">
        {camposInput.map((campo) => {
          const Icono = campo.icon;
          return (
            <div key={campo.id} className="relative w-full">
              {/* Ícono absoluto a la izquierda con el morado claro corporativo */}
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <Icono className="w-5 h-5 text-brand-lightBg/80" />
              </div>
              
              {/* Input responsivo: fondo morado primario, texto blanco, placeholder gris */}
              <input
                type="text"
                value={respuestas[campo.id]}
                onChange={(e) => handleInputChange(campo.id, e.target.value)}
                placeholder={campo.placeholder}
                disabled={inputsBloqueados}
                className={`
                  w-full h-14 pl-12 pr-4
                  bg-brand-primary text-white font-sans text-base
                  placeholder:text-brand-textMuted
                  border border-transparent
                  rounded-xl shadow-touch-1
                  focus:ring-2 focus:ring-brand-accent focus:border-brand-accent focus:outline-none
                  transition-all duration-150
                  ${inputsBloqueados ? 'opacity-60 cursor-not-allowed' : ''}
                `}
              />
            </div>
          );
        })}
      </div>

      {/* 🔵 FOOTER: Botón circular Turquesa Eléctrico ¡STOP! con efecto Vibrante */}
      <div className="w-full px-6 py-6 mt-auto">
        <button
          onClick={handleStop}
          disabled={inputsBloqueados}
          className={`
            w-full h-20
            flex flex-col items-center justify-center
            bg-brand-accent text-brand-darkBg font-title
            rounded-full shadow-touch-3
            hover:bg-brand-accent/90
            active:scale-[0.97]
            transition-all duration-150
            ${inputsBloqueados ? 'opacity-60 cursor-not-allowed' : 'animate-pulse-vibrant'}
          `}
        >
          <span className="text-2xl font-bold tracking-tight">¡STOP!</span>
          <span className="text-xs font-semibold -mt-1">PRESIONA AQUÍ</span>
          
          {/* Muestra la cuenta regresiva de 10s asíncrona perfectamente sincronizada con el backend */}
          {inputsBloqueados && segundosRestantes > 0 && (
            <span className="absolute right-8 text-3xl font-bold font-tight text-brand-primary">
              {segundosRestantes}s
            </span>
          )}
        </button>
      </div>

    </div>
  );
};

export default GameActiveView;