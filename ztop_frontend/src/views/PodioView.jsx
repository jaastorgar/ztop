import React, { useContext, useState, useEffect } from 'react';
import { JuegoContext } from '../context/JuegoContext';

export const PodioView = ({ onNextRound }) => {
  const { usuario, sala, letra } = useContext(JuegoContext);
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const consultarResultados = async () => {
      try {
        const respuesta = await fetch(`http://192.168.18.199:8000/api/sala/${sala?.codigo}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${usuario?.token}`
          }
        });
        
        const datos = await respuesta.json();
        
        if (respuesta.ok && datos.rondas && datos.rondas.length > 0) {
          const ultimaRonda = datos.rondas[datos.rondas.length - 1];
          
          if (ultimaRonda.respuestas) {
            // Mapeo detallado basado en tus modelos de Django
            const procesados = ultimaRonda.respuestas.map(resp => ({
              username: resp.jugador_username,
              nombre: resp.nombre,
              apellido: resp.apellido,
              ciudadPais: resp.ciudad_pais,
              animal: resp.animal,
              cosa: resp.cosa,
              // Asumimos que total_puntos_ronda ya viene calculado del backend
              total: resp.total_puntos_ronda || 0 
            }));
            
            // Ordenamos de mayor a menor puntaje
            setResultados(procesados.sort((a, b) => b.total - a.total));
          }
        }
      } catch (err) {
        console.error("Error al obtener resultados:", err);
      } finally {
        setCargando(false);
      }
    };

    if (sala?.codigo) consultarResultados();
  }, [sala, usuario]);

  const esCreador = sala && sala.creador_username === usuario?.username;

  return (
    <div style={estilos.contenedorBase}>
      <header style={estilos.header}>
        <h1 style={estilos.titulo}>Resultados: Letra {letra}</h1>
      </header>

      <div style={estilos.listaContainer}>
        {cargando ? (
          <div style={estilos.cargando}>Procesando métricas...</div>
        ) : (
          resultados.map((jugador, index) => (
            <div key={jugador.username} style={estilos.fila(jugador.username === usuario?.username)}>
              <div style={estilos.infoJugador}>
                <span style={estilos.posicion}>{index + 1}</span>
                <div>
                  <div style={estilos.username}>{jugador.username}</div>
                  <div style={estilos.respuestas}>
                    {jugador.nombre} • {jugador.animal} • {jugador.cosa}
                  </div>
                </div>
              </div>
              <div style={estilos.puntaje}>{jugador.total} pts</div>
            </div>
          ))
        )}
      </div>

      <div style={estilos.footer}>
        {esCreador ? (
          <button style={estilos.btnPrincipal} onClick={onNextRound}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 1 1 0 6M20.49 15a9 9 0 1 1 0-6"/>
            </svg>
            Siguiente Ronda
          </button>
        ) : (
          <div style={estilos.espera}>Esperando al Host...</div>
        )}
      </div>
    </div>
  );
};

const estilos = {
  contenedorBase: {
    position: 'fixed', inset: 0, backgroundColor: '#09090b', color: '#e4e4e7',
    padding: '24px', fontFamily: 'system-ui, sans-serif', overflowY: 'auto'
  },
  header: { marginBottom: '24px', textAlign: 'center' },
  titulo: { fontSize: '20px', fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' },
  listaContainer: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' },
  fila: (esPropio) => ({
    backgroundColor: '#141416', border: esPropio ? '1px solid #0ae8c6' : '1px solid #27272a',
    borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  }),
  infoJugador: { display: 'flex', alignItems: 'center', gap: '12px' },
  posicion: { fontWeight: '900', color: '#a78bfa', fontSize: '18px' },
  username: { fontWeight: '700', fontSize: '14px' },
  respuestas: { fontSize: '10px', color: '#71717a', marginTop: '4px' },
  puntaje: { fontWeight: '900', color: '#0ae8c6', fontSize: '16px' },
  cargando: { textAlign: 'center', color: '#52525b', marginTop: '40px' },
  footer: { marginTop: 'auto', paddingTop: '20px' },
  btnPrincipal: {
    width: '100%', padding: '16px', backgroundColor: '#0ae8c6', color: '#09090b',
    border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '900',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer'
  },
  espera: { 
    padding: '16px', border: '1px solid #27272a', borderRadius: '12px', 
    textAlign: 'center', color: '#52525b', fontSize: '12px', fontWeight: 'bold' 
  }
};

export default PodioView;