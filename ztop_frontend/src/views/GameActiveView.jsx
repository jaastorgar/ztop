import React, { useState, useContext, useEffect } from 'react';
// 🧵 Íconos profesionales de Heroicons (Hi2 set)
import { HiUser, HiGlobeAlt, HiPencil, HiCube, HiHandThumbUp, HiXMark } from "react-icons/hi2"; 
import { ZtopContext } from '../context/ZtopContext';

const GameActiveView = () => {
  // 🧠 Conectamos al contexto global incluyendo el modoJuego y desconectarSala
  const { 
    salaCodigo, 
    letraActiva, 
    presionarStop, 
    segundosRestantes, 
    estadoJuego, 
    modoJuego, 
    desconectarSala // 🚀 NUEVO: Para el botón de salir
  } = useContext(ZtopContext);
  const token = localStorage.getItem('ztop_token'); // 🔑 Necesario para el Auto-Guardado

  // 📱 Estado local para las respuestas táctiles responsivas
  const [respuestas, setRespuestas] = useState({
    nombre: '',
    apellido: '',
    ciudadPais: '',
    animal: '',
    cosa: ''
  });

  // 🚀 Función asíncrona para guardar respuestas en PostgreSQL vía REST API
  const guardarRespuestasAPI = async (respuestasActuales) => {
    if (!salaCodigo || !token) return;
    try {
      // Cruzamos los datos convirtiendo ciudadPais a ciudad_pais como espera tu serializador de Django
      await fetch(`http://192.168.18.199:8000/api/sala/${salaCodigo}/responder/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          nombre: respuestasActuales.nombre,
          apellido: respuestasActuales.apellido,
          ciudad_pais: respuestasActuales.ciudadPais, 
          animal: respuestasActuales.animal,
          cosa: respuestasActuales.cosa
        })
      });
    } catch (err) {
      console.error("Error en auto-guardado ztop!:", err);
    }
  };

  // 🔄 Módulo de Auto-Guardado Continuo (Debounce de 500ms para no saturar la red al tipear)
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (estadoJuego === 'en_ronda' || estadoJuego === 'cuenta_regresiva') {
        guardarRespuestasAPI(respuestas);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [respuestas, estadoJuego]);

  // 🚨 Guardado de pánico inmediato al presionar STOP
  useEffect(() => {
    if (estadoJuego === 'cuenta_regresiva') {
      guardarRespuestasAPI(respuestas);
    }
  }, [estadoJuego]);

  // 📝 Manejador universal de cambios en los inputs responsivos
  const handleInputChange = (categoria, valor) => {
    setRespuestas(prev => ({
      ...prev,
      [categoria]: valor
    }));
  };

  // 🛑 Acción del botón principal ¡STOP!
  const handleStop = () => {
    if (estadoJuego === 'en_ronda') {
      presionarStop();
    }
  };

  // 🛡️ Bloqueo visual si el estado cambia a cuenta regresiva o evaluación
  const inputsBloqueados = estadoJuego === 'cuenta_regresiva' || estadoJuego === 'evaluacion';

  // =========================================================================
  // 🍻 CONFIGURACIÓN DINÁMICA DE CATEGORÍAS SEGÚN EL MODO DE JUEGO
  // =========================================================================
  
  const camposClasicos = [
    { id: 'nombre', label: 'Nombre', icon: HiUser, placeholder: 'Ingresa un nombre...' },
    { id: 'apellido', label: 'Apellido', icon: HiHandThumbUp, placeholder: 'Ingresa un apellido...' },
    { id: 'ciudadPais', label: 'Ciudad / País', icon: HiGlobeAlt, placeholder: 'Ingresa una ciudad o país...' },
    { id: 'animal', label: 'Animal', icon: HiPencil, placeholder: 'Ingresa un animal...' },
    { id: 'cosa', label: 'Cosa', icon: HiCube, placeholder: 'Ingresa una cosa...' },
  ];

  const camposAlcoholicos = [
    { id: 'nombre', label: '🍺 Cohete (Trago/Chela)', icon: HiUser, placeholder: 'Ej: Cristal, Piscola...' },
    { id: 'apellido', label: '📍 Lugar para tomar', icon: HiGlobeAlt, placeholder: 'Ej: Bar, Plaza, Cuneta...' },
    { id: 'ciudadPais', label: '🗣️ Excusa para tomar', icon: HiHandThumbUp, placeholder: 'Ej: Es viernes, Sed...' },
    { id: 'animal', label: '🤪 Cosa que haces curao', icon: HiPencil, placeholder: 'Ej: Llamar a mi ex...' },
    { id: 'cosa', label: '🍔 El Bajón', icon: HiCube, placeholder: 'Ej: Completo, Pizza...' },
  ];

  // Alternador maestro de las categorías que se van a renderizar
  const camposInput = modoJuego === 'alcoholico' ? camposAlcoholicos : camposClasicos;

  // 🌀 EFECTO BORRACHERA (UI CHAOS): Desenfoque y rotación sutil si el modo alcohólico está activo
  const efectoBorrachera = modoJuego === 'alcoholico' 
    ? "backdrop-blur-sm transition-transform duration-1000 origin-center rotate-[0.5deg]" 
    : "";

  return (
    /* 🚀 PÁNICO: bg-red-950 al activarse el STOP, sino bg-brand-darkBg original rosado */
    <div className={`w-full h-full flex flex-col transition-colors duration-500 overflow-hidden ${estadoJuego === 'cuenta_regresiva' ? 'bg-red-950' : 'bg-brand-darkBg'}`}>
      
      {/* 🟢 HEADER: Sección de la Letra Gigante (Diseño Rosado Restaurado) */}
      <div className={`w-full flex flex-col items-center pt-8 pb-4 transition-all relative ${efectoBorrachera}`}>
        
        {/* 🚀 MEJORA 2: Botón Profesional de Salir (X) */}
        <button 
          onClick={desconectarSala}
          className="absolute top-6 right-6 p-2.5 bg-brand-primary/40 border border-white/5 rounded-full text-white/70 active:scale-95 transition-all shadow-md z-30"
          aria-label="Salir del juego"
        >
          <HiXMark className="w-5 h-5" />
        </button>

        <span className={`font-title text-sm font-bold tracking-widest ${modoJuego === 'alcoholico' ? 'text-amber-500 animate-pulse' : 'text-brand-lightBg/80'}`}>
          {modoJuego === 'alcoholico' ? '⚠️ MODO ALCOHÓLICO ACTIVADO' : 'RONDA ACTIVA'}
        </span>
        
        {/* Letra principal con estilo neón magenta si es modo alcohólico o rosado por defecto */}
        <h1 className={`font-title font-black mt-1 mb-2 tracking-tighter transition-all ${
          modoJuego === 'alcoholico' 
            ? 'text-[8rem] text-amber-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse' 
            : 'text-9xl text-brand-lightBg drop-shadow-[0_2px_15px_rgba(243,232,255,0.4)]'
        }`}>
          {letraActiva || 'B'}
        </h1>
        
        <p className="font-sans text-sm font-medium text-white/90">
          Escribe palabras que comiencen con: <span className={modoJuego === 'alcoholico' ? 'text-amber-500 font-bold' : 'text-brand-accent font-bold'}>{letraActiva || 'B'}</span>
        </p>
      </div>

      {/* 🟠 CUERPO: Listado de Inputs Responsivos (Diseño Original Sincronizado) */}
      <div className={`flex-grow w-full px-6 py-4 space-y-5 overflow-y-auto scrollbar-hide ${efectoBorrachera}`}>
        {camposInput.map((campo) => {
          const Icono = campo.icon;
          return (
            <div key={campo.id} className="relative w-full">
              {/* Ícono absoluto a la izquierda */}
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <Icono className={`w-5 h-5 ${modoJuego === 'alcoholico' ? 'text-amber-500/80' : 'text-brand-lightBg/50'}`} />
              </div>
              
              <input
                type="text"
                value={respuestas[campo.id]}
                onChange={(e) => handleInputChange(campo.id, e.target.value)}
                placeholder={campo.placeholder}
                disabled={inputsBloqueados}
                className={`
                  w-full h-14 pl-12 pr-4 font-sans text-base
                  border rounded-xl shadow-touch-1 focus:outline-none focus:ring-2 transition-all duration-150
                  ${modoJuego === 'alcoholico' 
                    ? 'bg-[#250d47] border-amber-500/30 text-amber-100 placeholder:text-amber-500/40 focus:ring-amber-500 focus:border-amber-500' 
                    : 'bg-brand-primary/30 border-white/5 text-white placeholder:text-white/20 focus:ring-brand-accent focus:border-brand-accent'
                  }
                  ${inputsBloqueados ? 'opacity-60 cursor-not-allowed' : ''}
                `}
              />
              
              {/* Etiqueta superior flotante cortando el borde */}
              <span className={`absolute -top-2.5 left-4 px-1.5 text-[9px] font-black uppercase tracking-widest rounded-md ${
                modoJuego === 'alcoholico' ? 'bg-[#250d47] text-amber-500 border border-amber-500/20' : 'bg-brand-darkBg text-brand-lightBg border border-white/5'
              }`}>
                {campo.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* 🔵 FOOTER: Botón circular de ¡STOP! */}
      <div className="w-full px-6 py-6 mt-auto bg-brand-darkBg border-t border-white/5">
        <button
          onClick={handleStop}
          disabled={inputsBloqueados}
          className={`
            w-full h-20 flex flex-col items-center justify-center font-title rounded-full shadow-touch-3
            transition-all duration-150 relative overflow-hidden
            ${inputsBloqueados 
                ? 'bg-red-600 text-white opacity-90 cursor-not-allowed' 
                : modoJuego === 'alcoholico'
                  ? 'bg-amber-500 text-black hover:bg-amber-400 active:scale-[0.97] animate-pulse shadow-[0_0_30px_rgba(245,158,11,0.5)]'
                  : 'bg-brand-accent text-[#0a0014] hover:bg-[#0AE8C6]/90 active:scale-[0.97] animate-pulse-vibrant shadow-[0_0_30px_rgba(10,232,198,0.4)]'
            }
          `}
        >
          {/* Cambio dinámico del texto en pánico */}
          <span className="text-2xl font-black tracking-tight">
            {inputsBloqueados ? '¡TIEMPO CORRIENDO!' : '¡STOP!'}
          </span>
          <span className="text-xs font-bold -mt-1 opacity-80 uppercase tracking-wider">
            {inputsBloqueados ? 'CONGELANDO ENTRADAS...' : 'PRESIONA AQUÍ'}
          </span>
          
          {/* Muestra la cuenta regresiva asíncrona */}
          {inputsBloqueados && segundosRestantes > 0 && (
            <span className="absolute right-8 text-3xl font-black tracking-tighter text-white animate-ping">
              {segundosRestantes}s
            </span>
          )}
        </button>
      </div>

    </div>
  );
};

export default GameActiveView;