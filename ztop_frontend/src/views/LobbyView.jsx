import React, { useState, useContext } from 'react';
// 🧵 Íconos profesionales de Heroicons (🚀 Agregamos HiShoppingBag)
import { 
  HiUserGroup, HiPlus, HiArrowRight, HiCheckCircle, HiArrowLeft,
  HiHome, HiChatBubbleLeftRight, HiPencilSquare, HiBell, HiUser,
  HiSparkles, HiBeaker, HiShoppingBag
} from "react-icons/hi2";
import { ZtopContext } from '../context/ZtopContext';
// 🚀 Importamos el contexto social para las notificaciones
import { SocialContext } from '../context/SocialContext';

// 🚀 Recibimos 'onNavigate' para el enrutamiento
const LobbyView = ({ onNavigate }) => {
  // 🧠 Consumimos los estados y acciones globales sincronizadas con el WebSocket
  const { 
    salaCodigo, 
    salaCreador, 
    usuariosEnSala, 
    setUsuariosEnSala,
    conectarSala, 
    desconectarSala,
    iniciarRonda, 
    error,
    isConnected,
    modoJuego,    // 🚀 Estado del modo de juego
    cambiarModo   // 🚀 Función para cambiar el modo
  } = useContext(ZtopContext);

  // 🚀 Consumimos las notificaciones del radar social global
  const { notificaciones } = useContext(SocialContext);

  // 📱 Estados locales
  const [pinInput, setPinInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorLocal, setErrorLocal] = useState('');

  // 👤 Obtenemos el usuario autenticado
  const usernameLocal = localStorage.getItem('ztop_username') || 'jugador';
  const tokenDev = localStorage.getItem('ztop_token') || "tu_token_de_auth_aqui";

  // 🎲 CREAR SALA PRIVADA VÍA REST API
  const handleCrearSala = async () => {
    setLoading(true);
    setErrorLocal('');
    try {
      const response = await fetch('http://192.168.18.199:8000/api/sala/crear/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${tokenDev}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        setUsuariosEnSala([{ username: data.creador_username || 'Tú (Creador)' }]);
        conectarSala(data.codigo, tokenDev);
      } else {
        setErrorLocal(data.error || 'No se pudo crear la sala.');
      }
    } catch (err) {
      setErrorLocal('Error de red al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // 🔌 UNIRSE A UNA SALA EXISTENTE CON EL PIN
  const handleUnirseSala = async (e) => {
    if (e) e.preventDefault();
    if (pinInput.length !== 6) {
      setErrorLocal('El código PIN debe tener exactamente 6 caracteres.');
      return;
    }

    setLoading(true);
    setErrorLocal('');
    const codigoUpper = pinInput.toUpperCase();

    try {
      const response = await fetch(`http://192.168.18.199:8000/api/sala/${codigoUpper}/unirse/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${tokenDev}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        if (data.sala && data.sala.jugadores) {
          setUsuariosEnSala(data.sala.jugadores);
        }
        conectarSala(codigoUpper, tokenDev);
      } else {
        setErrorLocal(data.error || 'El código PIN no es válido.');
      }
    } catch (err) {
      setErrorLocal('Error de red al intentar unirse.');
    } finally {
      setLoading(false);
    }
  };

  // 🚀 Lanzador de ronda por WebSocket
  const handleLanzarJuego = () => {
    const letras = ['A', 'B', 'C', 'D', 'M', 'P', 'R', 'S', 'T'];
    const letraAleatoria = letras[Math.floor(Math.random() * letras.length)];
    iniciarRonda(letraAleatoria);
  };

  return (
    // 🌌 CONTENEDOR PRINCIPAL: Vuelve el bg-brand-darkBg para el tono púrpura oscuro
    <div className="w-full h-[100dvh] flex flex-col bg-brand-darkBg overflow-hidden justify-between select-none">
      
      {/* 🧾 MÓDULO 1: Menú Principal / Fuera de Sala */}
      {!salaCodigo ? (
        <>
          {/* 🔝 TOP HEADER BAR */}
          <div className="w-full px-6 pt-10 pb-2 flex items-center justify-between z-10">
            <div className="w-10 h-10 opacity-0"></div>
            <h1 className="font-title text-3xl font-black tracking-widest text-white uppercase drop-shadow-md">
              Z<span className="text-brand-accent">TOP!</span>
            </h1>
            <button 
              onClick={() => onNavigate('perfil')} 
              className="w-10 h-10 bg-brand-primary/60 border border-white/10 rounded-full flex items-center justify-center text-sm font-bold text-brand-lightBg shadow-touch-1 active:scale-90 transition-all"
            >
              {usernameLocal.substring(0, 1).toUpperCase()}
            </button>
          </div>

          {/* 👋 SALUDO PERSONALIZADO */}
          <div className="w-full px-6 pt-4 text-left space-y-1">
            <h2 className="font-title text-3xl font-extrabold text-white tracking-wide">
              ¡Hola, <span className="text-brand-lightBg">{usernameLocal}</span>!
            </h2>
            <p className="font-sans text-sm font-light text-white/50">
              Listo para la acción. Elige tu opción:
            </p>
          </div>

          {/* 🗂️ CONTENEDOR CENTRAL: Tarjetas púrpuras y rosadas */}
          <div className="flex-grow w-full px-6 py-6 space-y-6 overflow-y-auto scrollbar-hide">
            
            {/* 🟣 CARD 1: CREAR SALA */}
            <div className="w-full p-5 bg-gradient-to-b from-brand-primary to-brand-primary/80 border border-white/10 rounded-2xl shadow-touch-2 relative overflow-hidden group">
              <div className="flex items-center space-x-3 mb-4">
                <HiPlus className="w-5 h-5 text-brand-accent" />
                <h3 className="font-title text-sm font-bold uppercase tracking-wider text-white">
                  Crear Sala Nueva (Host)
                </h3>
              </div>
              <button
                onClick={handleCrearSala}
                disabled={loading}
                className="w-full h-12 bg-brand-darkBg/90 border border-white/10 text-white font-sans text-sm font-semibold rounded-xl flex items-center justify-center shadow-inner active:scale-[0.97] transition-all"
              >
                Crear Partida
              </button>
            </div>

            {/* 🔵 CARD 2: UNIRSE A UNA SALA */}
            <div className="w-full p-5 bg-brand-primary/40 border border-white/10 rounded-2xl shadow-touch-2 space-y-4">
              <div className="flex items-center space-x-3">
                <HiUserGroup className="w-5 h-5 text-brand-accent" />
                <h3 className="font-title text-sm font-bold uppercase tracking-wider text-white">
                  Unirse a una Sala
                </h3>
              </div>
              
              <div className="space-y-1.5">
                <label className="font-sans text-xxs font-medium text-white/40 uppercase tracking-wider pl-1">
                  Código PIN de la Sala
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.toUpperCase())}
                  placeholder="Introduce el PIN..."
                  className="w-full h-12 px-4 bg-brand-darkBg border border-white/10 text-white font-title text-lg font-bold tracking-widest rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all"
                />
              </div>

              <button
                onClick={handleUnirseSala}
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-brand-secondary to-brand-primary border border-white/10 text-white font-sans text-sm font-bold rounded-xl flex items-center justify-center space-x-2 active:scale-[0.97] transition-all shadow-touch-1"
              >
                <span>Unirse a la Sala</span>
                <HiArrowRight className="w-4 h-4 text-brand-accent" />
              </button>
            </div>

            {/* ERROR DISPATCHER */}
            {(errorLocal || error) && (
              <p className="text-center font-sans text-xs text-red-400 bg-red-500/10 py-3 px-4 rounded-xl border border-red-500/20">
                ⚠️ {errorLocal || error}
              </p>
            )}
          </div>

          {/* 📱 BOTTOM NAVIGATION TAB BAR */}
          <div className="w-full h-20 bg-brand-primary/20 border-t border-white/5 px-6 flex items-center justify-between z-10 backdrop-blur-md">
            {/* Botón Home (Activo) */}
            <button onClick={() => onNavigate('home')} className="flex flex-col items-center justify-center space-y-1 text-brand-accent group">
              <HiHome className="w-6 h-6 drop-shadow-[0_2px_8px_rgba(10,232,198,0.4)]" />
              <div className="w-1 h-1 bg-brand-accent rounded-full"></div>
            </button>
            
            {/* Botón Chats */}
            <button onClick={() => onNavigate('chats')} className="flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
              <HiChatBubbleLeftRight className="w-6 h-6" />
            </button>
            
            {/* 🛒 🚀 NUEVO: Botón Tienda (Reemplaza al lápiz) */}
            <button onClick={() => onNavigate('tienda')} className="flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
              <HiShoppingBag className="w-6 h-6" />
            </button>
            
            {/* Botón Amigos / Notificaciones (Campana dinámica) */}
            <button onClick={() => onNavigate('notificaciones')} className="relative flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
              <HiBell className="w-6 h-6" />
              {notificaciones && notificaciones.length > 0 && (
                <span className="absolute top-0 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-brand-darkBg"></span>
              )}
            </button>
            
            {/* Botón Perfil */}
            <button 
              onClick={() => onNavigate('perfil')}
              className="flex flex-col items-center justify-center text-white/40 active:text-brand-lightBg active:scale-90 transition-all"
            >
              <HiUser className="w-6 h-6" />
            </button>
          </div>
        </>
      ) : (
        
        // 👥 MÓDULO 2: Sala de Espera Activa (Lobby de Jugadores en Tiempo Real)
        <div className="w-full h-full flex flex-col justify-between">
          
          {/* Header del Lobby */}
          <div className="w-full flex items-center justify-between px-6 pt-10 pb-6 border-b border-white/10 bg-brand-darkBg">
            <button 
              onClick={desconectarSala}
              className="p-2.5 bg-brand-primary/40 border border-white/5 rounded-xl text-white/80 active:scale-95 transition-all"
            >
              <HiArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <span className="font-sans text-xs font-light text-white/60 block">CÓDIGO PIN</span>
              <span className="font-title text-2xl font-bold tracking-wider text-brand-accent">{salaCodigo}</span>
            </div>
            <div className="w-9 h-9 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-400 animate-ping' : 'bg-red-400'}`}></div>
            </div>
          </div>

          {/* Contenedor central de configuraciones y jugadores */}
          <div className="flex-grow w-full px-6 py-6 flex flex-col space-y-6 overflow-y-auto">
            
            {/* 🚀 MÓDULO: SELECCIÓN DE MODOS DE JUEGO (Diseño Tarjeta Púrpura) */}
            <div className="w-full p-5 bg-brand-primary/30 border border-brand-primary/50 rounded-2xl shadow-touch-2 space-y-3">
              <div className="flex items-center space-x-3">
                <HiSparkles className="w-5 h-5 text-brand-accent" />
                <h3 className="font-title text-sm font-bold uppercase tracking-wider text-white">
                  Modo de Juego
                </h3>
              </div>
              
              {usernameLocal === salaCreador ? (
                /* Controles interactivos para el Host */
                <div className="bg-brand-darkBg/60 p-1.5 rounded-xl flex border border-white/5">
                  <button
                    type="button"
                    onClick={() => cambiarModo('clasico')}
                    className={`flex-1 h-10 rounded-lg font-title text-xs font-bold flex items-center justify-center space-x-2 transition-all duration-300 ${
                      modoJuego === 'clasico' 
                        ? 'bg-brand-secondary text-white shadow-md border border-white/10' 
                        : 'text-white/40 hover:text-white/70 bg-transparent'
                    }`}
                  >
                    <span>🍺 CLÁSICO</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => cambiarModo('alcoholico')}
                    className={`flex-1 h-10 rounded-lg font-title text-xs font-bold flex items-center justify-center space-x-2 transition-all duration-300 ${
                      modoJuego === 'alcoholico' 
                        ? 'bg-red-500/80 text-white shadow-md border border-red-400/30' 
                        : 'text-white/40 hover:text-red-300 bg-transparent'
                    }`}
                  >
                    <span>🍻 ALCOHÓLICO</span>
                  </button>
                </div>
              ) : (
                /* Badge estático para los invitados */
                <div className={`w-full h-12 rounded-xl flex items-center justify-center border font-title text-xs font-bold uppercase tracking-widest transition-all ${
                  modoJuego === 'alcoholico' 
                    ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' 
                    : 'bg-brand-darkBg/50 text-brand-accent border-white/5'
                }`}>
                  {modoJuego === 'alcoholico' ? '⚠️ MODO ALCOHÓLICO ACTIVADO' : '🍺 MODO CLÁSICO ACTIVADO'}
                </div>
              )}
            </div>

            {/* Listado de jugadores en sala */}
            <div className="flex flex-col space-y-3 pt-2">
              <div className="flex items-center space-x-2 text-white/80 pl-2">
                <HiUserGroup className="w-5 h-5 text-brand-lightBg" />
                <h2 className="font-sans text-sm font-semibold uppercase tracking-wider">
                  Jugadores en la Sala ({usuariosEnSala.length})
                </h2>
              </div>

              <div className="w-full space-y-3">
                {usuariosEnSala.map((usuario, index) => (
                  <div 
                    key={index} 
                    className="w-full h-14 bg-brand-primary px-4 rounded-xl flex items-center justify-between shadow-touch-1 border border-white/5 animate-fade-in"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-brand-secondary flex items-center justify-center font-title text-sm font-bold text-white">
                        {usuario.username.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-sans text-base font-medium text-white/90">
                        {usuario.username}
                      </span>
                    </div>
                    <HiCheckCircle className="w-6 h-6 text-brand-accent" />
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* 🏁 Footer: Botón de arranque */}
          <div className="w-full px-6 py-6 bg-brand-darkBg border-t border-white/5">
            {usernameLocal === salaCreador ? (
              <button
                onClick={handleLanzarJuego}
                className="w-full h-16 bg-brand-accent text-brand-darkBg font-title text-lg font-bold rounded-xl shadow-touch-3 hover:bg-brand-accent/90 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
              >
                <span>¡INICIAR PARTIDA!</span>
              </button>
            ) : (
              <div className="w-full h-16 bg-brand-primary/30 text-white/50 border border-white/5 font-sans text-sm font-medium rounded-xl flex items-center justify-center">
                <span>Esperando que el creador (@{salaCreador}) inicie...</span>
              </div>
            )}
            <p className="text-center font-sans text-xxs text-white/40 mt-3 tracking-wide">
              ztop! • Inmediatez Táctil Garantizada
            </p>
          </div>

        </div>
      )}

    </div>
  );
};

export default LobbyView;