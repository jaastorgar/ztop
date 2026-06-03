import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';

export const SocialContext = createContext(null);

export const SocialProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const socketRef = useRef(null);
  const token = localStorage.getItem('ztop_token'); // 🔑 Tu token de autenticación

  // 1. 🌐 CONECTAR AL TÚNEL SOCIAL
  const conectarSocialWS = useCallback(() => {
    if (!token) return;
    if (socketRef.current) socketRef.current.close();

    const wsUrl = `ws://192.168.18.199:8000/ws/social/?token=${token}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('🟢 [SOCIAL] Conectado al ecosistema en tiempo real.');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.status) {
          case 'nuevo_mensaje':
            // Actualiza la lista de chats con el nuevo mensaje al instante
            setChats(prevChats => prevChats.map(chat => 
              chat.id === data.chat_id 
                ? { ...chat, ultimo_mensaje: { texto: data.texto, autor: data.autor, hora: data.hora } }
                : chat
            ));
            break;
            
          case 'nueva_notificacion':
            // Añade la nueva notificación (ej: solicitud de amistad) y hace sonar/brillar la campana
            setNotificaciones(prev => [...prev, data]);
            break;
            
          default:
            break;
        }
      } catch (err) {
        console.error('Error parseando socket social:', err);
      }
    };

    ws.onclose = () => setIsConnected(false);
  }, [token]);

  // 2. 📥 CARGAR DATOS INICIALES (REST API)
  const cargarDatosSociales = useCallback(async () => {
    if (!token) return;
    try {
      const headers = { 'Authorization': `Token ${token}` };
      
      // Cargamos chats
      const resChats = await fetch('http://192.168.18.199:8000/api/social/chats/', { headers });
      if (resChats.ok) setChats(await resChats.json());
      
      // Cargamos notificaciones (Campanita)
      const resNotif = await fetch('http://192.168.18.199:8000/api/social/notificaciones/', { headers });
      if (resNotif.ok) setNotificaciones(await resNotif.json());
      
    } catch (error) {
      console.error("Error cargando datos sociales:", error);
    }
  }, [token]);

  // 3. 🚀 ACCIONES (Enviar mensajes y buscar amigos)
  const buscarUsuarios = async (query) => {
    if (!token || !query) return setResultadosBusqueda([]);
    try {
      const res = await fetch(`http://192.168.18.199:8000/api/social/buscar/?q=${query}`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      if (res.ok) setResultadosBusqueda(await res.json());
    } catch (error) {
      console.error("Error buscando usuarios", error);
    }
  };

  const enviarSolicitud = (username) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        action: 'enviar_solicitud',
        target_username: username
      }));
    }
  };

  const enviarMensaje = (chatId, texto) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        action: 'enviar_mensaje',
        chat_id: chatId,
        texto: texto
      }));
    }
  };

  // Se auto-conecta y carga los datos al iniciar sesión en la app
  useEffect(() => {
    if (token) {
      conectarSocialWS();
      cargarDatosSociales();
    }
    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, [token, conectarSocialWS, cargarDatosSociales]);

  const value = {
    chats,
    notificaciones,
    resultadosBusqueda,
    isConnected,
    buscarUsuarios,
    enviarSolicitud,
    enviarMensaje
  };

  return (
    <SocialContext.Provider value={value}>
      {children}
    </SocialContext.Provider>
  );
};