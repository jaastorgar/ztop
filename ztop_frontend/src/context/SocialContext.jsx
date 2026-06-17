import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';

export const SocialContext = createContext(null);

export const SocialProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  
  const [isConnected, setIsConnected] = useState(false);
  // 🚀 Radar de usuarios en línea en tiempo real
  const [usuariosOnline, setUsuariosOnline] = useState({}); 
  
  const socketRef = useRef(null);

  // 📥 CARGAR DATOS (REST API) - 🚀 Ahora lee el token dinámicamente
  const cargarDatosSociales = useCallback(async () => {
    const tokenActual = localStorage.getItem('ztop_token');
    if (!tokenActual) return;

    try {
      const headers = { 'Authorization': `Token ${tokenActual}` };
      
      const resChats = await fetch('http://192.168.18.199:8000/api/social/chats/', { headers });
      
      // 🛡️ ANTI-GHOST DEVICE: Si la base de datos se borró o el token caducó
      if (resChats.status === 401 || resChats.status === 403) {
        console.warn("⚠️ Token inválido detectado. Limpiando sesión fantasma...");
        localStorage.removeItem('ztop_token');
        localStorage.removeItem('ztop_username');
        window.location.reload(); 
        return;
      }

      if (resChats.ok) setChats(await resChats.json());
      
      const resNotif = await fetch('http://192.168.18.199:8000/api/social/notificaciones/', { headers });
      if (resNotif.ok) setNotificaciones(await resNotif.json());
      
    } catch (error) {
      console.error("Error cargando datos iniciales de redes:", error);
    }
  }, []);

  // 🔌 CONECTAR AL TÚNEL SOCIAL EN TIEMPO REAL - 🚀 Lectura dinámica de token
  const conectarSocialWS = useCallback(() => {
    const tokenActual = localStorage.getItem('ztop_token');
    if (!tokenActual) return;
    
    // Si ya existe un canal abierto o abriéndose, ignoramos para duplicados de React 18
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }
    
    const wsUrl = `ws://192.168.18.199:8000/ws/social/?token=${tokenActual}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      if (socketRef.current === ws) {
        console.log('🟢 [SOCIAL] Conectado al ecosistema en tiempo real.');
        setIsConnected(true);
        // Preguntamos al servidor quién está activo apenas pisamos el backend
        ws.send(JSON.stringify({ action: 'check_online' }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.status) {
          case 'nuevo_mensaje':
            // 🚀 MEJORA: Atrapamos el "clan_tag" para los mensajes de la Sala de Guerra
            setChats(prevChats => prevChats.map(chat => 
              chat.id.toString() === data.chat_id.toString()
                ? {
                    ...chat,
                    ultimo_mensaje: {
                      texto: data.texto,
                      autor: data.autor,
                      hora: data.hora,
                      clan_tag: data.clan_tag || '' // Guardamos la placa del clan
                    }
                  }
                : chat
            ));
            break;
            
          case 'nueva_notificacion':
            if (data.tipo === 'solicitud_aceptada') {
              alert(`🎉 ¡${data.de || 'Un amigo'} ha aceptado tu solicitud de amistad!`);
            }
            // Re-sincronizamos toda la información visual de la REST API
            cargarDatosSociales(); 
            break;
            
          case 'estado_conexion':
            // Seteamos el estado online en el diccionario reactivo
            setUsuariosOnline(prev => ({
              ...prev,
              [data.username]: data.online
            }));

            // 🚀 SOLUCIÓN BIDIRECCIONAL: Si un amigo avisa que entró, le respondemos
            if (data.online && !data.is_reply) {
              if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                  action: 'estoy_online_tambien',
                  target_username: data.username
                }));
              }
            }
            break;
            
          default:
            break;
        }
      } catch (err) {
        console.error("Error parseando transmisión del socket social:", err);
      }
    };

    ws.onclose = () => {
      if (socketRef.current === ws) {
        console.log('🔴 [SOCIAL] Desconectado del túnel en tiempo real.');
        setIsConnected(false);
        socketRef.current = null; 
      }
    };
  }, [cargarDatosSociales]);

  // 🛠️ ACCIONES DISPONIBLES DE INTERFAZ
  const buscarUsuarios = async (query) => {
    const tokenActual = localStorage.getItem('ztop_token');
    if (!tokenActual || !query) return setResultadosBusqueda([]);
    try {
      const res = await fetch(`http://192.168.18.199:8000/api/social/buscar/?q=${query}`, {
        headers: { 'Authorization': `Token ${tokenActual}` }
      });
      if (res.ok) setResultadosBusqueda(await res.json());
    } catch (error) {
      console.error("Error buscando usuarios", error);
    }
  };

  const enviarSolicitud = (username) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ 
        action: 'enviar_solicitud', 
        target_username: username 
      }));
    }
  };

  const enviarMensaje = (chatId, texto) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ 
        action: 'enviar_mensaje', 
        chat_id: chatId, 
        texto: texto 
      }));
    }
  };

  // 🚀 NUEVO: Interruptores maestros para App.jsx
  const iniciarSesionSocial = useCallback(() => {
    conectarSocialWS();
    cargarDatosSociales();
  }, [conectarSocialWS, cargarDatosSociales]);

  const cerrarSesionSocial = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsConnected(false);
    setChats([]);
    setNotificaciones([]);
    setUsuariosOnline({});
  }, []);

  // CONTROL DE MONTAJE (Para cuando el usuario refresca la página ya logueado)
  useEffect(() => {
    const tokenActual = localStorage.getItem('ztop_token');
    if (tokenActual) {
      conectarSocialWS();
      cargarDatosSociales();
    }
    
    return () => {
      // 🚀 LIMPIEZA SEGURA: Cierra el socket ordenadamente al desmontar
      if (socketRef.current) {
        if (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING) { 
          socketRef.current.close();
        }
      }
    };
  }, [conectarSocialWS, cargarDatosSociales]);

  const value = {
    chats,
    notificaciones,
    setNotificaciones,
    cargarDatosSociales,
    resultadosBusqueda,
    isConnected,
    usuariosOnline,
    buscarUsuarios,
    enviarSolicitud,
    enviarMensaje,
    iniciarSesionSocial, 
    cerrarSesionSocial  
  };

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
};