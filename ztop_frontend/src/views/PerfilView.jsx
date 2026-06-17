import React, { useState, useEffect, useContext } from 'react';
import { 
  HiTrophy, HiFire, HiEnvelope, HiIdentification, HiCalendar, HiArrowLeftOnRectangle, HiArrowLeft,
  HiHome, HiChatBubbleLeftRight, HiBell, HiUser, HiXMark, HiSparkles, HiUserGroup
} from "react-icons/hi2";
import { FaGamepad } from "react-icons/fa6";
import { SocialContext } from '../context/SocialContext';

const PerfilView = ({ onNavigate, onLogout }) => {
  const { notificaciones } = useContext(SocialContext);

  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 🚀 ESTADOS PARA EL SELECTOR DE MONITOS
  const [isModalAbierto, setIsModalAbierto] = useState(false);
  const [misAvatares, setMisAvatares] = useState([]);
  const [loadingAvatares, setLoadingAvatares] = useState(false);

  // 🎉 NUEVO ESTADO: Controlador de la animación de subida de nivel
  const [mostrarCelebracion, setMostrarCelebracion] = useState(false);

  const obtenerDatosPerfil = async () => {
    const token = localStorage.getItem('ztop_token');
    if (!token) {
      setError('No se encontró un token de sesión válido.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://192.168.18.199:8000/api/auth/perfil/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        setPerfil(data); 
      } else {
        setError(data.error || 'No se pudo cargar el perfil.');
      }
    } catch (err) {
      setError('Error de comunicación con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerDatosPerfil();
  }, []);

  // 🎉 EFECTO: Verifica si toca celebrar una recompensa de nivel
  useEffect(() => {
    if (perfil) {
      const nivelActual = Math.floor((perfil.puntaje_total || 0) / 500) + 1;
      const ultimoCelebrado = parseInt(localStorage.getItem('ztop_ultimo_nivel_celebrado') || '0', 10);

      // Verificamos si es múltiplo de 5 y si es mayor al último que ya celebramos
      if (nivelActual > 1 && nivelActual % 5 === 0 && nivelActual > ultimoCelebrado) {
        setMostrarCelebracion(true);
        // Guardamos en la memoria del celular para no repetir la fiesta por este mismo nivel
        localStorage.setItem('ztop_ultimo_nivel_celebrado', nivelActual.toString());
      }
    }
  }, [perfil]);

  const abrirSelectorAvatar = async () => {
    setIsModalAbierto(true);
    setLoadingAvatares(true);
    const token = localStorage.getItem('ztop_token');
    try {
      const res = await fetch('http://192.168.18.199:8000/api/tienda/mis-avatares/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      if (res.ok) {
        setMisAvatares(await res.json());
      }
    } catch (err) {
      console.error("Error cargando tus monitos:", err);
    } finally {
      setLoadingAvatares(false);
    }
  };

  const handleEquiparAvatar = async (itemId) => {
    const token = localStorage.getItem('ztop_token');
    try {
      const res = await fetch(`http://192.168.18.199:8000/api/tienda/equipar/${itemId}/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` }
      });
      if (res.ok) {
        setIsModalAbierto(false);
        setLoading(true);
        await obtenerDatosPerfil(); 
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCerrarSesion = () => {
    localStorage.removeItem('ztop_token');
    localStorage.removeItem('ztop_username');
    if (onLogout) {
      onLogout(); 
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[100dvh] flex items-center justify-center bg-brand-darkBg">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-sans text-sm text-brand-lightBg/60 tracking-wide">Cargando perfil premium...</p>
        </div>
      </div>
    );
  }

  const nivelJugador = Math.floor((perfil?.puntaje_total || 0) / 500) + 1;
  const avatarSrc = perfil?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${perfil?.username || 'ztop'}`;

  return (
    <div className="w-full h-[100dvh] flex flex-col bg-brand-darkBg overflow-hidden select-none relative">
      
      <div className="flex-grow w-full px-6 py-6 overflow-y-auto scrollbar-hide">
        
        {/* 🔝 TOP NAVBAR */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-white/10">
          <button 
            onClick={() => onNavigate ? onNavigate('home') : null}
            className="p-2.5 bg-brand-primary/40 rounded-xl text-white/80 active:scale-95 transition-all border border-white/5 shadow-touch-1"
          >
            <HiArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-title text-lg font-bold text-white tracking-wide">Mi Perfil</span>
          <div className="w-10 h-10 opacity-0"></div>
        </div>

        {/* 👤 SECCIÓN CENTRAL 1: Avatar Interactivo */}
        <div className="w-full flex flex-col items-center py-6 text-center space-y-3">
          <button 
            onClick={abrirSelectorAvatar}
            className="relative group active:scale-95 transition-all focus:outline-none"
            title="Haz clic para cambiar de monito"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-secondary to-brand-accent p-1 shadow-touch-3 animate-pulse-vibrant">
              <img 
                src={avatarSrc} 
                alt="Avatar del Jugador" 
                className="w-full h-full object-cover bg-brand-darkBg rounded-full"
              />
            </div>
            <span className="absolute bottom-0 right-0 h-6 px-2 bg-brand-accent text-brand-darkBg font-title text-xxs font-black uppercase rounded-md flex items-center tracking-wider shadow-md">
              LVL {nivelJugador}
            </span>
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-[10px] font-title font-bold tracking-wider">CAMBIAR</span>
            </div>
          </button>
          
          <div>
            <h2 className="font-title text-2xl font-bold text-white tracking-wide">
              @{perfil?.username}
            </h2>
            <p className="font-sans text-xs text-brand-lightBg/60 mt-0.5">
              Miembro desde el servidor ztop!
            </p>
          </div>
        </div>

        {/* 📊 SECCIÓN CENTRAL 2: Estadísticas */}
        <div className="w-full grid grid-cols-3 gap-3 py-2">
          <div className="bg-brand-primary/40 border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center text-center space-y-1 shadow-touch-1">
            <FaGamepad className="w-5 h-5 text-brand-lightBg/80" />
            <span className="font-title text-lg font-black text-white">{perfil?.partidas_jugadas || 0}</span>
            <span className="font-sans text-xxs uppercase tracking-wider text-white/40">Jugadas</span>
          </div>

          <div className="bg-brand-primary/40 border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center text-center space-y-1 shadow-touch-1">
            <HiTrophy className="w-5 h-5 text-amber-400" />
            <span className="font-title text-lg font-black text-amber-400">{perfil?.partidas_ganadas || 0}</span>
            <span className="font-sans text-xxs uppercase tracking-wider text-white/40">Victorias</span>
          </div>

          <div className="bg-brand-primary/40 border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center text-center space-y-1 shadow-touch-1">
            <HiFire className="w-5 h-5 text-brand-accent" />
            <span className="font-title text-lg font-black text-brand-accent">{perfil?.puntaje_total || 0}</span>
            <span className="font-sans text-xxs uppercase tracking-wider text-white/40">Pts Totales</span>
          </div>
        </div>

        {/* 📋 SECCIÓN CENTRAL 3: Desglose de Datos Personales */}
        <div className="w-full bg-brand-primary/20 rounded-2xl p-4 border border-white/5 space-y-4 mt-6 shadow-touch-1">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-brand-primary/60 rounded-xl flex items-center justify-center border border-white/5">
              <HiIdentification className="w-5 h-5 text-brand-lightBg/80" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-sans text-xxs uppercase tracking-wider text-white/40 block">Nombre Completo</span>
              <span className="font-sans text-sm font-medium text-white truncate block">
                {perfil?.nombre_completo || 'No especificado'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-brand-primary/60 rounded-xl flex items-center justify-center border border-white/5">
              <HiEnvelope className="w-5 h-5 text-brand-lightBg/80" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-sans text-xxs uppercase tracking-wider text-white/40 block">Correo Electrónico</span>
              <span className="font-sans text-sm font-medium text-white truncate block">
                {perfil?.email || 'Sin correo asociado'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-brand-primary/60 rounded-xl flex items-center justify-center border border-white/5">
              <HiCalendar className="w-5 h-5 text-brand-lightBg/80" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-sans text-xxs uppercase tracking-wider text-white/40 block">Edad</span>
              <span className="font-sans text-sm font-medium text-white block">
                {perfil?.edad ? `${perfil.edad} años` : 'No especificada'}
              </span>
            </div>
          </div>
        </div>

        {/* 🛑 ACCIÓN CRÍTICA DE CIERRE */}
        <div className="w-full pt-6 pb-4">
          <button
            onClick={handleCerrarSesion}
            className="w-full h-14 bg-red-500/10 hover:bg-red-500/20 active:scale-[0.98] border border-red-500/30 text-red-400 font-title font-bold text-sm rounded-xl transition-all flex items-center justify-center space-x-2 shadow-touch-1"
          >
            <HiArrowLeftOnRectangle className="w-5 h-5" />
            <span>CERRAR SESIÓN GLOBAL</span>
          </button>
        </div>

        {error && (
          <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center text-xs text-red-400 font-sans">
            ⚠️ {error}
          </div>
        )}

      </div>

      {/* 🎉 ANIMACIÓN VIP DE CELEBRACIÓN A PANTALLA COMPLETA */}
      {mostrarCelebracion && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm animate-fade-in px-6">
          <div className="relative flex flex-col items-center justify-center p-8 w-full bg-gradient-to-br from-brand-secondary to-brand-primary border border-brand-accent/50 rounded-3xl shadow-[0_0_50px_rgba(10,232,198,0.4)] transform scale-100 animate-slide-up text-center space-y-5">
            
            {/* Brillo de fondo */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-32 bg-brand-accent rounded-full blur-3xl opacity-30 animate-pulse-vibrant"></div>
            
            <HiSparkles className="w-20 h-20 text-brand-accent relative z-10 drop-shadow-[0_0_15px_rgba(10,232,198,0.8)]" />
            
            <div className="relative z-10">
              <h2 className="font-title text-4xl font-black text-white tracking-widest drop-shadow-lg uppercase mb-1">
                ¡Nivel {nivelJugador}!
              </h2>
              <p className="font-sans text-sm text-brand-lightBg/90 font-medium px-2">
                ¡Has alcanzado un hito maestro! Acabas de desbloquear un nuevo avatar en tu colección.
              </p>
            </div>
            
            <button 
              onClick={() => {
                setMostrarCelebracion(false);
                abrirSelectorAvatar(); // Directo al selector de monitos
              }}
              className="relative z-10 w-full mt-4 h-14 bg-brand-accent text-brand-darkBg font-title text-sm font-bold tracking-widest uppercase rounded-xl shadow-[0_0_20px_rgba(10,232,198,0.5)] active:scale-95 transition-all"
            >
              Ver Recompensa
            </button>
          </div>
        </div>
      )}

      {/* 📱 PANEL MODAL OVERLAY: GESTOR DE MONITOS DESBLOQUEADOS */}
      {isModalAbierto && (
        <div className="absolute inset-0 bg-brand-darkBg/90 z-[90] flex flex-col justify-end animate-fade-in">
          <div className="w-full max-h-[75vh] bg-brand-primary/90 border-t border-white/10 rounded-t-3xl p-6 flex flex-col space-y-4 shadow-touch-3 backdrop-blur-lg animate-slide-up">
            
            <div className="w-full flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="font-title text-base font-bold text-white">Tus Monitos Desbloqueados</h3>
                <p className="font-sans text-xxs text-white/40">Toca uno para equipártelo al instante</p>
              </div>
              <button 
                onClick={() => setIsModalAbierto(false)}
                className="p-2 bg-brand-darkBg/80 border border-white/10 rounded-xl text-white/60 active:scale-95"
              >
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            {loadingAvatares ? (
              <div className="w-full py-12 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="w-full flex-grow overflow-y-auto grid grid-cols-3 gap-3 pb-6 scrollbar-hide">
                <div 
                  onClick={() => handleEquiparAvatar(0)} 
                  className="bg-brand-darkBg/50 border border-white/5 rounded-xl p-2 flex flex-col items-center justify-center text-center space-y-1 active:scale-95 transition-all cursor-pointer"
                >
                  <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${perfil?.username}`} alt="Defecto" className="w-12 h-12" />
                  <span className="font-sans text-[9px] font-bold text-brand-accent uppercase">Inicial</span>
                </div>

                {misAvatares.map((item) => {
                  const esElActual = avatarSrc.includes(item.seed);
                  return (
                    <div 
                      key={item.id}
                      onClick={() => handleEquiparAvatar(item.id)}
                      className={`border rounded-xl p-2 flex flex-col items-center justify-center text-center space-y-1 active:scale-95 transition-all cursor-pointer relative ${
                        esElActual ? 'bg-brand-accent/10 border-brand-accent' : 'bg-brand-darkBg/50 border-white/5'
                      }`}
                    >
                      {/* 🚀 Renderizado con soporte oficial para Minecraft */}
                      <img 
                        src={item.categoria === 'minecraft' 
                          ? `https://minotar.net/helm/${item.seed}/150.png` 
                          : `https://api.dicebear.com/7.x/${item.categoria}/svg?seed=${item.seed}`} 
                        alt={item.nombre} 
                        className="w-12 h-12 rounded-md" 
                      />
                      <span className="font-sans text-[9px] text-white/80 truncate max-w-[75px] block">{item.nombre}</span>
                      {item.nivel_requerido > 1 && (
                        <span className="bg-brand-secondary/60 text-white text-[7px] px-1 rounded font-title absolute top-1 right-1">
                          Lvl {item.nivel_requerido}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📱 BOTTOM NAV BAR */}
      <div className="w-full h-20 bg-brand-primary/20 border-t border-white/5 px-6 flex items-center justify-between z-10 backdrop-blur-md">
        <button onClick={() => onNavigate('home')} className="flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
          <HiHome className="w-6 h-6" />
        </button>
        
        <button onClick={() => onNavigate('chats')} className="flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
          <HiChatBubbleLeftRight className="w-6 h-6" />
        </button>
        
        {/* 🚀 SOLUCIÓN: Botón de Clanes Integrado (Reemplaza al alert de Configuración) */}
        <button onClick={() => onNavigate('clanes')} className="flex flex-col items-center justify-center text-white/40 active:text-brand-accent active:scale-90 transition-all">
          <HiUserGroup className="w-6 h-6" />
        </button>
        
        <button onClick={() => onNavigate('notificaciones')} className="relative flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
          <HiBell className="w-6 h-6" />
          {notificaciones && notificaciones.length > 0 && (
            <span className="absolute top-0 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-brand-darkBg"></span>
          )}
        </button>

        <button className="flex flex-col items-center justify-center space-y-1 text-brand-accent group">
          <HiUser className="w-6 h-6 drop-shadow-[0_2px_8px_rgba(10,232,198,0.4)]" />
          <div className="w-1 h-1 bg-brand-accent rounded-full"></div>
        </button>
      </div>

    </div>
  );
};

export default PerfilView;