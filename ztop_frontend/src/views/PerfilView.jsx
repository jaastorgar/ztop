import React, { useState, useEffect } from 'react';
// 🚀 Separamos los íconos: eliminamos HiGamepad de aquí
import { HiTrophy, HiFire, HiEnvelope, HiIdentification, HiCalendar, HiArrowLeftOnRectangle, HiArrowLeft } from "react-icons/hi2";
// 🎮 Traemos el control de videojuegos desde FontAwesome 6 (incluido en react-icons)
import { FaGamepad } from "react-icons/fa6";

const PerfilView = ({ onBack, onLogout }) => {
  // 📱 Estados para la carga asíncrona de los datos de la REST API
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
            'Authorization': `Token ${token}` // Middleware TokenAuth
          }
        });
        const data = await response.json();

        if (response.ok) {
          setPerfil(data); // Inyectamos el payload estructurado del PerfilUsuarioSerializer
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

  // 📴 Manejador para purgar la sesión del smartphone
  const handleCerrarSesion = () => {
    localStorage.removeItem('ztop_token');
    localStorage.removeItem('ztop_username');
    if (onLogout) {
      onLogout(); // Notifica a App.jsx para re-renderizar el Guard de Login
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-brand-darkBg">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-sans text-sm text-brand-lightBg/60 tracking-wide">Cargando perfil premium...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-brand-darkBg px-6 py-6 overflow-y-auto justify-between select-none">
      
      {/* 🔝 TOP NAVBAR */}
      <div className="w-full flex items-center justify-between pb-4 border-b border-white/10">
        <button 
          onClick={onBack}
          className="p-2.5 bg-brand-primary/40 rounded-xl text-white/80 active:scale-95 transition-all border border-white/5"
        >
          <HiArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-title text-lg font-bold text-white tracking-wide">Mi Perfil</span>
        <div className="w-10 h-10 opacity-0"></div> {/* Espaciador simétrico */}
      </div>

      {/* 👤 SECCIÓN CENTRAL 1: Avatar y Username */}
      <div className="w-full flex flex-col items-center py-6 text-center space-y-3">
        <div className="relative">
          {/* Círculo contenedor del Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-secondary to-brand-accent p-1 shadow-touch-3 animate-pulse-vibrant">
            <img 
              src={perfil?.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=ztop"} 
              alt="Avatar" 
              className="w-full h-full object-cover bg-brand-darkBg rounded-full"
            />
          </div>
          <span className="absolute bottom-0 right-0 h-6 px-2 bg-brand-accent text-brand-darkBg font-title text-xxs font-black uppercase rounded-md flex items-center tracking-wider">
            LVL {Math.floor((perfil?.puntaje_total || 0) / 500) + 1}
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
        {/* Card: Partidas Jugadas */}
        <div className="bg-brand-primary/40 border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center text-center space-y-1 shadow-touch-1">
          {/* 🚀 CORREGIDO: Usamos FaGamepad con total compatibilidad de compilación */}
          <FaGamepad className="w-5 h-5 text-brand-lightBg/80" />
          <span className="font-title text-lg font-black text-white">{perfil?.partidas_jugadas || 0}</span>
          <span className="font-sans text-xxs uppercase tracking-wider text-white/40">Jugadas</span>
        </div>

        {/* Card: Partidas Ganadas */}
        <div className="bg-brand-primary/40 border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center text-center space-y-1 shadow-touch-1">
          <HiTrophy className="w-5 h-5 text-amber-400" />
          <span className="font-title text-lg font-black text-amber-400">{perfil?.partidas_ganadas || 0}</span>
          <span className="font-sans text-xxs uppercase tracking-wider text-white/40">Victorias</span>
        </div>

        {/* Card: Puntaje Histórico Total */}
        <div className="bg-brand-primary/40 border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center text-center space-y-1 shadow-touch-1">
          <HiFire className="w-5 h-5 text-brand-accent" />
          <span className="font-title text-lg font-black text-brand-accent">{perfil?.puntaje_total || 0}</span>
          <span className="font-sans text-xxs uppercase tracking-wider text-white/40">Pts Totales</span>
        </div>
      </div>

      {/* 📋 SECCIÓN CENTRAL 3: Desglose de Datos Personales */}
      <div className="w-full bg-brand-primary/20 rounded-2xl p-4 border border-white/5 space-y-4">
        
        {/* Nombre Completo */}
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

        {/* Correo Electrónico */}
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

        {/* Edad */}
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

      {/* 🛑 ACCIÓN CRÍTICA DE CIERRE: Desconexión y Limpieza */}
      <div className="w-full pt-4">
        <button
          onClick={handleCerrarSesion}
          className="w-full h-14 bg-red-500/10 hover:bg-red-500/20 active:scale-[0.98] border border-red-500/30 text-red-400 font-title font-bold text-sm rounded-xl transition-all flex items-center justify-center space-x-2 shadow-touch-1"
        >
          <HiArrowLeftOnRectangle className="w-5 h-5" />
          <span>CERRAR SESIÓN GLOBAL</span>
        </button>
      </div>

      {/* Control de Errores */}
      {error && (
        <p className="text-center font-sans text-xs text-red-400 mt-4 bg-red-500/10 py-3 rounded-xl border border-red-500/20">
          ⚠️ {error}
        </p>
      )}

    </div>
  );
};

export default PerfilView;