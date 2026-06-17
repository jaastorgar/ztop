import React, { useState, useEffect, useContext } from 'react';
import { 
  HiArrowLeft, HiHome, HiChatBubbleLeftRight, HiUserGroup, HiBell, HiUser, 
  HiShieldCheck, HiTrophy, HiPlus, HiShoppingBag
} from "react-icons/hi2";
import { FaFire } from "react-icons/fa6";
import { SocialContext } from '../context/SocialContext';

// 🚀 RECIBIMOS onOpenChat desde App.jsx
const ClanesView = ({ onNavigate, onOpenChat }) => {
  // 🚀 Extraemos chats y cargarDatosSociales para actualizar la lista global
  const { notificaciones, chats, cargarDatosSociales } = useContext(SocialContext);
  
  const [tabActiva, setTabActiva] = useState('ranking'); // 'ranking' o 'mi_clan'
  const [loading, setLoading] = useState(true);
  const [msgAlerta, setMsgAlerta] = useState('');

  // Estados de datos
  const [ranking, setRanking] = useState([]);
  const [miClanInfo, setMiClanInfo] = useState(null);
  
  // Estados para formulario de creación
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formNombre, setFormNombre] = useState('');
  const [formTag, setFormTag] = useState('');

  const cargarDatos = async () => {
    setLoading(true);
    const token = localStorage.getItem('ztop_token');
    
    try {
      // 1. Cargar Ranking Global
      const resRanking = await fetch('http://192.168.18.199:8000/api/social/clanes/ranking/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      if (resRanking.ok) setRanking(await resRanking.json());

      // 2. Cargar Mi Clan
      const resMiClan = await fetch('http://192.168.18.199:8000/api/social/clanes/mi-clan/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      if (resMiClan.ok) {
        const dataMiClan = await resMiClan.json();
        setMiClanInfo(dataMiClan);
      }
    } catch (err) {
      console.error("Error cargando clanes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // ==========================================
  // ACCIONES DEL CLAN
  // ==========================================
  const handleCrearClan = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('ztop_token');
    
    try {
      const res = await fetch('http://192.168.18.199:8000/api/social/clanes/crear/', {
        method: 'POST',
        headers: { 
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nombre: formNombre, tag: formTag })
      });
      const data = await res.json();
      
      if (res.ok) {
        setMsgAlerta("¡Clan fundado con éxito!");
        setMostrarFormulario(false);
        await cargarDatos();
        // 🚀 CRÍTICO: Recargar los chats globales para que aparezca la Sala de Guerra
        if (cargarDatosSociales) cargarDatosSociales();
      } else {
        setMsgAlerta(`⚠️ ${data.error || 'Error al crear el clan'}`);
      }
    } catch (err) {
      setMsgAlerta("⚠️ Error de conexión.");
    }
  };

  const handleUnirse = async (clanId) => {
    const token = localStorage.getItem('ztop_token');
    try {
      const res = await fetch(`http://192.168.18.199:8000/api/social/clanes/${clanId}/unirse/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMsgAlerta("¡Te has unido al clan!");
        setTabActiva('mi_clan');
        await cargarDatos();
        // 🚀 CRÍTICO: Recargar los chats globales
        if (cargarDatosSociales) cargarDatosSociales();
      } else {
        setMsgAlerta(`⚠️ ${data.error}`);
      }
    } catch (err) {
      setMsgAlerta("⚠️ Error de conexión.");
    }
  };

  const handleSalirClan = async () => {
    if (!window.confirm("¿Estás seguro de que quieres abandonar tu clan?")) return;
    
    const token = localStorage.getItem('ztop_token');
    try {
      const res = await fetch(`http://192.168.18.199:8000/api/social/clanes/salir/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` }
      });
      if (res.ok) {
        setMsgAlerta("Has abandonado el clan.");
        await cargarDatos();
        // 🚀 CRÍTICO: Recargar los chats globales
        if (cargarDatosSociales) cargarDatosSociales();
      }
    } catch (err) {
      setMsgAlerta("⚠️ Error de conexión.");
    }
  };

  // 🚀 LÓGICA DE REDIRECCIÓN DIRECTA AL CHAT DEL CLAN
  const handleIrASalaGuerra = () => {
    if (miClanInfo && miClanInfo.chat_id && chats) {
      const sala = chats.find(c => c.id === miClanInfo.chat_id);
      if (sala) {
        // Encontramos la sala, abrimos el chat activo directamente
        onOpenChat(sala);
        return;
      }
    }
    // Si por alguna razón no encuentra la sala en memoria (por ejemplo, demora en la red), lo mandamos a la lista
    onNavigate('chats');
  };

  // ==========================================
  // RENDERIZADO
  // ==========================================
  if (loading && !ranking.length) {
    return (
      <div className="w-full h-[100dvh] flex items-center justify-center bg-brand-darkBg">
        <div className="w-10 h-10 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-[100dvh] flex flex-col bg-brand-darkBg overflow-hidden select-none relative">
      
      {/* 🔝 TOP BAR & TABS */}
      <div className="w-full bg-brand-darkBg pt-10 px-6 pb-2 border-b border-white/5 z-20">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => onNavigate('home')} className="p-2.5 bg-brand-primary/40 rounded-xl text-white/80 border border-white/5 active:scale-95 transition-all">
            <HiArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-title text-xl font-bold text-white tracking-wide flex items-center">
            <HiShieldCheck className="text-brand-accent w-6 h-6 mr-2" /> Clanes
          </span>
          <div className="w-10 h-10 opacity-0"></div>
        </div>

        {/* Custom Tabs */}
        <div className="flex p-1 bg-brand-primary/30 rounded-xl">
          <button 
            onClick={() => setTabActiva('ranking')}
            className={`flex-1 py-2.5 font-title text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${tabActiva === 'ranking' ? 'bg-brand-accent text-brand-darkBg shadow-md' : 'text-white/40'}`}
          >
            Ranking
          </button>
          <button 
            onClick={() => setTabActiva('mi_clan')}
            className={`flex-1 py-2.5 font-title text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${tabActiva === 'mi_clan' ? 'bg-brand-accent text-brand-darkBg shadow-md' : 'text-white/40'}`}
          >
            Mi Clan
          </button>
        </div>
      </div>

      {/* 📜 ÁREA DE CONTENIDO SCROLL */}
      <div className="flex-grow w-full px-6 py-4 overflow-y-auto scrollbar-hide pb-24">
        
        {msgAlerta && (
          <div className="mb-4 p-3 bg-brand-primary/80 border border-brand-accent/20 rounded-xl text-center text-xs text-white animate-fade-in" onClick={() => setMsgAlerta('')}>
            {msgAlerta}
          </div>
        )}

        {/* ================= PESTAÑA: RANKING ================= */}
        {tabActiva === 'ranking' && (
          <div className="space-y-3 pb-8 animate-fade-in">
            {ranking.map((clan, index) => (
              <div key={clan.id} className="relative flex items-center justify-between p-4 bg-brand-primary/20 border border-white/5 rounded-2xl shadow-touch-1">
                
                <div className="flex items-center space-x-4">
                  {/* Medalla de Top 3 */}
                  <div className={`w-8 h-8 flex items-center justify-center font-title font-black rounded-full border ${index === 0 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : index === 1 ? 'bg-gray-400/20 text-gray-300 border-gray-400/50' : index === 2 ? 'bg-amber-700/20 text-amber-600 border-amber-700/50' : 'bg-brand-darkBg text-white/40 border-white/5'}`}>
                    {index + 1}
                  </div>
                  
                  <div>
                    <h3 className="font-title text-sm font-bold text-white flex items-center">
                      <span className="text-brand-accent mr-1">[{clan.tag}]</span> {clan.nombre}
                    </h3>
                    <p className="font-sans text-xxs text-white/40 mt-0.5 flex items-center">
                      <HiUserGroup className="w-3 h-3 mr-1" /> {clan.miembros_count}/{clan.limite_miembros} miembros
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="font-title text-base font-black text-white flex items-center">
                    <FaFire className="text-brand-accent w-3 h-3 mr-1" /> {clan.puntaje_total}
                  </span>
                  
                  {/* Botón Unirse (Solo si no tienes clan y hay espacio) */}
                  {!miClanInfo?.en_clan && clan.miembros_count < clan.limite_miembros && (
                    <button 
                      onClick={() => handleUnirse(clan.id)}
                      className="mt-1 text-[9px] font-title font-bold bg-brand-accent/10 text-brand-accent px-2 py-1 rounded border border-brand-accent/30 active:scale-95"
                    >
                      UNIRSE
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {ranking.length === 0 && (
              <div className="text-center py-10 text-white/40 font-sans text-sm">
                No hay clanes registrados aún. ¡Sé el primero!
              </div>
            )}
          </div>
        )}

        {/* ================= PESTAÑA: MI CLAN ================= */}
        {tabActiva === 'mi_clan' && (
          <div className="animate-fade-in pb-8">
            
            {/* ESTADO 1: NO TIENE CLAN */}
            {!miClanInfo?.en_clan && !mostrarFormulario && (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="w-20 h-20 bg-brand-primary/40 rounded-full flex items-center justify-center border border-white/5 shadow-[0_0_30px_rgba(10,232,198,0.1)]">
                  <HiShieldCheck className="w-10 h-10 text-white/20" />
                </div>
                <div>
                  <h3 className="font-title text-lg font-bold text-white">Lobo Solitario</h3>
                  <p className="font-sans text-xs text-white/50 px-6 mt-1">Únete a un clan en el Ranking o funda el tuyo propio para competir por la gloria mundial.</p>
                </div>
                <button 
                  onClick={() => setMostrarFormulario(true)}
                  className="mt-4 flex items-center space-x-2 px-6 py-3 bg-brand-accent text-brand-darkBg font-title font-bold text-sm rounded-xl shadow-[0_0_15px_rgba(10,232,198,0.3)] active:scale-95 transition-all"
                >
                  <HiPlus className="w-5 h-5" />
                  <span>FUNDAR UN CLAN</span>
                </button>
              </div>
            )}

            {/* ESTADO 2: FORMULARIO DE CREACIÓN */}
            {!miClanInfo?.en_clan && mostrarFormulario && (
              <form onSubmit={handleCrearClan} className="bg-brand-primary/20 border border-white/5 p-5 rounded-2xl space-y-4">
                <h3 className="font-title text-base font-bold text-white text-center mb-2">Crear Nuevo Clan</h3>
                
                <div>
                  <label className="font-sans text-xxs text-white/50 uppercase tracking-widest ml-1">Nombre Oficial</label>
                  <input type="text" maxLength="50" required value={formNombre} onChange={(e) => setFormNombre(e.target.value)} placeholder="Ej: Los Vengadores" className="w-full mt-1 bg-brand-darkBg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-accent outline-none" />
                </div>
                
                <div>
                  <label className="font-sans text-xxs text-white/50 uppercase tracking-widest ml-1">TAG (Max 5 letras)</label>
                  <input type="text" maxLength="5" required value={formTag} onChange={(e) => setFormTag(e.target.value)} placeholder="Ej: AVNGR" className="w-full mt-1 bg-brand-darkBg border border-white/10 rounded-xl px-4 py-3 text-sm text-white uppercase focus:border-brand-accent outline-none" />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button type="button" onClick={() => setMostrarFormulario(false)} className="flex-1 py-3 bg-white/5 text-white/60 font-title text-xs font-bold rounded-xl active:scale-95">CANCELAR</button>
                  <button type="submit" className="flex-1 py-3 bg-brand-accent text-brand-darkBg font-title text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(10,232,198,0.3)] active:scale-95">CREAR</button>
                </div>
              </form>
            )}

            {/* ESTADO 3: YA PERTENECE A UN CLAN */}
            {miClanInfo?.en_clan && (
              <div className="space-y-6">
                
                {/* Cabecera del Clan */}
                <div className="relative p-6 bg-gradient-to-tr from-brand-primary to-brand-secondary border border-brand-accent/20 rounded-3xl text-center shadow-touch-3 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent rounded-full blur-3xl opacity-10 translate-x-10 -translate-y-10"></div>
                  
                  <div className="inline-block px-3 py-1 bg-brand-darkBg/50 text-brand-accent font-title font-black text-sm rounded-lg mb-3 tracking-widest border border-white/5">
                    [{miClanInfo.clan.tag}]
                  </div>
                  <h2 className="font-title text-2xl font-bold text-white relative z-10">{miClanInfo.clan.nombre}</h2>
                  
                  <div className="flex justify-center items-center space-x-6 mt-4 relative z-10">
                    <div className="text-center">
                      <span className="block font-sans text-xxs text-white/60 uppercase">Poder Total</span>
                      <span className="font-title font-black text-lg text-white flex items-center justify-center"><FaFire className="w-3 h-3 text-brand-accent mr-1" />{miClanInfo.clan.puntaje_total}</span>
                    </div>
                    <div className="w-px h-8 bg-white/10"></div>
                    <div className="text-center">
                      <span className="block font-sans text-xxs text-white/60 uppercase">Miembros</span>
                      <span className="font-title font-black text-lg text-white">{miClanInfo.clan.miembros_count}/{miClanInfo.clan.limite_miembros}</span>
                    </div>
                  </div>
                </div>

                {/* Lista de Miembros */}
                <div>
                  <h4 className="font-title text-sm font-bold text-white mb-3 pl-1 flex items-center justify-between">
                    <span>Lista de Miembros</span>
                  </h4>
                  <div className="bg-brand-primary/20 border border-white/5 rounded-2xl overflow-hidden shadow-touch-1">
                    {miClanInfo.miembros.map((miembro) => (
                      <div key={miembro.id} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0">
                        <div className="flex items-center space-x-3">
                          <img src={miembro.avatar_url} alt={miembro.username} className="w-10 h-10 rounded-full bg-brand-darkBg border border-white/10" />
                          <div>
                            <span className="font-title text-sm font-bold text-white block">@{miembro.username}</span>
                            {miClanInfo.clan.lider_username === miembro.username && (
                              <span className="font-sans text-[9px] text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20">LÍDER</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Acciones del Clan */}
                <div className="pt-4 space-y-3">
                  {/* 🚀 BOTÓN CONECTADO: Llama a handleIrASalaGuerra */}
                  <button onClick={handleIrASalaGuerra} className="w-full py-4 bg-brand-primary/60 border border-brand-accent/50 text-brand-accent shadow-[0_0_15px_rgba(10,232,198,0.2)] font-title text-sm font-bold rounded-xl active:scale-95 flex items-center justify-center">
                    <HiChatBubbleLeftRight className="w-5 h-5 mr-2" /> IR A LA SALA DE GUERRA
                  </button>
                  
                  <button onClick={handleSalirClan} className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-400 font-title text-sm font-bold rounded-xl active:scale-95">
                    ABANDONAR CLAN
                  </button>
                </div>

              </div>
            )}
          </div>
        )}

      </div>

      {/* 📱 BOTTOM NAV BAR UNIFICADA (6 BOTONES) */}
      <div className="absolute bottom-0 w-full h-20 bg-brand-primary/30 border-t border-white/5 px-6 flex items-center justify-between z-10 backdrop-blur-xl">
        <button onClick={() => onNavigate('home')} className="flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
          <HiHome className="w-6 h-6" />
        </button>
        
        <button onClick={() => onNavigate('chats')} className="flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
          <HiChatBubbleLeftRight className="w-6 h-6" />
        </button>
        
        <button onClick={() => onNavigate('tienda')} className="flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
          <HiShoppingBag className="w-6 h-6" />
        </button>
        
        {/* 🛡️ Ícono de CLANES ACTIVO */}
        <button className="flex flex-col items-center justify-center space-y-1 text-brand-accent group">
          <HiUserGroup className="w-6 h-6 drop-shadow-[0_2px_8px_rgba(10,232,198,0.4)]" />
          <div className="w-1 h-1 bg-brand-accent rounded-full"></div>
        </button>
        
        <button onClick={() => onNavigate('notificaciones')} className="relative flex flex-col items-center justify-center text-white/40 active:scale-90 transition-all">
          <HiBell className="w-6 h-6" />
          {notificaciones && notificaciones.length > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-brand-darkBg"></span>
          )}
        </button>

        <button onClick={() => onNavigate('perfil')} className="flex flex-col items-center justify-center text-white/40 active:text-brand-lightBg active:scale-90 transition-all">
          <HiUser className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
};

export default ClanesView;