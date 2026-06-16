import React, { useState, useEffect, useContext } from 'react';
import { HiArrowLeft, HiHome, HiChatBubbleLeftRight, HiPencilSquare, HiBell, HiUser, HiShoppingBag } from "react-icons/hi2";
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
      } else {
        setMsgAlerta(`⚠️ ${data.error}`);
      }
    } catch (err) {
      setMsgAlerta('⚠️ Error en la red.');
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
    <div className="w-full h-[100dvh] flex flex-col bg-brand-darkBg overflow-hidden select-none">
      <div className="flex-grow w-full px-6 py-6 overflow-y-auto scrollbar-hide">
        
        {/* TOP BAR */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-white/10">
          <button onClick={() => onNavigate('home')} className="p-2.5 bg-brand-primary/40 rounded-xl text-white/80 border border-white/5">
            <HiArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-title text-lg font-bold text-white tracking-wide">Mercado Cosmético</span>
          <div className="flex items-center space-x-1.5 bg-brand-primary/60 border border-brand-accent/30 px-3 py-1.5 rounded-xl">
            <FaCoins className="w-4 h-4 text-brand-accent animate-spin-slow" />
            <span className="font-title text-sm font-black text-white">{saldo}</span>
          </div>
        </div>

        {msgAlerta && (
          <div className="mt-4 p-3 bg-brand-primary/80 border border-brand-accent/20 rounded-xl text-center text-xs text-white">
            {msgAlerta}
          </div>
        )}

        {/* CATÁLOGO EN REJILLA */}
        <div className="grid grid-cols-2 gap-4 pt-6 pb-12">
          {catalogo.map((item) => (
            <div key={item.id} className="bg-brand-primary/20 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-between text-center space-y-3 relative overflow-hidden">
              <div className="w-20 h-20 bg-brand-darkBg/60 rounded-full p-2 border border-white/5">
                {/* 🚀 MEJORA: Renderizado condicional de la imagen según la categoría */}
                <img 
                  src={item.categoria === 'minecraft' 
                    ? `https://minotar.net/helm/${item.seed}/150.png` 
                    : `https://api.dicebear.com/7.x/${item.categoria}/svg?seed=${item.seed}`} 
                  alt={item.nombre} 
                  className="w-full h-full object-contain" 
                />
              </div>
              
              <div>
                <h4 className="font-title text-sm font-bold text-white truncate max-w-[130px]">{item.nombre}</h4>
                <p className="font-sans text-xxs text-white/40 capitalize">{item.categoria}</p>
              </div>

              <button
                onClick={() => handleAccion(item)}
                className={`w-full h-10 font-title text-xs font-bold rounded-xl border transition-all flex items-center justify-center space-x-1 ${
                  item.comprado 
                    ? 'bg-brand-accent/10 border-brand-accent/40 text-brand-accent' 
                    : 'bg-brand-primary/60 border-white/10 text-white hover:bg-brand-accent hover:text-brand-darkBg'
                }`}
              >
                {!item.comprado && <FaCoins className="w-3 h-3 mr-0.5" />}
                <span>{item.comprado ? 'EQUIPAR' : `$${item.precio}`}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM NAV BAR */}
      <div className="w-full h-20 bg-brand-primary/20 border-t border-white/5 px-6 flex items-center justify-between z-10 backdrop-blur-md">
        <button onClick={() => onNavigate('home')} className="flex flex-col items-center justify-center text-white/40">
          <HiHome className="w-6 h-6" />
        </button>
        <button onClick={() => onNavigate('chats')} className="flex flex-col items-center justify-center text-white/40">
          <HiChatBubbleLeftRight className="w-6 h-6" />
        </button>
        <button className="flex flex-col items-center justify-center text-brand-accent space-y-1">
          <HiShoppingBag className="w-6 h-6 drop-shadow-[0_2px_8px_rgba(10,232,198,0.4)]" />
          <div className="w-1 h-1 bg-brand-accent rounded-full"></div>
        </button>
        <button onClick={() => onNavigate('notificaciones')} className="relative flex flex-col items-center justify-center text-white/40">
          <HiBell className="w-6 h-6" />
          {notificaciones && notificaciones.length > 0 && (
            <span className="absolute top-0 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
          )}
        </button>
        <button onClick={() => onNavigate('perfil')} className="flex flex-col items-center justify-center text-white/40">
          <HiUser className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default TiendaView;