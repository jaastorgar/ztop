import React, { useState, useContext, useEffect } from 'react';
import { JuegoContext } from '../context/JuegoContext';
import LayoutMobile from '../components/LayoutMobile';
import InputTexto from '../components/InputTexto';
import Boton from '../components/Boton';

export const LobbyView = ({ onStartGame }) => {
  const { usuario, sala, setSala, conectarSala, iniciarNuevaRonda, estadoJuego } = useContext(JuegoContext);
  
  // Estados para cuando el usuario entra a la app y quiere unirse a un PIN existente
  const [codigoInput, setCodigoInput] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  // Forzamos el Hostname completo del backend para evitar conflictos de ruteo
  const API_URL = 'http://127.0.0.1:8000/api/sala';

  // Redireccionar automáticamente si el WebSocket cambia el estado a 'en_ronda'
  useEffect(() => {
    if (estadoJuego === 'en_ronda' && onStartGame) {
      onStartGame();
    }
  }, [estadoJuego, onStartGame]);

  // 1. Acción de Crear una Sala Nueva (Ser el Host)
  const manejarCrearSala = async () => {
    setError('');
    setCargando(true);
    try {
      const respuesta = await fetch(`${API_URL}/crear/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${usuario?.token}`
        }
      });
      const datos = await respuesta.json();

      if (respuesta.ok) {
        setSala(datos); // Guardamos la info de la sala (codigo, creador_username)
        conectarSala(datos.codigo); // Abrimos el canal WebSocket en tiempo real
      } else {
        setError(datos.error || 'No se pudo crear la sala.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  // 2. Acción de Unirse a una Sala Existente mediante PIN
  const manejarUnirseSala = async (e) => {
    e.preventDefault();
    
    // Limpiamos espacios antes de validar la longitud exacta
    const codigoLimpio = codigoInput.trim().toUpperCase();

    if (!codigoLimpio || codigoLimpio.length !== 6) {
      setError('El código PIN debe tener exactamente 6 caracteres.');
      return;
    }

    setError('');
    setCargando(true);

    try {
      // Endpoint verificado y sincronizado con urls.py de Django
      const respuesta = await fetch(`${API_URL}/${codigoLimpio}/unirse/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${usuario?.token}`
        }
      });
      const datos = await respuesta.json();

      if (respuesta.ok) {
        setSala(datos.sala);
        conectarSala(datos.sala.codigo); // Conectamos al mismo WebSocket de la sala
      } else {
        setError(datos.error || 'Código de sala inválido o partida ya iniciada.');
      }
    } catch (err) {
      setError('Error al intentar unirse a la sala.');
    } finally {
      setCargando(false);
    }
  };

  // 3. Lanzar el juego (Solo permitido para el creador de la sala)
  const manejarIniciarJuego = () => {
    const letrasDisponibles = ['A', 'B', 'C', 'D', 'E', 'M', 'P', 'R', 'S', 'T'];
    const letraAleatoria = letrasDisponibles[Math.floor(Math.random() * letrasDisponibles.length)];
    
    // Se envía la señal a Django Channels
    iniciarNuevaRonda(letraAleatoria);
  };

  const esCreador = sala && sala.creador_username === usuario?.username;

  return (
    <LayoutMobile>
      <div className="flex-1 flex flex-col justify-between p-6 bg-white">
        
        {/* Si el usuario NO está en ninguna sala, mostramos la interfaz del Home (Unirse / Crear) */}
        {!sala ? (
          <div className="flex-1 flex flex-col justify-between my-auto">
            <div className="flex flex-col items-center pt-6">
              <h2 className="font-heading font-bold text-2xl text-dark-text tracking-tight">
                ¡Hola, <span className="text-secondary-purple">{usuario?.username}</span>!
              </h2>
              <p className="font-sans text-sm text-muted-text text-center mt-1">
                Ingresa el PIN de tus amigos o crea una nueva sala para competir.
              </p>
            </div>

            <form onSubmit={manejarUnirseSala} className="flex flex-col gap-4 my-8">
              {error && (
                <div className="p-3 bg-red-50 text-red-500 rounded-xl text-sm font-semibold text-center">
                  {error}
                </div>
              )}

              <InputTexto
                label="Código PIN de la Sala"
                placeholder="Ej: ZT89X2"
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value)}
                disabled={cargando}
              />

              <Boton type="submit" variant="primary" disabled={cargando}>
                {cargando ? 'Buscando...' : 'Unirse a la Sala'}
              </Boton>
            </form>

            <div className="flex flex-col gap-3 pb-4">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-xs font-bold uppercase tracking-wider">o también</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <Boton variant="secondary" onClick={manejarCrearSala} disabled={cargando}>
                Crear Sala Nueva (Host)
              </Boton>
            </div>
          </div>
        ) : (
          
          // --- PANTALLA DE LOBBY / SALA DE ESPERA ACTIVA ---
          <div className="flex-1 flex flex-col justify-between h-full pt-6">
            <div className="flex flex-col items-center text-center">
              <span className="bg-light-purple text-secondary-purple text-xs px-3 py-1.5 rounded-full font-heading font-bold uppercase tracking-wider">
                Lobby de Espera
              </span>
              
              <div className="my-8 p-6 bg-light-purple/40 border-2 border-dashed border-secondary-purple/30 rounded-3xl w-full flex flex-col items-center">
                <span className="text-xs font-heading font-bold uppercase tracking-widest text-muted-text mb-1">
                  Código para compartir
                </span>
                <h3 className="font-heading font-black text-5xl tracking-widest text-primary-purple select-all">
                  {sala.codigo}
                </h3>
              </div>

              <p className="font-sans text-sm text-dark-text max-w-[80%]">
                {esCreador 
                  ? 'Eres el administrador de la sala. Espera a que todos se conecten y dale a iniciar.' 
                  : `Esperando que el administrador (${sala.creador_username}) inicie la ronda...`
                }
              </p>
            </div>

            <div className="flex flex-col items-center justify-center my-auto">
              <div className="w-16 h-16 border-4 border-primary-purple border-t-turquoise rounded-full animate-spin"></div>
              <span className="font-sans text-xs font-semibold text-gray-400 mt-4 animate-pulse">
                Sincronizando con PostgreSQL...
              </span>
            </div>

            <div className="pb-4">
              {esCreador ? (
                <Boton variant="primary" onClick={manejarIniciarJuego}>
                  ¡Iniciar Partida!
                </Boton>
              ) : (
                <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl text-center font-sans text-sm text-gray-400 font-medium">
                  🔒 Controles del Host deshabilitados
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </LayoutMobile>
  );
};

export default LobbyView;