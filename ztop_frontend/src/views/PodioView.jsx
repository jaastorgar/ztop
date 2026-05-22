import React, { useContext, useState, useEffect } from 'react';
import { JuegoContext } from '../context/JuegoContext';
import LayoutMobile from '../components/LayoutMobile';
import Boton from '../components/Boton';

export const PodioView = ({ onNextRound }) => {
  const { usuario, sala, letra } = useContext(JuegoContext);
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const consultarResultadosReales = async () => {
      try {
        // Consultamos directamente el estado y las rondas actualizadas en PostgreSQL
        const respuesta = await fetch(`http://127.0.0.1:8000/api/sala/${sala?.codigo}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${usuario?.token}`
          }
        });
        
        const datos = await respuesta.json();
        
        if (respuesta.ok && datos.rondas && datos.rondas.length > 0) {
          // Extraemos la última ronda jugada de la lista
          const ultimaRonda = datos.rondas[datos.rondas.length - 1];
          
          if (ultimaRonda.respuestas) {
            // Mapeamos los campos del serializador de Django a nuestro estado visual
            const procesados = ultimaRonda.respuestas.map(resp => ({
              username: resp.jugador_username,
              nombre: resp.nombre,
              apellido: resp.apellido,
              ciudadPais: resp.ciudad_pais,
              animal: resp.animal,
              cosa: resp.cosa,
              total: resp.total_puntos_ronda
            }));
            
            // Ordenamos el ranking de mayor a menor puntuación
            setResultados(procesados.sort((a, b) => b.total - a.total));
          }
        }
      } catch (err) {
        console.error("Error al conectar con PostgreSQL para el podio:", err);
      } finally {
        setCargando(false);
      }
    };

    if (sala?.codigo && usuario?.token) {
      consultarResultadosReales();
    }
  }, [sala, usuario]);

  const esCreador = sala && sala.creador_username === usuario?.username;

  return (
    <LayoutMobile>
      <div className="flex-1 flex flex-col justify-between p-6 bg-white h-full">
        
        {/* Encabezado del Podio */}
        <div className="text-center pt-4 flex flex-col items-center">
          <span className="bg-light-purple text-secondary-purple text-xs px-3 py-1.5 rounded-full font-heading font-bold uppercase tracking-wider mb-2">
            Resultados de la Ronda
          </span>
          <h2 className="font-heading font-black text-3xl text-dark-text tracking-tight">
            Podio Oficial <span className="text-primary-purple">Letra {letra || 'J'}</span>
          </h2>
        </div>

        {/* Listado de Jugadores Reales */}
        {cargando ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary-purple border-t-turquoise rounded-full animate-spin"></div>
            <span className="font-sans text-xs text-gray-400 mt-2">Sincronizando con PostgreSQL...</span>
          </div>
        ) : (
          <div className="flex-1 my-6 flex flex-col gap-3 overflow-y-auto max-h-[50vh] py-2 px-1">
            {resultados.length === 0 ? (
              <div className="text-center text-sm font-sans text-gray-400 my-auto">
                No se registraron respuestas en esta ronda.
              </div>
            ) : (
              resultados.map((jugador, index) => {
                const esPrimerLugar = index === 0;
                const esUsuarioActual = jugador.username === usuario?.username;

                return (
                  <div 
                    key={jugador.username}
                    className={`p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between
                      ${esPrimerLugar 
                        ? 'bg-light-purple/60 border-secondary-purple/40 shadow-md' 
                        : 'bg-white border-[#e6e6e6] shadow-sm'
                      }
                      ${esUsuarioActual ? 'ring-2 ring-primary-purple ring-offset-2' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-heading font-black text-sm
                        ${esPrimerLugar ? 'bg-turquoise text-primary-purple text-base' : 'bg-gray-100 text-muted-text'}
                      `}>
                        {index + 1}
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="font-heading font-bold text-base text-dark-text flex items-center gap-1.5">
                          {jugador.username}
                          {esUsuarioActual && (
                            <span className="text-[10px] bg-primary-purple text-white px-1.5 py-0.5 rounded-md font-sans font-medium uppercase">
                              Tú
                            </span>
                          )}
                        </span>
                        <span className="font-sans text-xs text-gray-400 truncate max-w-[200px]">
                          {jugador.nombre || '-'}, {jugador.apellido || '-'}, {jugador.ciudadPais || '-'}, {jugador.animal || '-'}, {jugador.cosa || '-'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`font-heading font-black text-lg ${esPrimerLugar ? 'text-secondary-purple' : 'text-dark-text'}`}>
                        {jugador.total}
                      </span>
                      <span className="block font-sans text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        Pts
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Footer con controles dinámicos para avanzar */}
        <div className="pb-4">
          {esCreador ? (
            <Boton variant="primary" onClick={onNextRound}>
              Siguiente Ronda 🔄
            </Boton>
          ) : (
            <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl text-center font-sans text-sm text-gray-400 font-medium animate-pulse">
              ⏱️ Esperando que el host inicie otra ronda...
            </div>
          )}
        </div>

      </div>
    </LayoutMobile>
  );
};

export default PodioView;