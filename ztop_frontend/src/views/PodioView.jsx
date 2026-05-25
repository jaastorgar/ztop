import React, { useContext, useEffect, useState } from 'react';
import { ZtopContext } from '../context/ZtopContext'; // Asegúrate de que este sea tu contexto activo
import { HiTrophy, HiArrowRight, HiSparkles, HiUser } from "react-icons/hi2";
import { FaCrown } from "react-icons/fa6";

const PodioView = ({ onReplay }) => {
  // Obtenemos los resultados enviados por el WebSocket desde el contexto
  const { resultadosRonda, salaCodigo, siguienteRonda } = useContext(ZtopContext);
  
  // Estado local para resultados ordenados y empate
  const [ordenados, setOrdenados] = useState([]);
  const [hayEmpate, setHayEmpate] = useState(false);

  useEffect(() => {
    if (resultadosRonda && resultadosRonda.length > 0) {
      // 1. Ordenar por puntos de la RONDA (total_ronda), no los acumulados
      const sorted = [...resultadosRonda].sort((a, b) => b.total_ronda - a.total_ronda);
      setOrdenados(sorted);

      // 2. Detectar empate en el primer lugar
      if (sorted.length >= 2) {
        if (sorted[0].total_ronda === sorted[1].total_ronda) {
          setHayEmpate(true);
        } else {
          setHayEmpate(false);
        }
      }
    }
  }, [resultadosRonda]);

  const primerLugar = ordenados[0];
  const segundoLugar = ordenados[1];
  const tercerLugar = ordenados[2];
  const restoCompetidores = ordenados.slice(3);

  return (
    <div className="w-full h-full flex flex-col bg-brand-darkBg px-6 py-6 overflow-hidden justify-between relative">
      
      {/* 🏆 BANNER DE EMPATE (Aparece solo si hay empate) */}
      {hayEmpate && (
        <div className="absolute top-0 left-0 w-full bg-amber-500/20 border-b border-amber-500/50 p-2 text-center animate-pulse z-20">
          <span className="text-amber-400 font-bold text-sm uppercase tracking-widest">
            🤝 ¡Empate Técnico! 🤝
          </span>
        </div>
      )}

      {/* 👑 TOP: Header de Celebración */}
      <div className="w-full text-center pt-4 pb-2 space-y-1 z-10">
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
          Sala <span className="text-brand-accent font-bold tracking-wider">{salaCodigo}</span>
        </p>
      </div>

      {/* 🏆 CENTER 1: Podio Top 3 */}
      <div className="w-full grid grid-cols-3 items-end gap-2 pt-6 pb-4 px-2 relative z-10">
        
        {/*  SEGUNDO LUGAR */}
        {segundoLugar ? (
          <div className="flex flex-col items-center space-y-2 animate-fade-in">
            <div className="text-center">
              <span className="font-sans text-xs font-medium text-white/80 block truncate max-w-[80px]">
                {segundoLugar.jugador}
              </span>
              <span className="font-title text-xs font-bold text-slate-300">
                {segundoLugar.total_ronda} pts
              </span>
            </div>
            <div className="w-full h-24 bg-gradient-to-t from-brand-primary to-slate-400/30 rounded-t-2xl flex flex-col items-center justify-center border-t border-slate-300/40 shadow-touch-2">
              <span className="font-title text-3xl font-bold text-slate-300">2</span>
              <span className="font-sans text-xxs font-semibold uppercase tracking-wider text-slate-300/60">Puesto</span>
            </div>
          </div>
        ) : <div className="h-1"></div>}

        {/* 🥇 PRIMER LUGAR */}
        {primerLugar ? (
          <div className="flex flex-col items-center space-y-2 relative -top-3 z-10 animate-fade-in">
            <FaCrown className="w-8 h-8 text-brand-accent drop-shadow-[0_4px_10px_rgba(10,232,198,0.5)] animate-bounce" />
            <div className="text-center">
              <span className="font-sans text-sm font-bold text-white block truncate max-w-[95px]">
                {primerLugar.jugador}
              </span>
              <span className="font-title text-sm font-black text-brand-accent">
                {primerLugar.total_ronda} pts
              </span>
            </div>
            <div className="w-full h-32 bg-gradient-to-t from-brand-primary to-brand-accent/20 rounded-t-2xl flex flex-col items-center justify-center border-t-2 border-brand-accent shadow-touch-3">
              <HiTrophy className="w-7 h-7 text-brand-accent mb-1 drop-shadow-[0_2px_8px_rgba(10,232,198,0.3)]" />
              <span className="font-title text-4xl font-black text-white">1</span>
            </div>
          </div>
        ) : <div className="h-1"></div>}

        {/* 🥉 TERCER LUGAR */}
        {tercerLugar ? (
          <div className="flex flex-col items-center space-y-2 animate-fade-in">
            <div className="text-center">
              <span className="font-sans text-xs font-medium text-white/80 block truncate max-w-[80px]">
                {tercerLugar.jugador}
              </span>
              <span className="font-title text-xs font-bold text-amber-600">
                {tercerLugar.total_ronda} pts
              </span>
            </div>
            <div className="w-full h-18 bg-gradient-to-t from-brand-primary to-amber-700/30 rounded-t-2xl flex flex-col items-center justify-center border-t border-amber-600/40 shadow-touch-2">
              <span className="font-title text-2xl font-bold text-amber-600">3</span>
              <span className="font-sans text-xxs font-semibold uppercase tracking-wider text-amber-600/60">Puesto</span>
            </div>
          </div>
        ) : <div className="h-1"></div>}

      </div>

      {/* 📜 Resto de Jugadores */}
      <div className="flex-grow w-full py-2 flex flex-col space-y-2 overflow-y-auto max-h-[180px] scrollbar-hide z-10">
        {restoCompetidores.length > 0 && (
          <div className="w-full space-y-2">
            {restoCompetidores.map((item, idx) => (
              <div 
                key={idx} 
                className="w-full h-12 bg-brand-primary/40 px-4 rounded-xl flex items-center justify-between border border-white/5 shadow-touch-1"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-title text-xs font-semibold text-white/40 w-5">#{idx + 4}</span>
                  <div className="w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center">
                    <HiUser className="w-3.5 h-3.5 text-brand-lightBg/60" />
                  </div>
                  <span className="font-sans text-sm font-medium text-white/90">{item.jugador}</span>
                </div>
                <span className="font-title text-sm font-bold text-brand-lightBg">{item.total_ronda} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/*  Botón Siguiente Ronda */}
      <div className="w-full pt-4 z-10">
        <button
          onClick={siguienteRonda || onReplay} 
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