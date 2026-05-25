import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';

// 🧠 Creamos el contexto global de ztop!
export const ZtopContext = createContext(null);

export const ZtopProvider = ({ children }) => {
  // 📱 Estados nucleares de la partida móvil
  const [salaCodigo, setSalaCodigo] = useState(null);
  const [salaCreador, setSalaCreador] = useState(''); // 🚀 NUEVO: Guarda el host de la partida
  const [estadoJuego, setEstadoJuego] = useState('esperando'); 
  const [letraActiva, setLetraActiva] = useState('');
  const [resultadosRonda, setResultadosRonda] = useState([]);
  const [usuariosEnSala, setUsuariosEnSala] = useState([]); 
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  
  // ⏳ Contador local para la cuenta regresiva táctil de 10 segundos
  const [segundosRestantes, setSegundosRestantes] = useState(10);

  // 🔌 Referencia persistente del WebSocket para evitar re-conexiones por re-renders
  const socketRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // 🕒 Limpiador del intervalo de la cuenta regresiva circular
  const limpiarCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // 📡 Función principal para conectar el túnel WebSocket con Django Channels
  const conectarSala = useCallback((codigo, token) => {
    if (!codigo || !token) {
      setError('Código de sala o token de autenticación faltante.');
      return;
    }

    if (socketRef.current) {
      socketRef.current.close();
    }

    const codigoUpper = codigo.toUpperCase();
    setSalaCodigo(codigoUpper);
    setError(null);

    // 🌐 URL del WebSocket apuntando a tu IP local
    const wsUrl = `ws://192.168.18.199:8000/ws/juego/${codigoUpper}/?token=${token}`;
    
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log(`🚀 [SOCKET CONECTADO] Túnel ztop! establecido con sala: ${codigoUpper}`);
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📥 [EVENTO BACKEND RECIBIDO]:', data);

        // 🎛️ Máquina de estados conducida simétricamente por los broadcasts del backend
        switch (data.status) {
          case 'actualizar_lobby': // 🚀 SOLUCIÓN 1: Atrapa el broadcast de nuevos jugadores
            setUsuariosEnSala(data.jugadores);
            setSalaCreador(data.creador);
            break;

          case 'ronda_iniciada': 
            limpiarCountdown();
            setLetraActiva(data.letra);
            setResultadosRonda([]);
            setSegundosRestantes(10);
            setEstadoJuego('en_ronda');
            break;

          case 'stop_presionado': 
            setEstadoJuego('cuenta_regresiva');
            setSegundosRestantes(10);
            countdownIntervalRef.current = setInterval(() => {
              setSegundosRestantes((prev) => {
                if (prev <= 1) {
                  clearInterval(countdownIntervalRef.current);
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
            break;

          case 'resultados_ronda': 
            limpiarCountdown();
            setSegundosRestantes(0);
            setResultadosRonda(data.resultados);
            setEstadoJuego('resultados');
            break;

          case 'listo_siguiente_ronda': 
            limpiarCountdown();
            setLetraActiva('');
            setSegundosRestantes(10);
            setEstadoJuego('esperando');
            break;

          default:
            if (data.error) {
              setError(data.error);
            }
            break;
        }
      } catch (err) {
        console.error('💥 Error parseando evento JSON del socket:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('⚠️ [SOCKET ERROR] Fallo en la comunicación asíncrona:', err);
      setError('Hubo un error en la conexión en tiempo real.');
    };

    ws.onclose = () => {
      console.log('🔌 [SOCKET CERRADO] El túnel de la sala se ha desconectado.');
      setIsConnected(false);
      limpiarCountdown();
    };
  }, [limpiarCountdown]);

  // 📴 Función para desconectarse manualmente al salir de la partida o lobby
  const desconectarSala = useCallback(() => {
    limpiarCountdown();
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsConnected(false);
    setSalaCodigo(null);
    setSalaCreador(''); // Limpiamos el creador
    setEstadoJuego('esperando');
    setLetraActiva('');
    setResultadosRonda([]);
  }, [limpiarCountdown]);

  // =========================================================================
  // 📡 ACCIONES EMISORAS HACIA DJANGO CHANNELS
  // =========================================================================

  const iniciarRonda = useCallback((letra = 'A') => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        action: 'iniciar_ronda',
        letra: letra.toUpperCase()
      }));
    }
  }, []);

  const presionarStop = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        action: 'presionar_stop'
      }));
    }
  }, []);

  const siguienteRonda = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        action: 'siguiente_ronda'
      }));
    }
  }, []);

  useEffect(() => {
    return () => {
      limpiarCountdown();
    };
  }, [limpiarCountdown]);

  // 📦 Empaquetado completo de la capa de control global
  const value = {
    salaCodigo,
    salaCreador, // 🚀 Expuesto para que el Lobby lo pueda usar
    estadoJuego,
    letraActiva,
    resultadosRonda,
    usuariosEnSala,
    isConnected,
    segundosRestantes,
    error,
    setUsuariosEnSala,
    conectarSala,
    desconectarSala,
    iniciarRonda,
    presionarStop,
    siguienteRonda
  };

  return (
    <ZtopContext.Provider value={value}>
      {children}
    </ZtopContext.Provider>
  );
};