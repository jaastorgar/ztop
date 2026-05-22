import React, { useState, useContext, useEffect } from 'react';
import { JuegoContext } from '../context/JuegoContext';
import LayoutMobile from '../components/LayoutMobile';
import InputTexto from '../components/InputTexto';
import Boton from '../components/Boton';

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
    setMensajeServidor('Congelando pantalla y guardando respuestas...');

    // SOLUCIÓN EXTRA-ROBUSTA: Apuntamos al código único de la sala en vez del ID de la ronda.
    // Esto evita desajustes asíncronos en el cliente y deja el control en PostgreSQL.
    const API_URL = `http://127.0.0.1:8000/api/sala/${sala?.codigo}/responder/`;

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
        setMensajeServidor('¡Respuestas guardadas con éxito!');
      } else {
        const errorData = await respuesta.json();
        setMensajeServidor(errorData.error || 'El servidor bloqueó la ronda.');
      }
    } catch (err) {
      setMensajeServidor('Error al conectar con el servidor.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <LayoutMobile>
      <div className="flex-1 flex flex-col justify-between bg-white relative">
        
        {/* Barra Superior */}
        <div className="px-6 py-4 bg-light-purple/30 border-b border-[#e6e6e6] flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-xs font-heading font-black uppercase tracking-widest text-muted-text">
              Letra
            </span>
            <div className="w-14 h-14 rounded-2xl bg-primary-purple flex items-center justify-center shadow-md">
              <span className="font-heading font-black text-3xl text-white">
                {letra || '?'}
              </span>
            </div>
          </div>

          {estadoJuego === 'cuenta_regresiva' ? (
            <div className="flex flex-col items-end animate-bounce">
              <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-red-500">
                ¡Alguien dijo Stop!
              </span>
              <span className="font-heading font-black text-3xl text-red-500">
                00:{cronometro < 10 ? `0${cronometro}` : cronometro}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-green-500">
                Ronda Activa
              </span>
              <span className="font-sans text-xs font-semibold text-muted-text">
                ¡Escribe rápido!
              </span>
            </div>
          )}
        </div>

        {/* Formulario de entrada táctil */}
        <div className="flex-1 px-5 py-4 flex flex-col gap-5 overflow-y-auto max-h-[55vh]">
          {mensajeServidor && (
            <div className="p-3 bg-primary-purple text-white text-xs font-heading font-bold text-center rounded-xl">
              {mensajeServidor}
            </div>
          )}

          <InputTexto
            label="1. Nombre"
            placeholder={`Con ${letra}...`}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={pantallaCongelada}
          />

          <InputTexto
            label="2. Apellido"
            placeholder={`Con ${letra}...`}
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            disabled={pantallaCongelada}
          />

          <InputTexto
            label="3. Ciudad o País"
            placeholder={`Con ${letra}...`}
            value={ciudadPais}
            onChange={(e) => setCiudadPais(e.target.value)}
            disabled={pantallaCongelada}
          />

          <InputTexto
            label="4. Animal"
            placeholder={`Con ${letra}...`}
            value={animal}
            onChange={(e) => setAnimal(e.target.value)}
            disabled={pantallaCongelada}
          />

          <InputTexto
            label="5. Cosa"
            placeholder={`Con ${letra}...`}
            value={cosa}
            onChange={(e) => setCosa(e.target.value)}
            disabled={pantallaCongelada}
          />
        </div>

        {/* Botón de STOP Dinámico y Táctil */}
        <div className="p-6 bg-white border-t border-[#e6e6e6] pb-8">
          <Boton
            variant={estadoJuego === 'cuenta_regresiva' ? 'danger' : 'stop'}
            onClick={enviarStop}
            disabled={pantallaCongelada}
          >
            {estadoJuego === 'cuenta_regresiva' ? `¡CONGELANDO (${cronometro}s)! ⏱️` : '¡STOP! ✋'}
          </Boton>
        </div>

      </div>
    </LayoutMobile>
  );
};

export default JuegoView;