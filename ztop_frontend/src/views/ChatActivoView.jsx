import React, { useState, useEffect, useContext, useRef } from 'react';
import { HiArrowLeft, HiPaperAirplane, HiUserGroup } from "react-icons/hi2";
import { SocialContext } from '../context/SocialContext';

const ChatActivoView = ({ chat, onBack }) => {
  const { chats, enviarMensaje, usuariosOnline, isConnected } = useContext(SocialContext);
  
  const [msgInput, setMsgInput] = useState('');
  const [historial, setHistorial] = useState([]);
  
  const miUsername = localStorage.getItem('ztop_username') || 'jugador';
  const token = localStorage.getItem('ztop_token');
  
  const chatEndRef = useRef(null);
  const lastProcessedMsg = useRef(null);

  // 🔍 Obtenemos la versión más reciente del chat desde el contexto
  const chatActualizado = chats.find(c => c.id.toString() === chat.id.toString()) || chat;
  
  // 📡 Leemos el radar en tiempo real para saber si el amigo está online
  const amigoEstaOnline = !chatActualizado.es_grupo && usuariosOnline[chatActualizado.nombre_display];

  // 1. 📥 Cargar historial guardado en PostgreSQL al abrir el chat
  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const res = await fetch(`http://192.168.18.199:8000/api/social/chats/${chat.id}/mensajes/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        if (res.ok) setHistorial(await res.json());
      } catch (err) {
        console.error("Error al cargar historial:", err);
      }
    };
    if (token && chat.id) cargarHistorial();
  }, [chat.id, token]);

  // 2. 🔄 Sincronizador en tiempo real con Hash único anti-duplicados
  useEffect(() => {
    if (chatActualizado?.ultimo_mensaje) {
      const ultimo = chatActualizado.ultimo_mensaje;
      const msgKey = `${ultimo.autor}-${ultimo.hora}-${ultimo.texto}`;
      
      if (ultimo.autor !== miUsername && lastProcessedMsg.current !== msgKey) {
        lastProcessedMsg.current = msgKey;
        
        setHistorial(prev => {
          const yaExiste = prev.some(m => m.texto === ultimo.texto && m.hora === ultimo.hora && m.autor === ultimo.autor);
          if (!yaExiste) {
            return [...prev, {
              id: Date.now() + Math.random(),
              autor: ultimo.autor, 
              texto: ultimo.texto, 
              hora: ultimo.hora
            }];
          }
          return prev;
        });
      }
    }
  }, [chatActualizado?.ultimo_mensaje, miUsername]);

  // 3. 📜 Auto-Scroll siempre hacia abajo al recibir/enviar mensaje
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [historial]);

  // 4. 🚀 Enviar Mensaje (Actualización Optimista)
  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!msgInput.trim()) return;

    enviarMensaje(chat.id, msgInput.trim());

    const nuevoMsgLocal = {
      id: Date.now(),
      autor: miUsername,
      texto: msgInput.trim(),
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setHistorial(prev => [...prev, nuevoMsgLocal]);
    setMsgInput('');
  };

  return (
    // 🚀 Eliminado el "select-none" para desbloquear el teclado móvil
    <div className="w-full h-[100dvh] flex flex-col bg-brand-darkBg overflow-hidden">
      
      {/* 🔝 HEADER DEL CHAT */}
      <div className="w-full px-6 pt-10 pb-4 flex items-center justify-between border-b border-white/5 bg-brand-primary/20 backdrop-blur-md z-10 shadow-md">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2.5 bg-brand-primary/40 rounded-xl text-white/80 active:scale-95 transition-all border border-white/5">
            <HiArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center font-title font-bold text-white border border-white/10 text-sm shadow-inner">
              {chatActualizado.es_grupo ? <HiUserGroup className="w-5 h-5 text-brand-accent" /> : chatActualizado.nombre_display.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-sm font-bold text-white tracking-wide">
                {chatActualizado.nombre_display}
              </span>
              
              {/* 🟢 INDICADOR DE ESTADO EN LÍNEA */}
              {!chatActualizado.es_grupo ? (
                <span className={`font-sans text-[10px] flex items-center font-medium ${amigoEstaOnline ? 'text-emerald-400' : 'text-white/40'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${amigoEstaOnline ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`}></span>
                  {isConnected ? (amigoEstaOnline ? 'En línea' : 'Desconectado') : 'Conectando túnel...'}
                </span>
              ) : (
                <span className="font-sans text-[10px] flex items-center font-medium text-brand-accent">
                  Grupo de chat
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 💬 ÁREA DE CONVERSACIÓN SCROLLABLE */}
      <div className="flex-grow w-full px-6 py-6 overflow-y-auto scrollbar-hide space-y-4 bg-brand-darkBg">
        {historial.map((msg) => {
          const esMio = msg.autor === miUsername;
          return (
            <div key={msg.id} className={`w-full flex ${esMio ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`max-w-[78%] p-3.5 rounded-2xl flex flex-col space-y-1 shadow-touch-1 ${
                esMio 
                  ? 'bg-brand-secondary text-white rounded-br-none border border-brand-accent/20'
                  : 'bg-brand-primary/20 text-white/90 rounded-bl-none border border-white/5'
              }`}>
                {!esMio && chatActualizado.es_grupo && (
                  <span className="font-sans text-[10px] font-black text-brand-accent mb-0.5 tracking-wide">@{msg.autor}</span>
                )}
                <p className="font-sans text-sm tracking-wide leading-relaxed break-words font-medium">{msg.texto}</p>
                <span className={`font-sans text-[9px] text-right self-end font-bold uppercase mt-1 ${esMio ? 'text-brand-accent/60' : 'text-white/20'}`}>
                  {msg.hora}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* ⌨️ BARRA INFERIOR DE ESCRITURA */}
      <form onSubmit={handleSend} className="w-full px-4 py-4 bg-brand-primary/20 border-t border-white/5 flex items-center space-x-3 z-10 backdrop-blur-md mt-auto shadow-touch-2">
        <input
          type="text"
          value={msgInput}
          onChange={(e) => setMsgInput(e.target.value)}
          placeholder="Escribe un mensaje táctil..."
          className="flex-grow h-12 px-4 bg-brand-primary/10 border border-white/10 text-white font-sans text-sm rounded-xl focus:outline-none focus:border-brand-accent transition-all placeholder:text-white/20 shadow-inner"
        />
        <button type="submit" className="w-12 h-12 bg-brand-secondary text-brand-accent rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-md border border-brand-accent/20">
          <HiPaperAirplane className="w-5 h-5 rotate-[315deg] -mt-0.5 -ml-0.5" />
        </button>
      </form>

    </div>
  );
};

export default ChatActivoView;