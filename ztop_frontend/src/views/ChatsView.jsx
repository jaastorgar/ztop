import React, { useContext } from 'react';
import { 
  HiHome, HiChatBubbleLeftRight, HiPencilSquare, HiBell, HiUser, HiUserGroup
} from "react-icons/hi2";
import { SocialContext } from '../context/SocialContext';

// 🚀 RECIBIMOS 'onOpenChat' para desbloquear el clic en los amigos y abrir la conversación
const ChatsView = ({ onNavigate, onOpenChat }) => {
  // 🚀 Extraemos 'notificaciones' para el aviso de la campanita
  const { chats, notificaciones } = useContext(SocialContext); 

  return (
    // 🚀 Eliminamos "select-none" por precaución para evitar cualquier bloqueo táctil general
    <div className="w-full h-[100dvh] flex flex-col bg-brand-darkBg overflow-hidden">
      
      {/* HEADER */}
      <div className="w-full px-6 pt-10 pb-6 flex items-center justify-between border-b border-white/5">
        <h1 className="font-title text-2xl font-black tracking-widest text-white uppercase drop-shadow-md">
          MENSAJES<span className="text-brand-accent">!</span>
        </h1>
        <button 
          onClick={() => alert("Función: Crear conversación o grupo nuevo")}
          className="w-10 h-10 bg-brand-primary/40 border border-white/10 rounded-full flex items-center justify-center active:scale-95 transition-all hover:bg-brand-primary/60"
        >
          <HiPencilSquare className="w-5 h-5 text-brand-accent" />
        </button>
      </div>

      {/* LISTA DE CHATS */}
      <div className="flex-grow w-full px-6 py-6 overflow-y-auto scrollbar-hide space-y-3">
        {chats && chats.length > 0 ? (
          chats.map((chat) => (
            <div 
              key={chat.id} 
              onClick={() => onOpenChat(chat)} // 🚀 DESBLOQUEADO: Abre la sala de conversación al hacer clic
              className="w-full p-4 bg-brand-primary/20 border border-white/5 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer shadow-touch-1 hover:bg-brand-primary/40"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-brand-primary flex items-center justify-center font-title text-lg font-bold text-white border border-white/10">
                  {chat.es_grupo ? <HiUserGroup className="w-6 h-6 text-brand-accent"/> : chat.nombre_display.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="font-sans text-base font-bold text-white/90">{chat.nombre_display}</span>
                  <span className="font-sans text-xs text-white/50 truncate w-40">
                    {chat.ultimo_mensaje ? `${chat.ultimo_mensaje.autor}: ${chat.ultimo_mensaje.texto}` : 'Di hola...'}
                  </span>
                </div>
              </div>
              {chat.ultimo_mensaje && (
                <span className="font-sans text-[10px] font-bold text-white/30 uppercase">
                  {chat.ultimo_mensaje.hora}
                </span>
              )}
            </div>
          ))
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center opacity-40 space-y-3">
            <HiChatBubbleLeftRight className="w-12 h-12 text-white" />
            <p className="font-sans text-sm text-center">No tienes conversaciones activas.<br/>Agrega amigos en la campana.</p>
          </div>
        )}
      </div>

      {/* BOTTOM NAV BAR */}
      <div className="w-full h-20 bg-brand-primary/20 border-t border-white/5 px-6 flex items-center justify-between z-10 backdrop-blur-md">
        <button onClick={() => onNavigate('home')} className="flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
          <HiHome className="w-6 h-6" />
        </button>
        
        {/* Ícono de chat ACTIVO */}
        <button className="flex flex-col items-center justify-center space-y-1 text-brand-accent group">
          <HiChatBubbleLeftRight className="w-6 h-6 drop-shadow-[0_2px_8px_rgba(10,232,198,0.4)]" />
          <div className="w-1 h-1 bg-brand-accent rounded-full"></div>
        </button>
        
        <button onClick={() => alert("Sección: Configuración rápida de Grupos de Amigos")} className="flex flex-col items-center justify-center text-white/40 active:text-brand-accent active:scale-90 transition-all">
          <HiPencilSquare className="w-6 h-6" />
        </button>
        
        {/* 🚀 SOLUCIÓN DILEMA 2: Campana con aviso rojo constante en toda la app */}
        <button onClick={() => onNavigate('notificaciones')} className="relative flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
          <HiBell className="w-6 h-6" />
          {notificaciones.length > 0 && (
            <span className="absolute top-0 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-brand-darkBg"></span>
          )}
        </button>

        <button onClick={() => onNavigate('perfil')} className="flex flex-col items-center justify-center text-white/40 active:text-brand-lightBg active:scale-90 transition-all">
          <HiUser className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
};

export default ChatsView;