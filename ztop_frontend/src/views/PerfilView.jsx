import React, { useState, useEffect, useContext } from 'react';
import { 
  HiTrophy, HiFire, HiEnvelope, HiIdentification, HiCalendar, HiArrowLeftOnRectangle, HiArrowLeft,
  HiHome, HiChatBubbleLeftRight, HiPencilSquare, HiBell, HiUser
} from "react-icons/hi2";
import { FaGamepad } from "react-icons/fa6";
import { SocialContext } from '../context/SocialContext';

const PerfilView = ({ onNavigate, onLogout }) => {
  const { notificaciones } = useContext(SocialContext);

  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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

    obtenerDatosPerfil();
  }, []);

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

  // 🚀 MEJORA: Calculamos el nivel dinámicamente y preparamos el avatar único
  const nivelJugador = Math.floor((perfil?.puntaje_total || 0) / 500) + 1;
  const avatarSrc = perfil?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${perfil?.username || 'ztop'}`;

  return (
    <div className="w-full h-[100dvh] flex flex-col bg-brand-darkBg overflow-hidden select-none">
      
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

        {/* 👤 SECCIÓN CENTRAL 1: Avatar Dinámico y Username */}
        <div className="w-full flex flex-col items-center py-6 text-center space-y-3">
          <div className="relative">
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
          </div>
          
          <div>
            <h2 className="font-title text-2xl font-bold text-white tracking-wide">
              @{perfil?.username}
            </h2>
            <p className="font-sans text-xs text-brand-lightBg/60 mt-0.5">
              Miembro desde el servidor ztop!
            </p>
          </div>
        </div>

        {/* 📊 SECCIÓN CENTRAL 2: Módulo Táctil de Estadísticas Globales */}
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

      {/* 📱 BOTTOM NAV BAR (Sin la tienda, manteniendo el Lápiz y la consistencia anterior) */}
      <div className="w-full h-20 bg-brand-primary/20 border-t border-white/5 px-6 flex items-center justify-between z-10 backdrop-blur-md">
        <button onClick={() => onNavigate('home')} className="flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
          <HiHome className="w-6 h-6" />
        </button>
        
        <button onClick={() => onNavigate('chats')} className="flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
          <HiChatBubbleLeftRight className="w-6 h-6" />
        </button>
        
        <button onClick={() => alert("Sección: Configuración rápida de Grupos de Amigos")} className="flex flex-col items-center justify-center text-white/40 active:text-brand-accent active:scale-90 transition-all">
          <HiPencilSquare className="w-6 h-6" />
        </button>
        
        {/* 🚀 Campana dinámica conectada al SocialContext */}
        <button onClick={() => onNavigate('notificaciones')} className="relative flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
          <HiBell className="w-6 h-6" />
          {notificaciones && notificaciones.length > 0 && (
            <span className="absolute top-0 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-brand-darkBg"></span>
          )}
        </button>

        {/* 🚀 Ícono de Perfil ACTIVO */}
        <button className="flex flex-col items-center justify-center space-y-1 text-brand-accent group">
          <HiUser className="w-6 h-6 drop-shadow-[0_2px_8px_rgba(10,232,198,0.4)]" />
          <div className="w-1 h-1 bg-brand-accent rounded-full"></div>
        </button>
      </div>

    </div>
  );
};

export default PerfilView;