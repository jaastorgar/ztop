import React, { createContext, useState, useEffect, useRef } from 'react';

export const JuegoContext = createContext();

export const JuegoProvider = ({ children }) => {
  // 🔄 PERSISTENCIA DE SESIÓN: Inicializamos buscando si ya hay credenciales guardadas en el navegador
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

  // Función envolvente para actualizar el usuario tanto en memoria como en el disco duro local
  const setUsuario = (datosUsuario) => {
    if (datosUsuario) {
      localStorage.setItem('ztop_token', datosUsuario.token);
      localStorage.setItem('ztop_username', datosUsuario.username);
      if (datosUsuario.perfilId) {
        localStorage.setItem('ztop_perfil_id', datosUsuario.perfilId);
      }
      setUsuarioState(datosUsuario);
    } else {
      // Si se pasa null, significa Cierre de Sesión explícito
      localStorage.removeItem('ztop_token');
      localStorage.removeItem('ztop_username');
      localStorage.removeItem('ztop_perfil_id');
      setUsuarioState(null);
    }
  };

  const conectarSala = (codigoSala) => {
    // Aseguramos que el código vaya siempre en mayúsculas al backend
    const codigoLimpio = codigoSala.toUpperCase();
    const url = `ws://127.0.0.1:8000/ws/juego/${codigoLimpio}/`;
    
    // Si ya había un socket abierto del juego anterior, lo cerramos limpiamente
    if (socketRef.current) {
      socketRef.current.close();
    }

    socketRef.current = new WebSocket(url);

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.status) {
        case 'ronda_iniciada':
          setLetra(data.letra);
          setEstadoJuego('en_ronda');
          setPantallaCongelada(false);
          setCronometro(10);
          break;

        case 'stop_presionado':
          setEstadoJuego('cuenta_regresiva');
          break;

        case 'congelar_pantalla':
          setEstadoJuego('terminado');
          setPantallaCongelada(true); 
          break;
          
        default:
          break;
      }
    };

    socketRef.current.onclose = () => {
      print("🔌 WebSocket del juego desconectado del servidor.");
    };
  };

  // Manejador del conteo regresivo local de 10 segundos sincronizado con Tailwind/React
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
    if (socketRef.current && estadoJuego === 'en_ronda') {
      socketRef.current.send(JSON.stringify({ action: 'presionar_stop' }));
    }
  };

  const iniciarNuevaRonda = (letraSeleccionada) => {
    if (socketRef.current) {
      socketRef.current.send(JSON.stringify({
        action: 'letra_elegida_host', // Match estricto con el disparador de eventos del host
        letra: letraSeleccionada
      }));
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