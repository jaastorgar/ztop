import React, { useState, useContext, useEffect } from 'react';
import { JuegoContext } from '../context/JuegoContext';

// 💡 IMPORTACIÓN CORRECTA DE TU LOGO LOCAL
import logoZtop from '../assets/ztop!.png';

export const LoginView = ({ onLoginSuccess }) => {
  const { setUsuario } = useContext(JuegoContext);
  
  // Estados de Transición y Splash
  const [mostrarSplash, setMostrarSplash] = useState(true);
  const [animarCampos, setAnimarFields] = useState(false);

  // Estados del Formulario
  const [esRegistro, setEsRegistro] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  // Lógica de Transición Inicial (Splash a Formulario)
  useEffect(() => {
    const timerSplash = setTimeout(() => {
      setMostrarSplash(false);
      setTimeout(() => setAnimarFields(true), 100);
    }, 2500);
    return () => clearTimeout(timerSplash);
  }, []);

  const API_URL = 'http://192.168.18.199:8000/api/auth';

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const endpoint = esRegistro ? 'registro' : 'login';
      const respuesta = await fetch(`${API_URL}/${endpoint}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const datos = await respuesta.json();

      if (respuesta.ok) {
        setUsuario({ token: datos.token, username: datos.username, perfilId: datos.perfil_id });
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setError(datos.error || 'Fallo en la autenticación.');
      }
    } catch (err) {
      setError('Central fuera de línea.');
    } finally {
      setCargando(false);
    }
  };

  const estilos = {
    contenedorBase: {
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#09090b',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      zIndex: 10000
    },
    logoContainer: {
      transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: mostrarSplash ? 'scale(1.1)' : 'translateY(-140px) scale(0.85)',
      position: 'absolute',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    },
    logoZ: {
      width: '260px', // Un poco más grande para compensar el espacio transparente de tu imagen
      filter: 'drop-shadow(0 0 15px rgba(167, 139, 250, 0.4))'
    },
    formContainer: {
      width: '85%',
      maxWidth: '320px', // Un poco más compacto para celulares
      transition: 'all 0.6s ease-out',
      opacity: animarCampos ? 1 : 0,
      transform: animarCampos ? 'translateY(70px)' : 'translateY(120px)',
      display: mostrarSplash ? 'none' : 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px', // Espaciado exacto y uniforme entre todos los elementos
      boxSizing: 'border-box'
    },
    input: {
      width: '100%',
      boxSizing: 'border-box', // 💡 ESTO ES CLAVE: Evita que el padding ensanche el input
      backgroundColor: '#141416',
      border: '1px solid #27272a',
      borderRadius: '12px',
      padding: '16px', // Mismo padding que el botón para que tengan la misma altura
      color: '#fff',
      fontSize: '14px',
      outline: 'none',
      textAlign: 'center',
      letterSpacing: '1px',
      margin: 0
    },
    btnMain: {
      width: '100%',
      boxSizing: 'border-box', // 💡 CLAVE PARA ALINEACIÓN PERFECTA
      padding: '16px', // Mismo padding que los inputs
      borderRadius: '12px',
      border: 'none',
      backgroundColor: '#a78bfa',
      color: '#000',
      fontSize: '14px',
      fontWeight: '900',
      textTransform: 'uppercase',
      cursor: 'pointer',
      boxShadow: '0 5px 15px rgba(167, 139, 250, 0.3)',
      transition: 'all 0.2s',
      margin: 0
    }
  };

  return (
    <div style={estilos.contenedorBase}>
      {/* SECCIÓN LOGO (SPLASH) */}
      <div style={estilos.logoContainer}>
        <img 
          src={logoZtop} 
          alt="ZTOP Logo" 
          style={estilos.logoZ} 
        />
      </div>

      {/* SECCIÓN FORMULARIO (LOGIN / REGISTRO) */}
      <form style={estilos.formContainer} onSubmit={manejarEnvio}>
        {error && (
          <div style={{ width: '100%', boxSizing: 'border-box', color: '#f87171', textAlign: 'center', fontSize: '12px', background: 'rgba(248,113,113,0.1)', padding: '10px', borderRadius: '8px' }}>
            {error}
          </div>
        )}
        
        <input
          type="text"
          placeholder="USERNAME"
          style={estilos.input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        
        <input
          type="password"
          placeholder="CONTRASEÑA"
          style={estilos.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" style={estilos.btnMain} disabled={cargando}>
          {cargando ? 'Sincronizando...' : esRegistro ? 'Registrar' : 'Entrar'}
        </button>

        <p 
          onClick={() => {
            setEsRegistro(!esRegistro);
            setError('');
          }}
          style={{ color: '#71717a', fontSize: '12px', textAlign: 'center', cursor: 'pointer', marginTop: '8px', padding: '10px', width: '100%' }}
        >
          {esRegistro ? '¿Ya tienes cuenta? Ingresa' : '¿No tienes cuenta? Crea una'}
        </p>
      </form>
    </div>
  );
};

export default LoginView;