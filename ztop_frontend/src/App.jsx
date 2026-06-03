import React, { useContext, useState } from 'react';
// 🧠 Importamos los proveedores y contextos globales
import { ZtopProvider, ZtopContext } from './context/ZtopContext';
import { SocialProvider } from './context/SocialContext';

// 📱 Importación de las vistas del ecosistema móvil completo
import LoginView from './views/LoginView';
import LobbyView from './views/LobbyView';
import GameActiveView from './views/GameActiveView';
import VotingView from './views/VotingView';
import PodioView from './views/PodioView';
import PerfilView from './views/PerfilView';
import ChatsView from './views/ChatsView';
import NotificacionesView from './views/NotificacionesView';

/**
 * 🎛️ Componente de Enrutamiento Condicional Interno (SPA)
 * Maneja el token de sesión y conmuta pantallas en tiempo real según el Servidor
 */
const AppContent = () => {
  // 🔌 Consumimos la variable de estado global gobernada por el WebSocket de partidas
  const { estadoJuego } = useContext(ZtopContext);
  
  // 🔑 Estados locales para la persistencia del token de Django REST
  const [token, setToken] = useState(localStorage.getItem('ztop_token'));
  const [username, setUsername] = useState(localStorage.getItem('ztop_username'));
  
  // 🧭 NUEVO: Controlador central de pestañas del menú inferior
  // Opciones válidas: 'home', 'chats', 'notificaciones', 'perfil'
  const [vistaActiva, setVistaActiva] = useState('home'); 

  // Manejador que se ejecuta al autenticarse con éxito en LoginView
  const handleLoginSuccess = (userToken, userLogin) => {
    setToken(userToken);
    setUsername(userLogin);
  };

  // Manejador para limpiar credenciales al oprimir Cerrar Sesión
  const handleLogout = () => {
    setToken(null);
    setUsername(null);
    setVistaActiva('home'); // Reseteamos a la vista principal al salir
  };

  // 🛡️ 1. GUARD DE SEGURIDAD: Si no hay sesión activa, forzamos el LoginView
  if (!token) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // 🧭 2. INTERCEPTORES DE PESTAÑAS: Menús de navegación fuera de partida
  if (estadoJuego === 'esperando') {
    if (vistaActiva === 'perfil') {
      return (
        <PerfilView 
          onNavigate={setVistaActiva} 
          onLogout={handleLogout} 
        />
      );
    }
    if (vistaActiva === 'chats') {
      return <ChatsView onNavigate={setVistaActiva} />;
    }
    if (vistaActiva === 'notificaciones') {
      return <NotificacionesView onNavigate={setVistaActiva} />;
    }
  }

  // 🔄 3. MÁQUINA DE ESTADOS EN TIEMPO REAL (Partidas)
  switch (estadoJuego) {
    case 'esperando':
      // El lobby ahora usa `onNavigate` para que funcione la barra inferior
      return <LobbyView onNavigate={setVistaActiva} />;

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
      return <LobbyView onNavigate={setVistaActiva} />;
  }
};

/**
 * 🏛️ Componente Raíz de la Aplicación ztop!
 * Encapsula todo el árbol de componentes bajo los paraguas de los Túneles de Sockets
 */
export default function App() {
  return (
    /* 🚀 Envolvemos TODA la aplicación con el contexto Social y de Juego */
    <SocialProvider>
      <ZtopProvider>
        <div className="w-full h-full min-h-svh bg-brand-darkBg antialiased select-none">
          <AppContent />
        </div>
      </ZtopProvider>
    </SocialProvider>
  );
}