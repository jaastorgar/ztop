import React, { useState, useContext, useEffect } from 'react';
import { JuegoContext } from '../context/JuegoContext';

export const JuegoView = ({ onTimeOut }) => {
  const { 
    usuario, 
    sala, 
    letra, 
    estadoJuego, 
    cronometro, 
    pantallaCongelada, 
    enviarStop 
  } = useContext(JuegoContext);

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [ciudadPais, setCiudadPais] = useState('');
  const [animal, setAnimal] = useState('');
  const [cosa, setCosa] = useState('');

  const [enviando, setEnviando] = useState(false);
  const [mensajeServidor, setMensajeServidor] = useState('');

  // Efecto que reacciona de inmediato cuando el WebSocket da la orden de congelar
  useEffect(() => {
    if (pantallaCongelada) {
      guardarRespuestasFinales();
    }
    // eslint-disable-next-line
  }, [pantallaCongelada]);

  // Manejo del cambio de pantalla hacia el Podio al terminar el conteo
  useEffect(() => {
    if (estadoJuego === 'terminado' && onTimeOut) {
      const timer = setTimeout(() => {
        onTimeOut();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [estadoJuego, onTimeOut]);

  const guardarRespuestasFinales = async () => {
    if (enviando) return;
    setEnviando(true);
    setMensajeServidor('Congelando pantalla y subiendo respuestas...');

    // 💡 URL APUNTANDO DIRECTO A TU SERVIDOR EN LA RED LOCAL
    const API_URL = `http://192.168.18.199:8000/api/sala/${sala?.codigo}/responder/`;

    const payload = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      ciudad_pais: ciudadPais.trim(),
      animal: animal.trim(),
      cosa: cosa.trim()
    };

    try {
      const respuesta = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${usuario?.token}`
        },
        body: JSON.stringify(payload)
      });

      if (respuesta.ok) {
        setMensajeServidor('¡Respuestas sincronizadas con éxito!');
      } else {
        const errorData = await respuesta.json();
        setMensajeServidor(errorData.error || 'El servidor bloqueó la ronda.');
      }
    } catch (err) {
      setMensajeServidor('Error de conexión con la central.');
    } finally {
      setEnviando(false);
    }
  };

  const modoAlerta = estadoJuego === 'cuenta_regresiva';

  // ESTILOS EN LÍNEA TÁCTICOS Y DE ALTA FIDELIDAD
  const estilos = {
    contenedorBase: {
      position: 'fixed', inset: 0, width: '100vw', height: '100vh',
      backgroundColor: '#09090b', color: '#e4e4e7',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
      zIndex: 9999, overflow: 'hidden'
    },
    topBar: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: '#141416', borderBottom: modoAlerta ? '2px solid #ef4444' : '1px solid #27272a',
      padding: '16px 20px', transition: 'all 0.3s',
      boxShadow: modoAlerta ? '0 4px 20px rgba(239, 68, 68, 0.2)' : '0 4px 20px rgba(0,0,0,0.5)'
    },
    letraCaja: {
      width: '48px', height: '48px', borderRadius: '12px',
      backgroundColor: '#18181b', border: '2px solid #a78bfa',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '28px', fontWeight: '900', color: '#fff',
      boxShadow: '0 0 15px rgba(167, 139, 250, 0.4)', textTransform: 'uppercase'
    },
    scrollArea: {
      flex: 1, padding: '20px', overflowY: 'auto', display: 'flex',
      flexDirection: 'column', gap: '16px', boxSizing: 'border-box'
    },
    inputWrapper: {
      display: 'flex', flexDirection: 'column', gap: '6px'
    },
    label: {
      fontSize: '11px', fontWeight: '900', color: '#0ae8c6', textTransform: 'uppercase', letterSpacing: '1px'
    },
    input: {
      width: '100%', backgroundColor: '#141416', border: '1px solid #27272a',
      borderRadius: '12px', padding: '16px', color: '#fff', fontSize: '15px',
      outline: 'none', boxSizing: 'border-box', transition: 'border 0.2s',
      textTransform: 'uppercase'
    },
    footer: {
      backgroundColor: '#141416', borderTop: modoAlerta ? '2px solid #ef4444' : '1px solid #27272a',
      padding: '20px', paddingBottom: '30px', boxSizing: 'border-box'
    },
    btnStop: {
      width: '100%', padding: '18px', borderRadius: '14px', border: 'none',
      backgroundColor: modoAlerta ? '#ef4444' : '#a78bfa',
      color: modoAlerta ? '#fff' : '#09090b',
      fontSize: '18px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px',
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
      boxShadow: modoAlerta ? '0 0 25px rgba(239, 68, 68, 0.6)' : '0 5px 20px rgba(167, 139, 250, 0.4)',
      transition: 'all 0.2s', boxSizing: 'border-box'
    }
  };

  return (
    <div style={estilos.contenedorBase}>
      
      {/* BARRA SUPERIOR ESTRATÉGICA */}
      <div style={estilos.topBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: '#71717a', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>Objetivo</span>
            <span style={{ fontSize: '14px', color: '#e4e4e7', fontWeight: '900' }}>Con la Letra</span>
          </div>
          <div style={estilos.letraCaja}>
            {letra || '?'}
          </div>
        </div>

        {modoAlerta ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', animation: 'pulse 1s infinite' }}>
            <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>
              ¡Alerta Roja!
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span style={{ fontSize: '28px', fontWeight: '900', fontVariantNumeric: 'tabular-nums' }}>
                00:{cronometro < 10 ? `0${cronometro}` : cronometro}
              </span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '10px', color: '#0ae8c6', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Estado
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0ae8c6' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0ae8c6', boxShadow: '0 0 8px #0ae8c6' }} />
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>En Progreso</span>
            </div>
          </div>
        )}
      </div>

      {/* ÁREA DE INPUTS TÁCTICOS */}
      <div style={estilos.scrollArea}>
        {mensajeServidor && (
          <div style={{ backgroundColor: 'rgba(167,139,250,0.1)', border: '1px solid #a78bfa', color: '#a78bfa', padding: '12px', borderRadius: '10px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>
            {mensajeServidor}
          </div>
        )}

        <div style={estilos.inputWrapper}>
          <label style={estilos.label}>1. Nombre</label>
          <input
            type="text"
            placeholder={`Palabra con ${letra}...`}
            style={{...estilos.input, opacity: pantallaCongelada ? 0.5 : 1}}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={pantallaCongelada}
          />
        </div>

        <div style={estilos.inputWrapper}>
          <label style={estilos.label}>2. Apellido</label>
          <input
            type="text"
            placeholder={`Palabra con ${letra}...`}
            style={{...estilos.input, opacity: pantallaCongelada ? 0.5 : 1}}
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            disabled={pantallaCongelada}
          />
        </div>

        <div style={estilos.inputWrapper}>
          <label style={estilos.label}>3. Ciudad o País</label>
          <input
            type="text"
            placeholder={`Palabra con ${letra}...`}
            style={{...estilos.input, opacity: pantallaCongelada ? 0.5 : 1}}
            value={ciudadPais}
            onChange={(e) => setCiudadPais(e.target.value)}
            disabled={pantallaCongelada}
          />
        </div>

        <div style={estilos.inputWrapper}>
          <label style={estilos.label}>4. Animal</label>
          <input
            type="text"
            placeholder={`Palabra con ${letra}...`}
            style={{...estilos.input, opacity: pantallaCongelada ? 0.5 : 1}}
            value={animal}
            onChange={(e) => setAnimal(e.target.value)}
            disabled={pantallaCongelada}
          />
        </div>

        <div style={estilos.inputWrapper}>
          <label style={estilos.label}>5. Cosa</label>
          <input
            type="text"
            placeholder={`Palabra con ${letra}...`}
            style={{...estilos.input, opacity: pantallaCongelada ? 0.5 : 1}}
            value={cosa}
            onChange={(e) => setCosa(e.target.value)}
            disabled={pantallaCongelada}
          />
        </div>
        
        {/* Espaciador inferior */}
        <div style={{ height: '20px' }}></div>
      </div>

      {/* FOOTER CON BOTÓN DE DETONACIÓN (STOP) */}
      <div style={estilos.footer}>
        <button
          onClick={enviarStop}
          disabled={pantallaCongelada}
          style={{...estilos.btnStop, opacity: pantallaCongelada ? 0.5 : 1}}
        >
          {modoAlerta ? (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              CONGELANDO ({cronometro}s)
            </>
          ) : pantallaCongelada ? (
            'Tiempo Terminado'
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 9h6v6H9z"></path></svg>
              Presionar Stop
            </>
          )}
        </button>
      </div>

    </div>
  );
};

export default JuegoView;