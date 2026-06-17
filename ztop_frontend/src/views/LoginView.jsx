import React, { useState } from 'react';
import { HiUser, HiLockClosed, HiEnvelope, HiIdentification, HiCalendar } from "react-icons/hi2";
import logo from '../assets/ztop!.png'; 

const LoginView = ({ onLoginSuccess }) => {
  const [modo, setModo] = useState('login'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    nombreCompleto: '',
    edad: ''
  });

  const handleInputChange = (campo, valor) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const baseUrl = 'http://192.168.18.199:8000/api/auth';
    const urlEndpoint = modo === 'login' ? `${baseUrl}/login/` : `${baseUrl}/registrar/`;

    const payload = modo === 'login' ? {
      username: formData.username,
      password: formData.password
    } : {
      username: formData.username,
      password: formData.password,
      perfil: {
        nombre_completo: formData.nombreCompleto,
        email: formData.email,
        edad: formData.edad ? parseInt(formData.edad) : null
      }
    };

    try {
      const response = await fetch(urlEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (response.ok) {
        if (modo === 'login') {
          localStorage.setItem('ztop_token', data.token);
          localStorage.setItem('ztop_username', data.username);
          onLoginSuccess(data.token, data.username);
        } else {
          alert('¡Cuenta creada con éxito! Ahora inicia sesión.');
          setModo('login');
          setError('');
        }
      } else {
        setError(data.error || 'Ocurrió un error con los datos ingresados.');
      }
    } catch (err) {
      setError('Fallo de red. Verifica que tu servidor Django esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-[100dvh] flex flex-col bg-brand-darkBg items-center justify-center px-6 overflow-hidden select-none">
      
      {/* 🚀 SOLUCIÓN: '-mt-16' eleva todo el bloque para comerse el espacio muerto superior y darle aire abajo */}
      <div className="w-full max-w-sm flex flex-col -mt-16 transition-all duration-300">
        
        {/* LOGO SECTION - Dinámico y más compacto */}
        <div className={`w-full flex flex-col items-center transition-all duration-300 ${modo === 'registro' ? 'mb-4' : 'mb-6'}`}>
          <div className={`flex items-center justify-center drop-shadow-[0_2px_15px_rgba(10,232,198,0.3)] transition-all duration-500 ${modo === 'registro' ? 'w-20' : 'w-40'}`}>
            <img 
              src={logo} 
              alt="Ztop! Logo" 
              className="w-full h-auto object-contain" 
            />
          </div>
          
          {/* El eslogan solo existe en el DOM durante el Login, liberando espacio real en Registro */}
          {modo === 'login' && (
            <div className="mt-2 animate-fade-in">
              <p className="font-sans text-xs font-light tracking-wide text-brand-lightBg/60 text-center">
                Inmediatez Táctil Garantizada
              </p>
            </div>
          )}
        </div>

        {/* TABS SELECTOR */}
        <div className="bg-brand-primary/20 p-1 rounded-xl flex border border-white/5 mb-4">
          <button
            type="button"
            onClick={() => { setModo('login'); setError(''); }}
            className={`flex-1 h-10 rounded-lg font-title text-xs font-bold transition-all ${modo === 'login' ? 'bg-brand-secondary text-white shadow-touch-1' : 'text-white/40 hover:text-white/60'}`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setModo('registro'); setError(''); }}
            className={`flex-1 h-10 rounded-lg font-title text-xs font-bold transition-all ${modo === 'registro' ? 'bg-brand-secondary text-white shadow-touch-1' : 'text-white/40 hover:text-white/60'}`}
          >
            Registrarte
          </button>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="space-y-3">
          
          {/* USERNAME */}
          <div className="space-y-1">
            <label className="font-title text-[9px] font-bold uppercase tracking-widest text-white/50 ml-1">
              Usuario de Ztop!
            </label>
            <div className="relative">
              <HiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                required
                placeholder="usarname"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="w-full h-12 pl-11 pr-4 bg-brand-primary/20 text-white font-sans text-sm rounded-xl border border-white/10 placeholder:text-white/20 focus:outline-none focus:ring-1 focus:border-brand-accent focus:ring-brand-accent shadow-inner transition-all"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="space-y-1">
            <label className="font-title text-[9px] font-bold uppercase tracking-widest text-white/50 ml-1">
              Contraseña Secreta
            </label>
            <div className="relative">
              <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full h-12 pl-11 pr-4 bg-brand-primary/20 text-white font-sans text-sm rounded-xl border border-white/10 placeholder:text-white/20 focus:outline-none focus:ring-1 focus:border-brand-accent focus:ring-brand-accent shadow-inner transition-all"
              />
            </div>
          </div>

          {/* CAMPOS ADICIONALES DE REGISTRO */}
          {modo === 'registro' && (
            <div className="space-y-3 animate-fade-in-down">
              
              {/* NOMBRE REAL */}
              <div className="space-y-1">
                <label className="font-title text-[9px] font-bold uppercase tracking-widest text-white/50 ml-1">
                  Tu Nombre Real
                </label>
                <div className="relative">
                  <HiIdentification className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    required
                    placeholder="Gabriel García"
                    value={formData.nombreCompleto}
                    onChange={(e) => handleInputChange('nombreCompleto', e.target.value)}
                    className="w-full h-12 pl-11 pr-4 bg-brand-primary/20 text-white font-sans text-sm rounded-xl border border-white/10 placeholder:text-white/20 focus:outline-none focus:ring-1 focus:border-brand-accent focus:ring-brand-accent shadow-inner transition-all"
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div className="space-y-1">
                <label className="font-title text-[9px] font-bold uppercase tracking-widest text-white/50 ml-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <HiEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    required
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full h-12 pl-11 pr-4 bg-brand-primary/20 text-white font-sans text-sm rounded-xl border border-white/10 placeholder:text-white/20 focus:outline-none focus:ring-1 focus:border-brand-accent focus:ring-brand-accent shadow-inner transition-all"
                  />
                </div>
              </div>

              {/* EDAD */}
              <div className="space-y-1">
                <label className="font-title text-[9px] font-bold uppercase tracking-widest text-white/50 ml-1">
                  Edad (Opcional)
                </label>
                <div className="relative">
                  <HiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="number"
                    placeholder="Ej: 25"
                    value={formData.edad}
                    onChange={(e) => handleInputChange('edad', e.target.value)}
                    className="w-full h-12 pl-11 pr-4 bg-brand-primary/20 text-white font-sans text-sm rounded-xl border border-white/10 placeholder:text-white/20 focus:outline-none focus:ring-1 focus:border-brand-accent focus:ring-brand-accent shadow-inner transition-all"
                  />
                </div>
              </div>

            </div>
          )}

          {/* MENSAJES DE ERROR */}
          {error && (
            <div className="py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-center text-xs font-semibold text-red-400 animate-pulse mt-2">
              ⚠️ {error}
            </div>
          )}

          {/* BOTÓN DE SUBMIT */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-brand-accent text-brand-darkBg font-title text-base font-black rounded-xl shadow-[0_0_20px_rgba(10,232,198,0.3)] hover:bg-brand-accent/90 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-4 border-brand-darkBg border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>{modo === 'login' ? 'ENTRAR AL JUEGO' : 'COMPLETAR REGISTRO'}</span>
              )}
            </button>
            <p className="text-center font-sans text-[9px] text-white/30 mt-3">
              Al continuar aceptas la Política de Privacidad de Ztop!
            </p>
          </div>

        </form>
      </div>
    </div>
  );
};

export default LoginView;