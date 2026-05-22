import React, { useState, useContext } from 'react';
import { JuegoContext } from '../context/JuegoContext';
import LayoutMobile from '../components/LayoutMobile';
import InputTexto from '../components/InputTexto';
import Boton from '../components/Boton';

export const LoginView = ({ onLoginSuccess }) => {
  const { setUsuario } = useContext(JuegoContext);
  
  // Estado para alternar entre modo Login y modo Registro
  const [esRegistro, setEsRegistro] = useState(false);
  
  // Estados para los campos del formulario
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [edad, setEdad] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [email, setEmail] = useState('');
  
  // Estados de control de la UI
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const API_URL = 'http://127.0.0.1:8000/api/auth';

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    if (!username || !password) {
      setError('Por favor, completa los campos básicos.');
      setCargando(false);
      return;
    }

    try {
      if (esRegistro) {
        // --- FLUJO DE REGISTRO ---
        const payloadRegistro = {
          username,
          password,
          perfil: {
            username,
            nombre_completo: nombreCompleto,
            edad: parseInt(edad, 10),
            fecha_nacimiento: fechaNacimiento,
            email,
            avatar_url: ""
          }
        };

        const respuesta = await fetch(`${API_URL}/registrar/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadRegistro),
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
          // Si el registro es exitoso, pasamos automáticamente al login
          setEsRegistro(false);
          setError('¡Cuenta creada! Por favor, inicia sesión.');
        } else {
          setError(datos.username?.[0] || datos.perfil?.email?.[0] || 'Error en el registro.');
        }
      } else {
        // --- FLUJO DE LOGIN ---
        const respuesta = await fetch(`${API_URL}/login/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
          // Guardamos el token y datos del perfil en el contexto global
          setUsuario({
            token: datos.token,
            username: datos.username,
            perfilId: datos.perfil_id
          });
          if (onLoginSuccess) onLoginSuccess();
        } else {
          setError(datos.error || 'Credenciales incorrectas.');
        }
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor de ztop!.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <LayoutMobile>
      <div className="flex-1 flex flex-col justify-between p-6 bg-white">
        
        {/* Cabecera / Branding */}
        <div className="flex flex-col items-center pt-8">
          <div className="text-center">
            <h1 className="font-heading font-extrabold text-5xl tracking-tighter text-primary-purple">
              ztop<span className="text-turquoise">!</span>
            </h1>
            <p className="font-sans text-sm text-muted-text mt-1 font-medium">
              {esRegistro ? 'Crea tu perfil de jugador móvil' : 'El Bachillerato en tiempo real'}
            </p>
          </div>
        </div>

        {/* Formulario Dinámico */}
        <form onSubmit={manejarEnvio} className="flex-col flex gap-4 my-auto overflow-y-auto max-h-[60vh] py-2">
          {error && (
            <div className={`p-3 rounded-xl text-sm font-semibold text-center ${error.includes('creada') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
              {error}
            </div>
          )}

          <InputTexto
            label="Username / Apodo"
            placeholder="Ej: javi_andres"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={cargando}
          />

          <InputTexto
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={cargando}
          />

          {esRegistro && (
            <>
              <InputTexto
                label="Nombre Completo"
                placeholder="Juan Pérez"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                disabled={cargando}
              />
              <div className="flex gap-2 w-full">
                <div className="w-1/3">
                  <InputTexto
                    label="Edad"
                    type="number"
                    placeholder="25"
                    value={edad}
                    onChange={(e) => setEdad(e.target.value)}
                    disabled={cargando}
                  />
                </div>
                <div className="w-2/3">
                  <InputTexto
                    label="Fecha Nacimiento"
                    type="date"
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    disabled={cargando}
                  />
                </div>
              </div>
              <InputTexto
                label="Correo Electrónico"
                type="email"
                placeholder="nombre@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={cargando}
              />
            </>
          )}
        </form>

        {/* Botones de Acción inferior */}
        <div className="flex flex-col gap-3 pb-4">
          <Boton type="submit" onClick={manejarEnvio} disabled={cargando}>
            {cargando ? 'Procesando...' : esRegistro ? 'Registrarme' : 'Entrar a Jugar'}
          </Boton>
          
          <button
            type="button"
            onClick={() => {
              setEsRegistro(!esRegistro);
              setError('');
            }}
            className="text-sm font-heading font-bold text-secondary-purple text-center py-2 active:text-primary-purple"
          >
            {esRegistro ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate aquí'}
          </button>
        </div>

      </div>
    </LayoutMobile>
  );
};

export default LoginView;