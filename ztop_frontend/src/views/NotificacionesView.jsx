import React, { useContext, useState } from 'react';
import { 
  HiHome, HiChatBubbleLeftRight, HiPencilSquare, HiBell, HiUser, HiMagnifyingGlass, HiUserPlus, HiCheck, HiXMark
} from "react-icons/hi2";
import { SocialContext } from '../context/SocialContext';

const NotificacionesView = ({ onNavigate }) => {
  const { notificaciones, resultadosBusqueda, buscarUsuarios, enviarSolicitud } = useContext(SocialContext);
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    setQuery(e.target.value);
    buscarUsuarios(e.target.value);
  };

  return (
    <div className="w-full h-[100dvh] flex flex-col bg-brand-darkBg overflow-hidden select-none">
      
      {/* HEADER */}
      <div className="w-full px-6 pt-10 pb-6 flex items-center justify-between border-b border-white/5">
        <h1 className="font-title text-2xl font-black tracking-widest text-white uppercase drop-shadow-md">
          AMIGOS<span className="text-brand-accent">!</span>
        </h1>
      </div>

      <div className="flex-grow w-full overflow-y-auto scrollbar-hide">
        
        {/* SECCIÓN BUSCADOR */}
        <div className="px-6 py-6 border-b border-white/5">
          <div className="relative w-full mb-4">
            <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              type="text"
              placeholder="Buscar por username..."
              value={query}
              onChange={handleSearch}
              className="w-full h-14 pl-12 pr-4 bg-brand-primary/20 border border-white/10 text-white font-sans text-sm font-medium rounded-xl focus:outline-none focus:border-brand-accent transition-all placeholder:text-white/30 shadow-inner"
            />
          </div>

          {/* Resultados de Búsqueda */}
          {resultadosBusqueda.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-title text-xs font-bold uppercase tracking-wider text-white/50">Resultados</h3>
              {resultadosBusqueda.map(user => (
                <div key={user.id} className="w-full h-14 bg-brand-primary/40 px-4 rounded-xl flex items-center justify-between border border-white/5">
                  <span className="font-sans text-sm font-bold text-white/90">@{user.username}</span>
                  <button 
                    onClick={() => enviarSolicitud(user.username)}
                    className="p-2 bg-brand-accent/20 rounded-lg text-brand-accent hover:bg-brand-accent hover:text-brand-darkBg transition-all"
                  >
                    <HiUserPlus className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECCIÓN SOLICITUDES PENDIENTES */}
        <div className="px-6 py-6 space-y-4">
          <h3 className="font-title text-xs font-bold uppercase tracking-wider text-white/50 flex items-center">
            Solicitudes Recibidas
            {notificaciones.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{notificaciones.length}</span>
            )}
          </h3>
          
          {notificaciones.length === 0 ? (
            <p className="text-white/30 text-xs font-sans text-center py-4">No tienes solicitudes nuevas.</p>
          ) : (
            notificaciones.map((notif, idx) => (
              <div key={idx} className="w-full p-4 bg-[#150726] border border-white/10 rounded-xl flex items-center justify-between shadow-md">
                <span className="font-sans text-sm font-bold text-white/90">@{notif.emisor_detalle?.username || notif.de}</span>
                <div className="flex space-x-2">
                  <button className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all">
                    <HiCheck className="w-5 h-5" />
                  </button>
                  <button className="w-10 h-10 bg-red-500/20 text-red-400 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                    <HiXMark className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* BOTTOM NAV BAR */}
      <div className="w-full h-20 bg-brand-primary/20 border-t border-white/5 px-6 flex items-center justify-between z-10 backdrop-blur-md">
        <button onClick={() => onNavigate('home')} className="flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
          <HiHome className="w-6 h-6" />
        </button>
        <button onClick={() => onNavigate('chats')} className="flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
          <HiChatBubbleLeftRight className="w-6 h-6" />
        </button>
        <button className="flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
          <HiPencilSquare className="w-6 h-6" />
        </button>
        {/* Ícono de Campana ACTIVO */}
        <button className="flex flex-col items-center justify-center space-y-1 text-brand-accent group">
          <HiBell className="w-6 h-6 drop-shadow-[0_2px_8px_rgba(10,232,198,0.4)]" />
          <div className="w-1 h-1 bg-brand-accent rounded-full"></div>
        </button>
        <button onClick={() => onNavigate('perfil')} className="flex flex-col items-center justify-center text-white/40 active:text-brand-lightBg active:scale-90 transition-all">
          <HiUser className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
};

export default NotificacionesView;