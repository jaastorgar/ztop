import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';

// 🧠 Creamos el contexto global de ztop!
export const ZtopContext = createContext(null);

export const ZtopProvider = ({ children }) => {
  // 📱 Estados nucleares de la partida móvil
  const [salaCodigo, setSalaCodigo] = useState(null);
  const [estadoJuego, setEstadoJuego] = useState('esperando'); // esperando | en_ronda | cuenta_regresiva | resultados
  const [letraActiva, setLetraActiva] = useState('');
  const [resultadosRonda, setResultadosRonda] = useState([]);
  const [usuariosEnSala, setUsuariosEnSala] = useState([]); // Para listar los rivales en el lobby
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

    // Cerramos cualquier conexión remanente previa por seguridad
    if (socketRef.current) {
      socketRef.current.close();
    }

    const codigoUpper = codigo.toUpperCase();
    setSalaCodigo(codigoUpper);
    setError(null);

    // 🌐 URL del WebSocket pasando el token por query string seguro para TokenAuthMiddleware
    // NOTA: Recuerda cambiar 'localhost:8000' por tu IP local de red para testing en smartphones reales
    const wsUrl = `ws://192.168.18.199:8000/ws/juego/${codigoUpper}/?token=${token}`;
    
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log(`🚀 [SOCKET CONECTADO] Túnel ztop! establecido con sala: ${codigoUpper}`);
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        // Parseo seguro con el objeto JSON nativo
        const data = JSON.parse(event.data);
        console.log('📥 [EVENTO BACKEND RECIBIDO]:', data);

        // 🎛️ Máquina de estados conducida simétricamente por los broadcasts del backend
        switch (data.status) {
          case 'ronda_iniciada': // Evento emitido por notificar_inicio
            limpiarCountdown();
            setLetraActiva(data.letra);
            setResultadosRonda([]);
            setSegundosRestantes(10);
            setEstadoJuego('en_ronda');
            break;

          case 'stop_presionado': // Evento emitido por notificar_cuenta_regresiva
            setEstadoJuego('cuenta_regresiva');
            setSegundosRestantes(10);
            // Cronómetro local síncrono descendente para la animación móvil
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

          case 'resultados_ronda': // Evento emitido por notificar_resultados al finalizar la evaluación
            limpiarCountdown();
            setSegundosRestantes(0);
            setResultadosRonda(data.resultados);
            setEstadoJuego('resultados');
            break;

          case 'listo_siguiente_ronda': // Evento emitido por notificar_listo_siguiente
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
    setEstadoJuego('esperando');
    setLetraActiva('');
    setResultadosRonda([]);
  }, [limpiarCountdown]);

  // =========================================================================
  // 📡 ACCIONES EMISORAS HACIA DJANGO CHANNELS (Mapeadas con receive del Backend)
  // =========================================================================

  // 🎲 1. Iniciar ronda activa con una letra en la BD relacional
  const iniciarRonda = useCallback((letra = 'A') => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        action: 'iniciar_ronda',
        letra: letra.toUpperCase()
      }));
    }
  }, []);

  // 🛑 2. Detener la ronda activa e iniciar temporizador de pánico de 10s en caché
  const presionarStop = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        action: 'presionar_stop'
      }));
    }
  }, []);

  // 🔄 3. Limpiar variables y devolver el estado global a 'esperando' para una nueva partida
  const siguienteRonda = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        action: 'siguiente_ronda'
      }));
    }
  }, []);

  // Limpieza defensiva de intervalos de memoria al desmontar el proveedor
  useEffect(() => {
    return () => {
      limpiarCountdown();
    };
  }, [limpiarCountdown]);

  // 📦 Empaquetado completo de la capa de control global
  const value = {
    salaCodigo,
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