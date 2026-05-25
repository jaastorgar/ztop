import React, { useContext } from 'react';
// 🚀 Importamos los íconos limpios de Heroicons
import { HiTrophy, HiArrowRight, HiSparkles, HiUser } from "react-icons/hi2";
// 👑 Solución: Traemos la corona desde FontAwesome 6 (incluida en react-icons)
import { FaCrown } from "react-icons/fa6";
import { ZtopContext } from '../context/ZtopContext';

const PodioView = () => {
  // 🔌 Extraemos los resultados ordenados de mayor a menor puntaje desde el WebSocket
  const { resultadosRonda, siguienteRonda, salaCodigo } = useContext(ZtopContext);

  // 🥇 Separamos los 3 primeros puestos para darles un tratamiento visual destacado en el podio móvil
  const primerLugar = resultadosRonda[0];
  const segundoLugar = resultadosRonda[1];
  const tercerLugar = resultadosRonda[2];
  
  // 📋 El resto de competidores del cuarto lugar hacia abajo
  const restoCompetidores = resultadosRonda.slice(3);

  return (
    <div className="w-full h-full flex flex-col bg-brand-darkBg px-6 py-6 overflow-hidden justify-between">
      
      {/* 👑 TOP: Banner de Celebración de la Sala */}
      <div className="w-full text-center pt-4 pb-2 space-y-1">
        <div className="inline-flex items-center justify-center space-x-2 bg-brand-primary/40 px-4 py-1.5 rounded-full border border-white/5">
          <HiSparkles className="w-4 h-4 text-brand-accent animate-spin" style={{ animationDuration: '3s' }} />
          <span className="font-sans text-xs font-semibold uppercase tracking-widest text-brand-lightBg">
            Partida Terminada
          </span>
          <HiSparkles className="w-4 h-4 text-brand-accent animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <h1 className="font-title text-3xl font-bold text-white mt-2">
          Podio de Campeones
        </h1>
        <p className="font-sans text-xs text-white/50">
          Resultados finales acumulados • Sala <span className="text-brand-accent font-bold tracking-wider">{salaCodigo}</span>
        </p>
      </div>

      {/* 🏆 CENTER 1: Estructura Gráfica del TOP 3 Adaptada a Pantallas Móviles */}
      <div className="w-full grid grid-cols-3 items-end gap-2 pt-6 pb-4 px-2 relative">
        
        {/* 🥈 SEGUNDO LUGAR (Izquierda) */}
        {segundoLugar ? (
          <div className="flex flex-col items-center space-y-2 animate-fade-in">
            <div className="text-center">
              <span className="font-sans text-xs font-medium text-white/80 block truncate max-w-[80px]">
                {segundoLugar.jugador}
              </span>
              <span className="font-title text-xs font-bold text-slate-300">
                {segundoLugar.puntaje_total_acumulado} pts
              </span>
            </div>
            {/* Columna física del podio */}
            <div className="w-full h-24 bg-gradient-to-t from-brand-primary to-slate-400/30 rounded-t-2xl flex flex-col items-center justify-center border-t border-slate-300/40 shadow-touch-2">
              <span className="font-title text-3xl font-bold text-slate-300">2</span>
              <span className="font-sans text-xxs font-semibold uppercase tracking-wider text-slate-300/60">Puesto</span>
            </div>
          </div>
        ) : (
          <div className="h-1"></div>
        )}

        {/* 🥇 PRIMER LUGAR (Centro - Destacado) */}
        {primerLugar ? (
          <div className="flex flex-col items-center space-y-2 relative -top-3 z-10 animate-fade-in">
            {/* 👑 CORREGIDO: Usamos FaCrown con las mismas clases de animación y sombra turquesa */}
            <FaCrown className="w-8 h-8 text-brand-accent drop-shadow-[0_4px_10px_rgba(10,232,198,0.5)] animate-bounce" />
            <div className="text-center">
              <span className="font-sans text-sm font-bold text-white block truncate max-w-[95px]">
                {primerLugar.jugador}
              </span>
              <span className="font-title text-sm font-black text-brand-accent">
                {primerLugar.puntaje_total_acumulado} pts
              </span>
            </div>
            {/* Columna central más alta */}
            <div className="w-full h-32 bg-gradient-to-t from-brand-primary to-brand-accent/20 rounded-t-2xl flex flex-col items-center justify-center border-t-2 border-brand-accent shadow-touch-3">
              <HiTrophy className="w-7 h-7 text-brand-accent mb-1 drop-shadow-[0_2px_8px_rgba(10,232,198,0.3)]" />
              <span className="font-title text-4xl font-black text-white">1</span>
            </div>
          </div>
        ) : (
          <div className="h-1"></div>
        )}

        {/* 🥉 TERCER LUGAR (Derecha) */}
        {tercerLugar ? (
          <div className="flex flex-col items-center space-y-2 animate-fade-in">
            <div className="text-center">
              <span className="font-sans text-xs font-medium text-white/80 block truncate max-w-[80px]">
                {tercerLugar.jugador}
              </span>
              <span className="font-title text-xs font-bold text-amber-600">
                {tercerLugar.puntaje_total_acumulado} pts
              </span>
            </div>
            {/* Columna física del podio */}
            <div className="w-full h-18 bg-gradient-to-t from-brand-primary to-amber-700/30 rounded-t-2xl flex flex-col items-center justify-center border-t border-amber-600/40 shadow-touch-2">
              <span className="font-title text-2xl font-bold text-amber-600">3</span>
              <span className="font-sans text-xxs font-semibold uppercase tracking-wider text-amber-600/60">Puesto</span>
            </div>
          </div>
        ) : (
          <div className="h-1"></div>
        )}

      </div>

      {/* 📜 CENTER 2: Tabla de Clasificación para el resto de Jugadores (#4 hacia abajo) */}
      <div className="flex-grow w-full py-2 flex flex-col space-y-2 overflow-y-auto max-h-[180px] scrollbar-hide">
        {restoCompetidores.length > 0 && (
          <div className="w-full space-y-2">
            {restoCompetidores.map((item, idx) => (
              <div 
                key={idx} 
                className="w-full h-12 bg-brand-primary/40 px-4 rounded-xl flex items-center justify-between border border-white/5 shadow-touch-1"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-title text-xs font-semibold text-white/40 w-5">
                    #{idx + 4}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center">
                    <HiUser className="w-3.5 h-3.5 text-brand-lightBg/60" />
                  </div>
                  <span className="font-sans text-sm font-medium text-white/90">
                    {item.jugador}
                  </span>
                </div>
                <span className="font-title text-sm font-bold text-brand-lightBg">
                  {item.puntaje_total_acumulado} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🏁 BOTTOM: Acción de Cierre / Regresar al Lobby para Jugar de Nuevo */}
      <div className="w-full pt-4">
        <button
          onClick={siguienteRonda} // Reinicia la máquina de estados distribuidamente a 'esperando'
          className="w-full h-16 bg-brand-accent text-brand-darkBg font-title text-lg font-bold rounded-2xl shadow-touch-3 hover:bg-brand-accent/90 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
        >
          <span>JUGAR OTRA PARTIDA</span>
          <HiArrowRight className="w-5 h-5 stroke-[2]" />
        </button>
        <p className="text-center font-sans text-xxs text-white/30 mt-3 tracking-wide uppercase">
          ztop! © 2026 • Inmediatez Táctil Garantizada
        </p>
      </div>

    </div>
  );
};

export default PodioView;