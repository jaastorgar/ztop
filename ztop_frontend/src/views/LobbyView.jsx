import React, { useState, useContext, useEffect } from 'react';
import { JuegoContext } from '../context/JuegoContext';

// 💡 AGREGAMOS onViewProfile A LAS PROPS
export const LobbyView = ({ onStartGame, onViewProfile }) => {
  const { 
    usuario, 
    sala, 
    setSala, 
    conectarSala, 
    iniciarNuevaRonda, 
    estadoJuego 
  } = useContext(JuegoContext);
  
  const [codigoInput, setCodigoInput] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  // 💡 CONFIGURADO TÁCTICAMENTE PARA TU DISPOSITIVO MÓVIL EN LA RED LOCAL
  const API_URL = 'http://192.168.18.199:8000/api/sala';

  useEffect(() => {
    if (estadoJuego === 'en_ronda' && onStartGame) {
      onStartGame();
    }
  }, [estadoJuego, onStartGame]);

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
        setSala({
          codigo: datos.codigo,
          esCreador: true,
          creador_username: usuario.username
        });
        conectarSala(datos.codigo);
      } else {
        setError(datos.error || 'Error al iniciar sala.');
      }
    } catch (err) {
      setError('Error de red: Servidor central fuera de línea.');
    } finally {
      setCargando(false);
    }
  };

  const manejarUnirseSala = async (e) => {
    e.preventDefault();
    if (!codigoInput) {
      setError('Ingresa un código PIN.');
      return;
    }

    setError('');
    setCargando(true);
    const pinLimpio = codigoInput.toUpperCase().trim();

    try {
      const respuesta = await fetch(`${API_URL}/${pinLimpio}/unirse/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${usuario?.token}`
        }
      });
      const datos = await respuesta.json();

      if (respuesta.ok) {
        setSala({
          codigo: pinLimpio,
          esCreador: false,
          creador_username: datos.creador_username || 'Host'
        });
        conectarSala(pinLimpio);
      } else {
        setError(datos.error || 'PIN inválido o sala inactiva.');
      }
    } catch (err) {
      setError('Fallo en la interceptación de datos.');
    } finally {
      setCargando(false);
    }
  };

  const manejarIniciarJuego = () => {
    const abecedario = 'ABCDEFGHIJLMNOPRSTUV';
    const letraAleatoria = abecedario[Math.floor(Math.random() * abecedario.length)];
    iniciarNuevaRonda(letraAleatoria);
  };

  const esCreador = sala?.esCreador;

  // ESTILOS EN LÍNEA
  const estilos = {
    contenedorBase: {
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#09090b', 
      color: '#e4e4e7',
      padding: '24px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxSizing: 'border-box',
      zIndex: 9999,
      overflowY: 'auto'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #1f1f22',
      paddingBottom: '16px'
    },
    tituloZtop: {
      margin: 0,
      fontSize: '22px',
      fontWeight: '900',
      letterSpacing: '-0.5px',
      background: 'linear-gradient(to right, #a78bfa, #0ae8c6)', 
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    btnPerfil: {
      backgroundColor: '#18181b',
      border: '1px solid #27272a',
      color: '#a1a1aa',
      padding: '8px 14px',
      borderRadius: '20px', 
      fontSize: '12px',
      fontWeight: 'bold',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.2s'
    },
    tarjetaMorada: {
      background: 'linear-gradient(145deg, #141416 0%, #0d0d0f 100%)',
      border: '1px solid rgba(167, 139, 250, 0.4)',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
      width: '100%',
      maxWidth: '400px',
      margin: '0 auto 20px auto',
      boxSizing: 'border-box'
    },
    tarjetaTurquesa: {
      background: 'linear-gradient(145deg, #141416 0%, #0d0d0f 100%)',
      border: '1px solid rgba(10, 232, 198, 0.4)',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
      width: '100%',
      maxWidth: '400px',
      margin: '0 auto',
      boxSizing: 'border-box'
    },
    subtituloCard: {
      margin: '0',
      fontSize: '14px',
      fontWeight: '900',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    descripcionCard: {
      margin: '10px 0 16px 0',
      fontSize: '12px',
      color: '#a1a1aa',
      lineHeight: '1.5'
    },
    inputPin: {
      width: '100%',
      backgroundColor: '#09090b',
      border: '1px solid #27272a',
      borderRadius: '10px',
      padding: '14px',
      color: '#0AE8C6',
      textAlign: 'center',
      fontSize: '15px',
      fontWeight: '900',
      letterSpacing: '4px',
      outline: 'none',
      boxSizing: 'border-box',
      marginBottom: '12px'
    },
    btnAccion: {
      width: '100%',
      padding: '14px',
      borderRadius: '10px',
      border: 'none',
      fontSize: '13px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      cursor: 'pointer',
      boxSizing: 'border-box',
      transition: 'all 0.2s'
    }
  };

  return (
    <div style={estilos.contenedorBase}>
      
      {/* HEADER / NAVEGACIÓN */}
      <header style={estilos.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0ae8c6', boxShadow: '0 0 10px #0ae8c6' }} />
          <h1 style={estilos.tituloZtop}>ZTOP!</h1>
        </div>
        
        {/* BOTÓN DE PERFIL - AHORA REDIRIGE A LA VISTA PERFIL */}
        <button 
          type="button" 
          onClick={onViewProfile} // Llama a la función de cambio de vista
          style={estilos.btnPerfil}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          @{usuario?.username?.toLowerCase()}
        </button>
      </header>

      {/* ÁREA CENTRAL DE PANELES */}
      {!sala ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
          {error && (
            <div style={{ maxWidth: '400px', margin: '0 auto 16px auto', width: '100%', boxSizing: 'border-box', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#f87171', fontSize: '12px', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {/* TARJETA: CREAR PARTIDA (MORADA) */}
          <div style={estilos.tarjetaMorada}>
            <h3 style={{ ...estilos.subtituloCard, color: '#a78bfa' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                <path d="M12 12h.01"></path>
                <path d="M17 12h.01"></path>
                <path d="M7 12h.01"></path>
              </svg>
              Protocolo Host
            </h3>
            <p style={estilos.descripcionCard}>Levantar una sesión maestra en los servidores centrales.</p>
            <button
              type="button"
              onClick={manejarCrearSala}
              disabled={cargando}
              style={{ ...estilos.btnAccion, backgroundColor: '#4A008B', color: '#ffffff' }}
            >
              {cargando ? 'Configurando...' : 'Crear Nueva Sala'}
            </button>
          </div>

          {/* TARJETA: VINCULAR NODOS (TURQUESA) */}
          <div style={estilos.tarjetaTurquesa}>
            <h3 style={{ ...estilos.subtituloCard, color: '#0AE8C6' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0ae8c6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 7a2 2 0 0 1 2 2"></path><path d="M15 3a6 6 0 0 1 6 6"></path><path d="M11 17l-5.3-5.3a2 2 0 0 0-2.8 0c-.8.8-.8 2 0 2.8l5.3 5.3"></path><path d="M16 22l5.3-5.3a2 2 0 0 0 0-2.8c-.8-.8-2-.8-2.8 0L13.2 19"></path>
              </svg>
              Vincular Nodo
            </h3>
            <p style={estilos.descripcionCard}>Infiltrarse en una sala activa usando el código PIN de tus amigos.</p>
            <form onSubmit={manejarUnirseSala}>
              <input
                type="text"
                maxLength={6}
                placeholder="INGRESA PIN"
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value)}
                disabled={cargando}
                style={estilos.inputPin}
              />
              <button
                type="submit"
                disabled={cargando}
                style={{ ...estilos.btnAccion, backgroundColor: '#0AE8C6', color: '#09090b' }}
              >
                Unirse a Partida
              </button>
            </form>
          </div>

        </div>
      ) : (
        /* LOBBY INTERNO (ESPERA) */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '30px 0' }}>
          
          <div style={{ backgroundColor: '#141416', border: '1px solid #27272a', borderRadius: '20px', padding: '30px 20px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.4)', maxWidth: '400px', margin: '0 auto', width: '100%' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#71717a', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Código de Sala Activo
            </span>
            <div style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '8px', color: '#ffffff', margin: '16px 0' }}>
              {sala.codigo}
            </div>
            <p style={{ fontSize: '13px', color: '#a1a1aa', margin: 0, lineHeight: '1.5' }}>
              {esCreador 
                ? 'Eres el Host. Espera a tus oponentes en el lobby antes de iniciar.' 
                : `Sincronizado a la sesión de @${sala.creador_username.toLowerCase()}.`
              }
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: 'auto' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', border: '3px solid #27272a', borderTopColor: '#a78bfa', animation: 'spin 1s linear infinite' }} className="animate-spin" />
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#71717a', letterSpacing: '1px', marginTop: '16px', textTransform: 'uppercase' }}>
              Sincronizando...
            </span>
          </div>

          <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
            {esCreador ? (
              <button
                type="button"
                onClick={manejarIniciarJuego}
                style={{ ...estilos.btnAccion, backgroundColor: '#10b981', color: '#09090b', padding: '16px', fontSize: '14px', borderRadius: '12px' }}
              >
                Lanzar Partida 🚀
              </button>
            ) : (
              <div style={{ backgroundColor: '#09090b', border: '1px dashed #27272a', padding: '16px', borderRadius: '12px', textTransform: 'uppercase', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', color: '#52525b', letterSpacing: '1px' }}>
                Esperando orden del Host...
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default LobbyView;