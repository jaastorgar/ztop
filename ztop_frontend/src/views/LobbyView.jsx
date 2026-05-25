import React, { useState, useContext } from 'react';
// 🧵 Importamos la paleta completa de íconos requerida para el diseño cyber de la captura
import { 
  HiUserGroup, HiPlus, HiArrowRight, HiCheckCircle, HiArrowLeft,
  HiHome, HiChatBubbleLeftRight, HiPencilSquare, HiBell, HiUser 
} from "react-icons/hi2";
import { ZtopContext } from '../context/ZtopContext';

const LobbyView = ({ onGoToPerfil }) => {
  // 🧠 Consumimos los estados y acciones globales del WebSocket
  const { 
    salaCodigo, 
    usuariosEnSala, 
    setUsuariosEnSala,
    conectarSala, 
    desconectarSala,
    iniciarRonda, 
    error,
    isConnected 
  } = useContext(ZtopContext);

  // 📱 Estados locales para el control de inputs y cargas asíncronas
  const [pinInput, setPinInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorLocal, setErrorLocal] = useState('');

  // 👤 Obtenemos el nombre del jugador autenticado para personalizar la pantalla
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
    <div className="w-full h-full flex flex-col bg-brand-darkBg overflow-hidden justify-between">
      
      {/* 🧾 MÓDULO 1: Menú Principal / Fuera de Sala (Diseño fiel al Pantallazo) */}
      {!salaCodigo ? (
        <>
          {/* 🔝 TOP HEADER BAR */}
          <div className="w-full px-6 pt-6 pb-2 flex items-center justify-between z-10">
            <div className="w-10 h-10 opacity-0"></div> {/* Espaciador izquierdo */}
            <h1 className="font-title text-3xl font-black tracking-widest text-white uppercase select-none">
              Z<span className="text-brand-accent">TOP!</span>
            </h1>
            {/* Botón rápido superior estilo circular con la inicial */}
            <button 
              onClick={onGoToPerfil}
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

          {/* 🗂️ CONTENEDOR CENTRAL DESLIZABLE (ZONA DE CARDS INTERACTIVAS) */}
          <div className="flex-grow w-full px-6 py-6 space-y-6 overflow-y-auto scrollbar-hide">
            
            {/* 🟣 CARD 1: CREAR SALA NUEVA (HOST) */}
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

            {/* 🔵 CARD 2: UNIRSE A UNA SALA CON PIN */}
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

          {/* 📱 BOTTOM NAVIGATION TAB BAR (Sincronización Total con el Menú del Celular) */}
          <div className="w-full h-20 bg-brand-primary/20 border-t border-white/5 px-6 flex items-center justify-between z-10 backdrop-blur-md">
            <button className="flex flex-col items-center justify-center space-y-1 text-brand-accent group">
              <HiHome className="w-6 h-6 drop-shadow-[0_2px_8px_rgba(10,232,198,0.4)]" />
              <div className="w-1 h-1 bg-brand-accent rounded-full"></div>
            </button>
            <button className="flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
              <HiChatBubbleLeftRight className="w-6 h-6" />
            </button>
            <button className="flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
              <HiPencilSquare className="w-6 h-6" />
            </button>
            <button className="flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
              <HiBell className="w-6 h-6" />
            </button>
            {/* 🚀 BOTÓN DE PERFIL: Conecta directamente con la navegación del PerfilView */}
            <button 
              onClick={onGoToPerfil}
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
          <div className="w-full flex items-center justify-between px-6 pt-6 pb-6 border-b border-white/10 bg-brand-darkBg">
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

          {/* Contenedor de jugadores listos */}
          <div className="flex-grow w-full px-6 py-6 flex flex-col space-y-4 overflow-y-auto">
            <div className="flex items-center space-x-2 text-white/80 pl-2">
              <HiUserGroup className="w-5 h-5 text-brand-lightBg" />
              <h2 className="font-sans text-sm font-semibold uppercase tracking-wider">
                Jugadores en la Sala ({usuariosEnSala.length})
              </h2>
            </div>

            {/* Listado vertical de perfiles conectados */}
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

          {/* Footer del lobby: Botón de arranque */}
          <div className="w-full px-6 py-6 bg-brand-darkBg">
            <button
              onClick={handleLanzarJuego}
              className="w-full h-16 bg-brand-accent text-brand-darkBg font-title text-lg font-bold rounded-xl shadow-touch-3 hover:bg-brand-accent/90 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
            >
              <span>¡INICIAR PARTIDA!</span>
            </button>
            <p className="text-center font-sans text-xxs text-white/40 mt-3 tracking-wide">
              Esperando a que el creador inicie la ronda móvil...
            </p>
          </div>

        </div>
      )}

    </div>
  );
};

export default LobbyView;