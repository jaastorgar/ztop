import React, { useContext, useState } from 'react';
import { 
  HiHome, HiChatBubbleLeftRight, HiPencilSquare, HiBell, HiUser, HiMagnifyingGlass, HiUserPlus, HiCheck, HiXMark
} from "react-icons/hi2";
import { SocialContext } from '../context/SocialContext';

const NotificacionesView = ({ onNavigate }) => {
  const { 
    notificaciones, 
    setNotificaciones, 
    cargarDatosSociales, 
    resultadosBusqueda, 
    buscarUsuarios, 
    enviarSolicitud 
  } = useContext(SocialContext);
  
  const [query, setQuery] = useState('');
  
  // 🚀 ESTADO PARA FEEDBACK VISUAL INMEDIATO (Optimistic UI)
  const [enviadas, setEnviadas] = useState(new Set()); 

  const handleSearch = (e) => {
    setQuery(e.target.value);
    buscarUsuarios(e.target.value);
  };

  // 1️⃣ Manejador para enviar solicitud y mostrar el "Visto Bueno"
  const handleAddFriend = (username) => {
    enviarSolicitud(username);
    // 🚀 SOLUCIÓN DILEMA 1: Clonamos el Set correctamente para forzar la animación de UI
    setEnviadas(prev => {
      const nuevoSet = new Set(prev);
      nuevoSet.add(username);
      return nuevoSet;
    }); 
  };

  // 2️⃣ Manejador para aceptar/rechazar e interactuar con la API REST
  const handleResponder = async (solicitudId, accion) => {
    // 🚀 OPTIMISTIC UI: Lo ocultamos inmediatamente de la pantalla para dar sensación de rapidez
    setNotificaciones(prev => prev.filter(n => n.id !== solicitudId));

    const token = localStorage.getItem('ztop_token');
    try {
      const res = await fetch(`http://192.168.18.199:8000/api/social/solicitud/${solicitudId}/responder/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ accion })
      });

      // 🚀 Si aceptamos, recargamos la BD para que el chat aparezca en la pestaña de mensajes
      if (res.ok && accion === 'aceptar') {
        cargarDatosSociales();
      }
    } catch (err) {
      console.error(`Error al ${accion} la solicitud:`, err);
    }
  };

  return (
    // 🚀 SOLUCIÓN DILEMA 3: Eliminamos "select-none" para no bloquear teclados móviles
    <div className="w-full h-[100dvh] flex flex-col bg-brand-darkBg overflow-hidden">
      
      {/* HEADER */}
      <div className="w-full px-6 pt-10 pb-6 flex items-center justify-between border-b border-white/5">
        <h1 className="font-title text-2xl font-black tracking-widest text-white uppercase drop-shadow-md">
          AMIGOS<span className="text-brand-accent">!</span>
        </h1>
      </div>

      <div className="flex-grow w-full overflow-y-auto scrollbar-hide">
        
        {/* SECCIÓN BUSCADOR */}
        <div className="px-6 py-6 border-b border-white/5">
          <div className="relative w-full mb-6">
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
              <h3 className="font-title text-[10px] font-bold uppercase tracking-widest text-white/50 mb-3">Resultados</h3>
              {resultadosBusqueda.map(user => {
                const yaEnviada = enviadas.has(user.username);
                return (
                  <div key={user.id} className="w-full h-16 bg-[#1a0b2e]/60 px-5 rounded-xl flex items-center justify-between border border-white/5 shadow-touch-1">
                    <span className="font-sans text-sm font-bold text-white">@{user.username}</span>
                    <button 
                      onClick={() => !yaEnviada && handleAddFriend(user.username)}
                      disabled={yaEnviada}
                      className={`p-2 transition-all flex items-center justify-center ${
                        yaEnviada 
                          ? 'text-emerald-400 scale-110' // Visto bueno verde
                          : 'text-brand-accent/80 hover:text-brand-accent hover:scale-110 bg-brand-accent/10 rounded-lg' 
                      }`}
                    >
                      {yaEnviada ? <HiCheck className="w-6 h-6" /> : <HiUserPlus className="w-5 h-5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECCIÓN SOLICITUDES PENDIENTES */}
        <div className="px-6 py-6 space-y-4">
          <h3 className="font-title text-[10px] font-bold uppercase tracking-widest text-white/50 flex items-center mb-3">
            Solicitudes Recibidas
            {notificaciones.length > 0 && (
              <span className="ml-3 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{notificaciones.length}</span>
            )}
          </h3>
          
          {notificaciones.length === 0 ? (
            <p className="text-white/30 text-xs font-sans text-center py-4">No tienes solicitudes nuevas.</p>
          ) : (
            notificaciones.map((notif) => (
              <div key={notif.id} className="w-full p-4 bg-[#150726] border border-white/10 rounded-xl flex items-center justify-between shadow-md">
                <span className="font-sans text-sm font-bold text-white">
                  @{notif.emisor_detalle?.username || notif.de}
                </span>
                
                {/* 🚀 BOTONES DE ACEPTAR / RECHAZAR */}
                <div className="flex space-x-3">
                  <button 
                    onClick={() => handleResponder(notif.id, 'aceptar')}
                    className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center active:scale-95 transition-all hover:bg-emerald-500 hover:text-white"
                  >
                    <HiCheck className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleResponder(notif.id, 'rechazar')}
                    className="w-10 h-10 bg-red-500/20 text-red-400 rounded-lg flex items-center justify-center active:scale-95 transition-all hover:bg-red-500 hover:text-white"
                  >
                    <HiXMark className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* BOTTOM NAV BAR */}
      <div className="w-full h-20 bg-brand-primary/20 border-t border-white/5 px-6 flex items-center justify-between z-10 backdrop-blur-md mt-auto">
        <button onClick={() => onNavigate('home')} className="flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
          <HiHome className="w-6 h-6" />
        </button>
        <button onClick={() => onNavigate('chats')} className="flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
          <HiChatBubbleLeftRight className="w-6 h-6" />
        </button>
        <button className="flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
          <HiPencilSquare className="w-6 h-6" />
        </button>
        
        {/* 🚀 SOLUCIÓN DILEMA 2: Ícono de Campana ACTIVO con Punto Rojo Dinámico */}
        <button className="relative flex flex-col items-center justify-center space-y-1 text-white group">
          <HiBell className="w-6 h-6 drop-shadow-[0_2px_10px_rgba(255,255,255,0.6)]" />
          <div className="w-1 h-1 bg-white rounded-full"></div>
          {notificaciones.length > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-brand-darkBg"></span>
          )}
        </button>

        <button onClick={() => onNavigate('perfil')} className="flex flex-col items-center justify-center text-white/40 active:text-brand-lightBg active:scale-90 transition-all">
          <HiUser className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
};

export default NotificacionesView;