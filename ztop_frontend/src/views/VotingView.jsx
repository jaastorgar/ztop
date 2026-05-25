import React, { useState, useContext } from 'react';
import { HiCheck, HiXMark, HiTrophy, HiListBullet, HiArrowRight } from "react-icons/hi2";
import { ZtopContext } from '../context/ZtopContext';

const VotingView = () => {
  // 🧠 Extraemos los datos calculados por el WebSocket de Django Channels
  const { resultadosRonda, siguienteRonda, salaCodigo } = useContext(ZtopContext);

  // 📱 Estados locales para la navegación táctil interna
  const [categoriaActiva, setCategoriaActiva] = useState('nombre'); // nombre | apellido | ciudad_pais | animal | cosa
  const [verPodioGlobal, setVerPodioGlobal] = useState(false); // Alternar entre revisión e historial total

  // Categorías mapeadas con sus etiquetas legibles para la UI móvil
  const categorias = [
    { id: 'nombre', label: 'Nombre' },
    { id: 'apellido', label: 'Apellido' },
    { id: 'ciudad_pais', label: 'Ciudad / País' },
    { id: 'animal', label: 'Animal' },
    { id: 'cosa', label: 'Cosa' }
  ];

  // Helper para pintar el tipo de badge según los puntos calculados por el backend
  const renderPuntajeBadge = (pts) => {
    if (pts === 100) {
      return (
        <span className="h-7 px-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold rounded-full flex items-center justify-center space-x-1">
          <HiCheck className="w-3.5 h-3.5" />
          <span>+100 pts</span>
        </span>
      );
    } else if (pts === 50) {
      return (
        <span className="h-7 px-3 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold rounded-full flex items-center justify-center space-x-1">
          <span>Repetido</span>
          <span className="opacity-80">+50</span>
        </span>
      );
    } else {
      return (
        <span className="h-7 px-3 bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold rounded-full flex items-center justify-center space-x-1">
          <HiXMark className="w-3.5 h-3.5" />
          <span>0 pts</span>
        </span>
      );
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-brand-darkBg overflow-hidden justify-between">
      
      {/* 🔝 HEADER: Selector de Modo (Revisión de Palabras vs Podio Acumulado) */}
      <div className="w-full px-6 pt-6 pb-2 flex flex-col items-center space-y-4">
        <div className="w-full bg-brand-primary/40 p-1.5 rounded-2xl flex border border-white/5">
          <button
            onClick={() => setVerPodioGlobal(false)}
            className={`flex-1 h-11 rounded-xl font-sans text-sm font-semibold flex items-center justify-center space-x-2 transition-all ${!verPodioGlobal ? 'bg-brand-secondary text-white shadow-touch-1' : 'text-white/60'}`}
          >
            <HiListBullet className="w-4 h-4" />
            <span>Respuestas</span>
          </button>
          <button
            onClick={() => setVerPodioGlobal(true)}
            className={`flex-1 h-11 rounded-xl font-sans text-sm font-semibold flex items-center justify-center space-x-2 transition-all ${verPodioGlobal ? 'bg-brand-secondary text-white shadow-touch-1' : 'text-white/60'}`}
          >
            <HiTrophy className="w-4 h-4" />
            <span>Tabla Global</span>
          </button>
        </div>
      </div>

      {/* 📑 SUB-MODULO A: Vista de Revisión Categoría por Categoría */}
      {!verPodioGlobal ? (
        <>
          {/* Barra deslizable horizontal de categorías */}
          <div className="w-full flex px-6 space-x-2 overflow-x-auto scrollbar-hide py-2 border-b border-white/5">
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoriaActiva(cat.id)}
                className={`h-10 px-5 rounded-full font-sans text-xs font-medium uppercase tracking-wider flex-shrink-0 border transition-all ${categoriaActiva === cat.id ? 'bg-brand-accent text-brand-darkBg border-brand-accent font-bold' : 'bg-brand-primary/30 text-white/70 border-white/5'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Listado vertical de lo que escribió cada jugador en la categoría activa */}
          <div className="flex-grow w-full px-6 py-4 space-y-3 overflow-y-auto">
            {resultadosRonda && resultadosRonda.map((item, idx) => {
              // Extraemos de forma segura el nodo calculado por el backend
              const dataCat = item.detalles?.[categoriaActiva] || { valor: '-', pts: 0 };
              
              return (
                <div 
                  key={idx} 
                  className="w-full p-4 bg-brand-primary rounded-2xl flex items-center justify-between border border-white/5 shadow-touch-1 animate-fade-in"
                >
                  <div className="flex flex-col space-y-1">
                    <span className="font-sans text-xs text-white/50">
                      @{item.jugador}
                    </span>
                    <span className="font-title text-lg font-bold text-white tracking-wide">
                      {dataCat.valor || '-'}
                    </span>
                  </div>
                  {renderPuntajeBadge(dataCat.pts)}
                </div>
              );
            })}
          </div>
        </>
      ) : (

        // 🏆 SUB-MODULO B: Podio Acumulado de la Sala en Tiempo Real
        <div className="flex-grow w-full px-6 py-4 space-y-4 overflow-y-auto">
          <div className="text-center py-2">
            <h2 className="font-title text-xl font-bold text-white">Posiciones Globales</h2>
            <p className="font-sans text-xs text-white/50 mt-1">Puntaje total acumulado en la sala {salaCodigo}</p>
          </div>

          <div className="space-y-3">
            {resultadosRonda && resultadosRonda.map((item, idx) => (
              <div 
                key={idx} 
                className="w-full h-16 bg-brand-primary/70 px-4 rounded-2xl flex items-center justify-between border border-white/5"
              >
                <div className="flex items-center space-x-4">
                  {/* Medalla o número de posición */}
                  <div className={`w-8 h-8 rounded-xl font-title text-sm font-bold flex items-center justify-center ${idx === 0 ? 'bg-amber-400 text-brand-darkBg' : idx === 1 ? 'bg-slate-300 text-brand-darkBg' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-brand-primary text-white/40'}`}>
                    #{idx + 1}
                  </div>
                  <span className="font-sans text-base font-semibold text-white">
                    {item.jugador}
                  </span>
                </div>
                <div className="text-right">
                  {/* Puntos de la última ronda + historial global */}
                  <span className="font-title text-base font-bold text-brand-accent block">
                    {item.puntaje_total_acumulado} pts
                  </span>
                  <span className="font-sans text-xxs text-white/40 block">
                    +{item.total_ronda} esta ronda
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🏁 BOTTOM: Lanzador de Siguiente Ronda (Acción del Creador) */}
      <div className="w-full px-6 py-6 border-t border-white/5 bg-brand-darkBg">
        <button
          onClick={siguienteRonda}
          className="w-full h-16 bg-brand-accent text-brand-darkBg font-title text-lg font-bold rounded-2xl shadow-touch-3 hover:bg-brand-accent/90 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
        >
          <span>LISTO - SIGUIENTE RONDA</span>
          <HiArrowRight className="w-5 h-5 stroke-[2]" />
        </button>
      </div>

    </div>
  );
};

export default VotingView;