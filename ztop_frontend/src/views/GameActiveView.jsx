import React, { useState, useContext, useEffect } from 'react';
// 🧵 Importamos los íconos de la librería instalada (Heroicons set)
import { HiUser, HiGlobeAlt, HiPencil, HiCube, HiHandThumbUp } from "react-icons/hi2"; 
import { ZtopContext } from '../context/ZtopContext';

const GameActiveView = () => {
  // 🧠 Conectamos al contexto global incluyendo salaCodigo
  const { salaCodigo, letraActiva, presionarStop, segundosRestantes, estadoJuego } = useContext(ZtopContext);
  const token = localStorage.getItem('ztop_token'); // 🔑 Necesario para el Auto-Guardado

  // 📱 Estado local para las respuestas táctiles responsivas
  const [respuestas, setRespuestas] = useState({
    nombre: '',
    apellido: '',
    ciudadPais: '',
    animal: '',
    cosa: ''
  });

  // 🚀 SOLUCIÓN 4: Función asíncrona para guardar respuestas en PostgreSQL vía REST API
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

  // 🚨 Guardado de pánico inmediato al presionar STOP (Asegura la última letra escrita al cambiar de estado)
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

  // 🛑 Acción del botón principal turquesa ¡STOP!
  const handleStop = () => {
    // Solo permitimos presionar Stop si la ronda está activa y no está bloqueada
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
    /* 🚀 SOLUCIÓN 3: Cambia dinámicamente a bg-red-950 con una transición suave al activarse el STOP */
    <div className={`w-full h-full flex flex-col transition-colors duration-500 overflow-hidden ${estadoJuego === 'cuenta_regresiva' ? 'bg-red-950' : 'bg-brand-darkBg'}`}>
      
      {/* 🟢 HEADER: Sección de la Letra Gigante B y Ronda */}
      <div className="w-full flex flex-col items-center pt-8 pb-4">
        <span className="font-title text-sm font-light text-white/80 tracking-wide">
          Ronda Activa
        </span>
        <h1 className="font-title text-9xl font-bold text-white mt-1 mb-2 tracking-tighter">
          {letraActiva || 'B'}
        </h1>
        <p className="font-sans text-sm font-medium text-white/90">
          Escribe palabras que comiencen con: <span className="text-brand-accent font-bold">{letraActiva || 'B'}</span>
        </p>
      </div>

      {/* 🟠 CUERPO: Listado de Inputs Responsivos */}
      <div className="flex-grow w-full px-6 py-4 space-y-4 overflow-y-auto scrollbar-hide">
        {camposInput.map((campo) => {
          const Icono = campo.icon;
          return (
            <div key={campo.id} className="relative w-full">
              {/* Ícono absoluto a la izquierda */}
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <Icono className="w-5 h-5 text-brand-lightBg/80" />
              </div>
              
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
            font-title rounded-full shadow-touch-3
            transition-all duration-150 relative overflow-hidden
            ${inputsBloqueados 
                ? 'bg-red-600 text-white opacity-90 cursor-not-allowed' 
                : 'bg-brand-accent text-brand-darkBg hover:bg-brand-accent/90 active:scale-[0.97] animate-pulse-vibrant'
            }
          `}
        >
          {/* Cambio dinámico del texto en pánico */}
          <span className="text-2xl font-bold tracking-tight">
            {inputsBloqueados ? '¡TIEMPO CORRIENDO!' : '¡STOP!'}
          </span>
          <span className="text-xs font-semibold -mt-1">
            {inputsBloqueados ? 'CONGELANDO ENTRADAS...' : 'PRESIONA AQUÍ'}
          </span>
          
          {/* Muestra la cuenta regresiva de 10s asíncrona a la derecha del botón */}
          {inputsBloqueados && segundosRestantes > 0 && (
            <span className="absolute right-8 text-3xl font-bold tracking-tight text-white animate-ping">
              {segundosRestantes}s
            </span>
          )}
        </button>
      </div>

    </div>
  );
};

export default GameActiveView;