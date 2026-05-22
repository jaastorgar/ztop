import React, { createContext, useState, useEffect, useRef } from 'react';

export const JuegoContext = createContext();

export const JuegoProvider = ({ children }) => {
  const [usuario, setUsuarioState] = useState(() => {
    const token = localStorage.getItem('ztop_token');
    const username = localStorage.getItem('ztop_username');
    const perfilId = localStorage.getItem('ztop_perfil_id');
    
    if (token && username) {
      return { token, username, perfilId };
    }
    return null;
  });

  const [sala, setSala] = useState(null);       
  const [letra, setLetra] = useState('');       
  const [estadoJuego, setEstadoJuego] = useState('esperando'); 
  const [cronometro, setCronometro] = useState(10); 
  const [pantallaCongelada, setPantallaCongelada] = useState(false);

  const socketRef = useRef(null);

  const setUsuario = (datosUsuario) => {
    if (datosUsuario) {
      localStorage.setItem('ztop_token', datosUsuario.token);
      localStorage.setItem('ztop_username', datosUsuario.username);
      if (datosUsuario.perfilId) {
        localStorage.setItem('ztop_perfil_id', datosUsuario.perfilId);
      }
      setUsuarioState(datosUsuario);
    } else {
      localStorage.removeItem('ztop_token');
      localStorage.removeItem('ztop_username');
      localStorage.removeItem('ztop_perfil_id');
      setUsuarioState(null);
    }
  };

  const conectarSala = (codigoSala) => {
    const codigoLimpio = codigoSala.toUpperCase();
    const url = `ws://192.168.18.199:8000/ws/juego/${codigoLimpio}/`;
    
    if (socketRef.current) {
      socketRef.current.close();
    }

    console.log(`📡 Conectando canal WebSocket en: ${url}`);
    socketRef.current = new WebSocket(url);

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📩 Evento recibido del servidor:", data);
      
      switch (data.status) {
        case 'ronda_iniciada':
          setLetra(data.letra);
          setEstadoJuego('en_ronda');
          setPantallaCongelada(false);
          setCronometro(10);
          break;

        case 'stop_presionado':
          setEstadoJuego('cuenta_regresiva');
          setCronometro(10); // Asegurar que reinicie el conteo
          break;

        case 'congelar_pantalla':
          setEstadoJuego('terminado');
          setPantallaCongelada(true); 
          break;
          
        default:
          break;
      }
    };
  };

  useEffect(() => {
    let intervalo = null;
    if (estadoJuego === 'cuenta_regresiva' && cronometro > 0) {
      intervalo = setInterval(() => {
        setCronometro((prev) => prev - 1);
      }, 1000);
    } else if (cronometro === 0 && estadoJuego === 'cuenta_regresiva') {
      setPantallaCongelada(true);
      setEstadoJuego('terminado');
    }
    return () => clearInterval(intervalo);
  }, [estadoJuego, cronometro]);

  const enviarStop = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: 'presionar_stop' }));
    }
  };

  // 💡 CORRECCIÓN CRÍTICA: Nombre del evento sincronizado con consumers.py
  const iniciarNuevaRonda = (letraSeleccionada) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log("🚀 Enviando señal de inicio de ronda al servidor...");
      socketRef.current.send(JSON.stringify({
        action: 'iniciar_ronda', // Este nombre debe coincidir con el if en consumers.py
        letra: letraSeleccionada
      }));
    } else {
      console.error("❌ El socket no está abierto. Estado:", socketRef.current?.readyState);
    }
  };

  return (
    <JuegoContext.Provider value={{
      usuario,
      setUsuario,
      sala,
      setSala,
      letra,
      setLetra,
      estadoJuego,
      setEstadoJuego,
      cronometro,
      setCronometro,
      pantallaCongelada,
      setPantallaCongelada,
      conectarSala,
      enviarStop,
      iniciarNuevaRonda
    }}>
      {children}
    </JuegoContext.Provider>
  );
};