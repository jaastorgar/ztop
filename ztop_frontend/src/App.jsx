import React, { useContext, useState } from 'react';
// 🧠 Importamos el proveedor y el contexto de control asíncrono
import { ZtopProvider, ZtopContext } from './context/ZtopContext';

// 📱 Importación de las 6 vistas del ecosistema móvil completo
import LoginView from './views/LoginView';
import LobbyView from './views/LobbyView';
import GameActiveView from './views/GameActiveView';
import VotingView from './views/VotingView';
import PodioView from './views/PodioView';
import PerfilView from './views/PerfilView';

/**
 * 🎛️ Componente de Enrutamiento Condicional Interno (SPA)
 * Maneja el token de sesión y conmuta pantallas en tiempo real según el Servidor
 */
const AppContent = () => {
  // 🔌 Consumimos la variable de estado global gobernada por el WebSocket
  const { estadoJuego } = useContext(ZtopContext);
  
  // 🔑 Estados locales para la persistencia del token de Django REST
  const [token, setToken] = useState(localStorage.getItem('ztop_token'));
  const [username, setUsername] = useState(localStorage.getItem('ztop_username'));
  
  // 🧭 Estado de navegación local exclusivo para alternar la pantalla de Perfil
  const [verPerfil, setVerPerfil] = useState(false);

  // Manejador que se ejecuta al autenticarse con éxito en LoginView
  const handleLoginSuccess = (userToken, userLogin) => {
    setToken(userToken);
    setUsername(userLogin);
  };

  // Manejador para limpiar credenciales al oprimir Cerrar Sesión
  const handleLogout = () => {
    setToken(null);
    setUsername(null);
    setVerPerfil(false);
  };

  // 🛡️ 1. GUARD DE SEGURIDAD: Si no hay sesión activa, forzamos el LoginView
  if (!token) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // 🧭 2. INTERCEPTOR DE PERFIL: Si el flag está activo y estamos en sala de espera, abrimos Perfil
  if (verPerfil && estadoJuego === 'esperando') {
    return <PerfilView onBack={() => setVerPerfil(false)} onLogout={handleLogout} />;
  }

  // 🔄 3. MÁQUINA DE ESTADOS EN TIEMPO REAL: Acoplada simétricamente con tu Backend
  switch (estadoJuego) {
    case 'esperando':
      // El lobby maneja el ingreso de PIN, creación de salas y lista de oponentes
      return <LobbyView onGoToPerfil={() => setVerPerfil(true)} />;

    case 'en_ronda':
    case 'cuenta_regresiva':
      // Fase de juego: Escritura activa en inputs y cronómetro de pánico de 10s
      return <GameActiveView />;

    case 'evaluacion':
      // Módulo interactivo de revisión categoría por categoría
      return <VotingView />;

    case 'resultados':
      // Despliegue del gran podio de campeones y posiciones globales acumuladas
      return <PodioView />;

    default:
      // Fallback seguro de resguardo para entornos smartphone
      return <LobbyView onGoToPerfil={() => setVerPerfil(true)} />;
  }
};

/**
 * 🏛️ Componente Raíz de la Aplicación ztop!
 * Encapsula todo el árbol de componentes bajo el paraguas del Túnel de Sockets
 */
export default function App() {
  return (
    <ZtopProvider>
      <div className="w-full h-full min-h-svh bg-brand-darkBg antialiased select-none">
        <AppContent />
      </div>
    </ZtopProvider>
  );
}