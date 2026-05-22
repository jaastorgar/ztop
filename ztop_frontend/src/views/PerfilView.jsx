import React, { useState, useEffect, useContext } from 'react';
import { JuegoContext } from '../context/JuegoContext';

export const PerfilView = ({ onBackToLobby }) => {
  const { usuario, setUsuario } = useContext(JuegoContext);
  
  const [perfilData, setPerfilData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // 💡 APUNTANDO A TU RED LOCAL
  const API_URL = 'http://192.168.18.199:8000/api/auth/perfil/';

  useEffect(() => {
    const obtenerPerfil = async () => {
      try {
        const respuesta = await fetch(API_URL, {
          headers: {
            'Authorization': `Token ${usuario?.token}`
          }
        });
        
        if (respuesta.ok) {
          const datos = await respuesta.json();
          setPerfilData(datos);
        } else {
          // Si el endpoint falla o aún no está listo, usamos datos de respaldo visuales
          setError('Conexión inestable. Mostrando caché local.');
          setPerfilData({
            nombre_completo: 'Cargando...',
            email: usuario?.username + '@ztop.cl',
            edad: '--',
            partidas_jugadas: 0,
            partidas_ganadas: 0
          });
        }
      } catch (err) {
        setError('Sin conexión a la central.');
        setPerfilData({
          nombre_completo: 'Agente Offline',
          email: 'offline@ztop.cl',
          edad: '--',
          partidas_jugadas: '--',
          partidas_ganadas: '--'
        });
      } finally {
        setCargando(false);
      }
    };

    obtenerPerfil();
  }, [usuario]);

  // ESTILOS EN LÍNEA: Tácticos, inmersivos y perfectamente centrados (border-box)
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
      boxSizing: 'border-box',
      zIndex: 10000, 
      overflowY: 'auto'
    },
    header: {
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      borderBottom: '1px solid #1f1f22', 
      paddingBottom: '16px', 
      marginBottom: '24px'
    },
    btnVolver: {
      backgroundColor: 'transparent', 
      border: 'none', 
      color: '#a1a1aa',
      fontSize: '14px', 
      fontWeight: 'bold', 
      cursor: 'pointer', 
      display: 'flex',
      alignItems: 'center', 
      gap: '6px', 
      padding: '8px 0',
      transition: 'color 0.2s'
    },
    tituloCentro: {
      margin: 0, 
      fontSize: '16px', 
      fontWeight: '900', 
      color: '#fff', 
      textTransform: 'uppercase', 
      letterSpacing: '1px'
    },
    // Contenedor principal centrado
    contenidoWrapper: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      maxWidth: '350px',
      margin: '0 auto'
    },
    cardPrincipal: {
      backgroundColor: '#141416', 
      border: '1px solid #27272a', 
      borderRadius: '16px',
      padding: '24px', 
      textAlign: 'center', 
      marginBottom: '20px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.4)', 
      width: '100%',
      boxSizing: 'border-box'
    },
    avatarWrapper: {
      width: '76px', 
      height: '76px', 
      borderRadius: '50%', 
      backgroundColor: '#18181b',
      margin: '0 auto 16px auto', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontSize: '32px', 
      color: '#a78bfa', 
      fontWeight: '900', 
      border: '2px solid rgba(167, 139, 250, 0.5)',
      boxShadow: '0 0 20px rgba(167, 139, 250, 0.2)'
    },
    gridStats: {
      display: 'grid', 
      gridTemplateColumns: '1fr 1fr', 
      gap: '14px',
      width: '100%', 
      marginBottom: '24px',
      boxSizing: 'border-box'
    },
    statBoxMorada: {
      backgroundColor: '#141416', 
      border: '1px solid rgba(167, 139, 250, 0.3)',
      borderRadius: '14px', 
      padding: '16px 10px', 
      textAlign: 'center', 
      boxSizing: 'border-box'
    },
    statBoxTurquesa: {
      backgroundColor: '#141416', 
      border: '1px solid rgba(10, 232, 198, 0.3)',
      borderRadius: '14px', 
      padding: '16px 10px', 
      textAlign: 'center', 
      boxSizing: 'border-box'
    },
    numeroStat: {
      fontSize: '32px', 
      fontWeight: '900', 
      margin: '0 0 4px 0',
      letterSpacing: '1px'
    },
    labelStat: {
      fontSize: '10px', 
      color: '#a1a1aa', 
      textTransform: 'uppercase', 
      letterSpacing: '0.5px', 
      margin: 0,
      fontWeight: 'bold'
    },
    listaInfo: {
      backgroundColor: '#141416', 
      border: '1px solid #27272a', 
      borderRadius: '16px',
      padding: '0 16px', 
      width: '100%', 
      boxSizing: 'border-box'
    },
    itemInfo: {
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: '16px 0',
      borderBottom: '1px solid #1f1f22', 
      fontSize: '13px'
    },
    btnDesconectar: {
      width: '100%', 
      marginTop: 'auto', // Lo empuja al fondo
      padding: '16px',
      backgroundColor: 'rgba(239, 68, 68, 0.1)', 
      border: '1px solid rgba(239, 68, 68, 0.3)',
      color: '#f87171', 
      borderRadius: '12px', 
      fontSize: '14px', 
      fontWeight: '900',
      cursor: 'pointer', 
      textTransform: 'uppercase', 
      letterSpacing: '1px', 
      boxSizing: 'border-box'
    }
  };

  if (cargando) {
    return (
      <div style={{...estilos.contenedorBase, justifyContent: 'center', alignItems: 'center'}}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #27272a', borderTopColor: '#0ae8c6' }} className="animate-spin" />
        <p style={{ marginTop: '20px', color: '#a1a1aa', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Descifrando Agente...
        </p>
      </div>
    );
  }

  return (
    <div style={estilos.contenedorBase}>
      
      {/* HEADER TÁCTICO */}
      <header style={estilos.header}>
        <button onClick={onBackToLobby} style={estilos.btnVolver}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><polyline points="12 19 5 12 12 5"></polyline></svg>
          Volver
        </button>
        <h1 style={estilos.tituloCentro}>Centro de Mando</h1>
        <div style={{width: '60px'}}></div> {/* Espaciador invisible para centrar el título */}
      </header>

      {/* CONTENEDOR CENTRAL ALINEADO */}
      <div style={estilos.contenidoWrapper}>
        
        {error && (
          <div style={{ width: '100%', boxSizing: 'border-box', color: '#f59e0b', textAlign: 'center', fontSize: '11px', background: 'rgba(245,158,11,0.1)', padding: '10px', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(245,158,11,0.3)' }}>
            ⚠️ {error}
          </div>
        )}

        {/* TARJETA DE IDENTIDAD */}
        <div style={estilos.cardPrincipal}>
          <div style={estilos.avatarWrapper}>
            {usuario?.username?.charAt(0).toUpperCase()}
          </div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', color: '#fff', letterSpacing: '1px' }}>@{usuario?.username}</h2>
          <p style={{ margin: 0, color: '#0ae8c6', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {perfilData?.nombre_completo || 'Agente'}
          </p>
        </div>

        {/* GRID DE ESTADÍSTICAS DEL JUEGO */}
        <div style={estilos.gridStats}>
          <div style={estilos.statBoxMorada}>
            <p style={{...estilos.numeroStat, color: '#a78bfa'}}>{perfilData?.partidas_jugadas || 0}</p>
            <p style={estilos.labelStat}>Jugadas</p>
          </div>
          <div style={estilos.statBoxTurquesa}>
            <p style={{...estilos.numeroStat, color: '#0ae8c6'}}>{perfilData?.partidas_ganadas || 0}</p>
            <p style={estilos.labelStat}>Victorias</p>
          </div>
        </div>

        {/* DETALLES TÉCNICOS */}
        <div style={estilos.listaInfo}>
          <div style={estilos.itemInfo}>
            <span style={{color: '#71717a', fontWeight: 'bold'}}>Nivel de Acceso</span>
            <span style={{color: '#fff', fontWeight: '600'}}>Usuario ZTOP!</span>
          </div>
          <div style={estilos.itemInfo}>
            <span style={{color: '#71717a', fontWeight: 'bold'}}>Enlace</span>
            <span style={{color: '#fff', fontWeight: '600'}}>{perfilData?.email || 'Oculto'}</span>
          </div>
          <div style={{...estilos.itemInfo, borderBottom: 'none'}}>
            <span style={{color: '#71717a', fontWeight: 'bold'}}>Edad</span>
            <span style={{color: '#fff', fontWeight: '600'}}>{perfilData?.edad || '--'} años</span>
          </div>
        </div>

        {/* ESPACIADOR FLEXIBLE */}
        <div style={{ flex: 1, minHeight: '30px' }}></div>

        {/* BOTÓN DE DESCONEXIÓN SEGURO */}
        <button onClick={() => setUsuario(null)} style={estilos.btnDesconectar}>
          Desconectar Dispositivo
        </button>

      </div>
    </div>
  );
};

export default PerfilView;