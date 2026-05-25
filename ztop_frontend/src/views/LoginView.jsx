import React, { useState } from 'react';
import { HiUser, HiLockClosed, HiEnvelope, HiIdentification, HiArrowRightOnRectangle, HiUserPlus } from "react-icons/hi2";

const LoginView = ({ onLoginSuccess }) => {
  // 🎛️ Estado para alternar entre 'login' y 'registro'
  const [modo, setModo] = useState('login'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 📝 Estados del formulario unificado
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

  // 🔐 ENVIAR FORMULARIO A DJANGO REST API
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Reemplaza 'localhost' por tu IP local de red (ej: 192.168.18.199) para probar desde el celular real
    const baseUrl = 'http://192.168.18.199:8000/api/auth';
    const urlEndpoint = modo === 'login' ? `${baseUrl}/login/` : `${baseUrl}/registrar/`;

    // Formateamos el payload de forma idéntica a lo que esperan tus Serializers
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
          // 🚀 Guardamos las credenciales en el almacenamiento nativo del smartphone
          localStorage.setItem('ztop_token', data.token);
          localStorage.setItem('ztop_username', data.username);
          
          // Notificamos al App.jsx que el usuario se autenticó con éxito
          onLoginSuccess(data.token, data.username);
        } else {
          // Si se registró con éxito, lo movemos automáticamente a login con un mensaje limpio
          alert('¡Cuenta creada con éxito! Ahora inicia sesión.');
          setModo('login');
          setError('');
        }
      } else {
        // Mapeo inteligente de errores del backend
        setError(data.error || 'Ocurrió un error con los datos ingresados.');
      }
    } catch (err) {
      setError('Fallo de red. Verifica que tu servidor Django esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-brand-darkBg px-6 py-10 overflow-y-auto justify-center select-none">
      
      {/* 🚀 LOGO & BRANDING */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="font-title text-6xl font-black tracking-tighter text-white drop-shadow-[0_4px_12px_rgba(10,232,198,0.2)]">
          Z<span className="text-brand-accent">TOP!</span>
        </h1>
        <p className="font-sans text-sm font-light text-brand-lightBg/60">
          {modo === 'login' ? '¡Hola! Elige tu opción para entrar a la acción:' : 'Únete a la competencia premium'}
        </p>
      </div>

      {/* 🎛️ TABS SELECTOR (Réplica exacta de las cajas del pantallazo) */}
      <div className="bg-brand-primary/40 p-1.5 rounded-2xl flex border border-white/5 mb-6">
        <button
          onClick={() => { setModo('login'); setError(''); }}
          className={`flex-1 h-12 rounded-xl font-sans text-sm font-bold flex items-center justify-center space-x-2 transition-all ${modo === 'login' ? 'bg-brand-secondary text-white shadow-touch-2' : 'text-white/40'}`}
        >
          <HiArrowRightOnRectangle className="w-5 h-5" />
          <span>ENTRAR</span>
        </button>
        <button
          onClick={() => { setModo('indigo'); setModo('registro'); setError(''); }}
          className={`flex-1 h-12 rounded-xl font-sans text-sm font-bold flex items-center justify-center space-x-2 transition-all ${modo === 'registro' ? 'bg-brand-secondary text-white shadow-touch-2' : 'text-white/40'}`}
        >
          <HiUserPlus className="w-5 h-5" />
          <span>REGISTRO</span>
        </button>
      </div>

      {/* 📥 FORMULARIO DIGITAL */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Campo Obligatorio: Username */}
        <div className="relative">
          <HiUser className="absolute left-4 top-4.5 w-5 h-5 text-brand-lightBg/40" />
          <input
            type="text"
            required
            placeholder="Nombre de usuario"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            className="w-full h-14 pl-12 pr-4 bg-brand-primary text-white font-sans text-base rounded-xl placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-accent shadow-touch-1"
          />
        </div>

        {/* Campo Obligatorio: Password */}
        <div className="relative">
          <HiLockClosed className="absolute left-4 top-4.5 w-5 h-5 text-brand-lightBg/40" />
          <input
            type="password"
            required
            placeholder="Contraseña de acceso"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className="w-full h-14 pl-12 pr-4 bg-brand-primary text-white font-sans text-base rounded-xl placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-accent shadow-touch-1"
          />
        </div>

        {/* 🌟 CAMPOS ADICIONALES EXCLUSIVOS DE REGISTRO */}
        {modo === 'registro' && (
          <div className="space-y-4 animate-fade-in">
            {/* Nombre Completo */}
            <div className="relative">
              <HiIdentification className="absolute left-4 top-4.5 w-5 h-5 text-brand-lightBg/40" />
              <input
                type="text"
                required
                placeholder="Nombre completo"
                value={formData.nombreCompleto}
                onChange={(e) => handleInputChange('nombreCompleto', e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-brand-primary text-white font-sans text-base rounded-xl placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <HiEnvelope className="absolute left-4 top-4.5 w-5 h-5 text-brand-lightBg/40" />
              <input
                type="email"
                required
                placeholder="Correo electrónico"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-brand-primary text-white font-sans text-base rounded-xl placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </div>

            {/* Edad */}
            <div className="relative">
              <HiUser className="absolute left-4 top-4.5 w-5 h-5 text-brand-lightBg/40" />
              <input
                type="number"
                placeholder="Edad (Opcional)"
                value={formData.edad}
                onChange={(e) => handleInputChange('edad', e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-brand-primary text-white font-sans text-base rounded-xl placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </div>
          </div>
        )}

        {/* MÓDULO DE ERRORES */}
        {error && (
          <p className="text-center font-sans text-xs font-semibold text-red-400 bg-red-500/10 py-3 px-4 rounded-xl border border-red-500/20">
            ⚠️ {error}
          </p>
        )}

        {/* BOTÓN DE ACCIÓN PRINCIPAL */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-16 bg-brand-accent text-brand-darkBg font-title text-lg font-black rounded-xl shadow-touch-3 hover:bg-brand-accent/90 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
        >
          <span>{loading ? 'PROCESANDO...' : modo === 'login' ? 'INICIAR SESIÓN' : 'COMPLETAR REGISTRO'}</span>
        </button>

      </form>

    </div>
  );
};

export default LoginView;