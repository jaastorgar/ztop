import React, { useState, useEffect, useContext } from 'react';
import { 
  HiArrowLeft, HiHome, HiChatBubbleLeftRight, HiBell, HiUser, 
  HiShoppingBag, HiUserGroup, HiSparkles, HiCheckBadge 
} from "react-icons/hi2";
import { FaCoins } from "react-icons/fa6";
import { SocialContext } from '../context/SocialContext';

const TiendaView = ({ onNavigate }) => {
  const { notificaciones } = useContext(SocialContext);
  const [saldo, setSaldo] = useState(0);
  const [catalogo, setCatalogo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msgAlerta, setMsgAlerta] = useState('');

  const cargarTienda = async () => {
    const token = localStorage.getItem('ztop_token');
    try {
      const res = await fetch('http://192.168.18.199:8000/api/tienda/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSaldo(data.saldo);
        setCatalogo(data.catalogo);
      }
    } catch (err) {
      console.error("Error cargando la tienda:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTienda();
  }, []);

  const handleAccion = async (item) => {
    const token = localStorage.getItem('ztop_token');
    const endpoint = item.comprado ? 'equipar' : 'comprar';
    
    try {
      const res = await fetch(`http://192.168.18.199:8000/api/tienda/${endpoint}/${item.id}/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        setMsgAlerta(`🎉 ${data.mensaje}`);
        cargarTienda();
        setTimeout(() => setMsgAlerta(''), 3000);
      } else {
        setMsgAlerta(`⚠️ ${data.error}`);
        setTimeout(() => setMsgAlerta(''), 3000);
      }
    } catch (err) {
      setMsgAlerta('⚠️ Error en la red.');
      setTimeout(() => setMsgAlerta(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[100dvh] flex items-center justify-center bg-brand-darkBg">
        <div className="w-10 h-10 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-[100dvh] flex flex-col bg-brand-darkBg overflow-hidden select-none relative">
      
      {/* 🌟 ALERTA TOAST */}
      {msgAlerta && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm p-3 bg-brand-primary border border-brand-accent/50 rounded-2xl shadow-[0_10px_30px_rgba(10,232,198,0.2)] text-center text-sm font-title font-bold text-white animate-slide-up backdrop-blur-lg">
          {msgAlerta}
        </div>
      )}

      {/* 📜 CONTENIDO */}
      <div className="flex-grow w-full overflow-y-auto scrollbar-hide pb-24">
        
        {/* 🔝 HERO */}
        <div className="w-full bg-gradient-to-b from-brand-primary/80 to-brand-darkBg pt-10 px-6 pb-6 border-b border-white/5">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => onNavigate('home')} className="p-2.5 bg-brand-darkBg/60 rounded-xl text-white/80 border border-white/10 active:scale-95 transition-all shadow-touch-1">
              <HiArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-title text-xl font-black text-white tracking-widest uppercase flex items-center">
              Mercado <HiSparkles className="text-brand-accent ml-2 w-5 h-5" />
            </h1>
            <div className="w-10 h-10 opacity-0"></div>
          </div>

          {/* BÓVEDA */}
          <div className="w-full bg-gradient-to-r from-amber-500/20 to-orange-600/10 border border-amber-500/30 rounded-2xl p-5 flex items-center justify-between shadow-[0_0_20px_rgba(245,158,11,0.15)]">
            <div>
              <span className="font-sans text-xs font-bold text-amber-500/80 uppercase tracking-widest block mb-1">Tu Bóveda</span>
              <div className="flex items-center space-x-2">
                <FaCoins className="w-6 h-6 text-amber-400" />
                <span className="font-title text-3xl font-black text-white">{saldo}</span>
              </div>
            </div>
            <div className="bg-brand-darkBg/50 px-3 py-1.5 rounded-lg border border-white/5">
              <span className="font-sans text-[10px] text-white/50 uppercase">Monedas ZTOP</span>
            </div>
          </div>
        </div>

        {/* 🛍️ REJILLA DE ITEMS */}
        <div className="px-6 pt-6 grid grid-cols-2 gap-4">
          {catalogo.map((item) => {
            const isVIP = item.categoria === 'minecraft';
            const isPremiumAnime = item.categoria === 'anime-3d'; // 🚀 NUEVA CATEGORÍA PREMIUM
            
            return (
              <div 
                key={item.id} 
                className={`relative p-4 rounded-3xl flex flex-col items-center justify-between text-center space-y-4 shadow-touch-1 overflow-hidden transition-all duration-300
                  ${isPremiumAnime 
                    ? 'bg-gradient-to-br from-[#1d1b4c] to-[#04e8c6]/10 border border-[#04e8c6]/40 shadow-[0_0_15px_rgba(4,232,198,0.1)]' 
                    : isVIP 
                      ? 'bg-gradient-to-br from-brand-primary/40 to-amber-500/10 border border-amber-400/30' 
                      : 'bg-brand-primary/20 border border-white/5'}
                `}
              >
                {/* Badges de Estado */}
                {item.comprado ? (
                  <div className="absolute top-3 left-3 flex items-center text-[9px] font-title font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
                    <HiCheckBadge className="w-3 h-3 mr-0.5" /> TUYO
                  </div>
                ) : isPremiumAnime ? (
                  <div className="absolute top-3 right-3 text-[8px] font-title font-black text-[#04e8c6] bg-[#04e8c6]/10 px-1.5 py-0.5 rounded border border-[#04e8c6]/30 tracking-widest animate-pulse">
                    PREMIUM
                  </div>
                ) : isVIP ? (
                  <div className="absolute top-3 right-3 text-[9px] font-title font-black text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 tracking-wider">
                    VIP
                  </div>
                ) : null}

                {/* Vista previa del Monito (Soporta Anime 3D y Minecraft) */}
                <div className={`w-20 h-20 flex items-center justify-center p-2 relative
                  ${isPremiumAnime 
                    ? 'bg-brand-darkBg border-2 border-[#04e8c6]/40 shadow-[0_0_15px_rgba(4,232,198,0.25)] rounded-xl'
                    : isVIP 
                      ? 'bg-brand-darkBg border-2 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)] rounded-xl' 
                      : 'bg-brand-darkBg border border-white/10 rounded-full'}
                `}>
                  <img 
                    src={(isVIP || isPremiumAnime)
                      ? `https://minotar.net/helm/${item.seed}/150.png` 
                      : `https://api.dicebear.com/7.x/${item.categoria}/svg?seed=${item.seed}`} 
                    alt={item.nombre} 
                    className={`w-full h-full object-contain ${(isVIP || isPremiumAnime) ? 'rounded-lg' : ''}`} 
                  />
                </div>
                
                {/* Info Text */}
                <div className="w-full">
                  <h4 className={`font-title text-sm font-bold truncate ${isPremiumAnime ? 'text-[#04e8c6]' : isVIP ? 'text-amber-100' : 'text-white'}`}>
                    {item.nombre}
                  </h4>
                  <p className="font-sans text-[9px] text-white/40 uppercase tracking-wider mt-0.5">
                    {isPremiumAnime ? '3D Anime' : item.categoria}
                  </p>
                </div>

                {/* Botón */}
                <button
                  onClick={() => handleAccion(item)}
                  className={`w-full h-11 font-title text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center shadow-touch-1 active:scale-95
                    ${item.comprado 
                      ? 'bg-brand-darkBg text-brand-accent border border-brand-accent/30' 
                      : isPremiumAnime
                        ? 'bg-gradient-to-r from-[#04e8c6] to-brand-secondary text-brand-darkBg border-none font-black shadow-[0_0_10px_rgba(4,232,198,0.2)]'
                        : isVIP 
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-brand-darkBg border-none'
                          : 'bg-brand-primary text-white border border-white/10 hover:bg-brand-accent hover:text-brand-darkBg'
                    }
                  `}
                >
                  {!item.comprado && (
                    <FaCoins className={`w-3.5 h-3.5 mr-1.5 ${isPremiumAnime || isVIP ? 'text-brand-darkBg' : 'text-amber-400'}`} />
                  )}
                  <span>{item.comprado ? 'Equipar' : item.precio}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 📱 BOTTOM NAV BAR (6 BOTONES) */}
      <div className="absolute bottom-0 w-full h-20 bg-brand-primary/30 border-t border-white/5 px-6 flex items-center justify-between z-10 backdrop-blur-xl">
        <button onClick={() => onNavigate('home')} className="flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
          <HiHome className="w-6 h-6" />
        </button>
        <button onClick={() => onNavigate('chats')} className="flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
          <HiChatBubbleLeftRight className="w-6 h-6" />
        </button>
        <button className="flex flex-col items-center justify-center space-y-1 text-brand-accent group">
          <HiShoppingBag className="w-6 h-6 drop-shadow-[0_2px_8px_rgba(10,232,198,0.4)]" />
          <div className="w-1 h-1 bg-brand-accent rounded-full"></div>
        </button>
        <button onClick={() => onNavigate('clanes')} className="flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
          <HiUserGroup className="w-6 h-6" />
        </button>
        <button onClick={() => onNavigate('notificaciones')} className="relative flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
          <HiBell className="w-6 h-6" />
          {notificaciones && notificaciones.length > 0 && (
            <span className="absolute top-0 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-brand-darkBg"></span>
          )}
        </button>
        <button onClick={() => onNavigate('perfil')} className="flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
          <HiUser className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
};

export default TiendaView;