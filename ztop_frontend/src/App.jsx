import React, { useContext, useState } from 'react';
// 🧠 Importamos los proveedores y contextos globales
import { ZtopProvider, ZtopContext } from './context/ZtopContext';
// 🚀 Importamos ambos (Provider y Context) de lo social
import { SocialProvider, SocialContext } from './context/SocialContext';

// 📱 Importación de las vistas del ecosistema móvil completo
import LoginView from './views/LoginView';
import LobbyView from './views/LobbyView';
import GameActiveView from './views/GameActiveView';
import VotingView from './views/VotingView';
import PodioView from './views/PodioView';
import PerfilView from './views/PerfilView';
import ChatsView from './views/ChatsView';
import NotificacionesView from './views/NotificacionesView';
import ChatActivoView from './views/ChatActivoView';

/**
 * 🎛️ Componente de Enrutamiento Condicional Interno (SPA)
 */
const AppContent = () => {
  const { estadoJuego } = useContext(ZtopContext);
  
  // 🚀 Extraemos los interruptores sociales
  const { iniciarSesionSocial, cerrarSesionSocial } = useContext(SocialContext);

  const [token, setToken] = useState(localStorage.getItem('ztop_token'));
  const [username, setUsername] = useState(localStorage.getItem('ztop_username'));
  
  const [vistaActiva, setVistaActiva] = useState('home'); 
  // 🚀 Estado para saber qué chat está abierto
  const [chatSeleccionado, setChatSeleccionado] = useState(null); 

  const handleLoginSuccess = (userToken, userLogin) => {
    setToken(userToken);
    setUsername(userLogin);
    // 🚀 DISPARADOR: ¡Le decimos al servidor que acabamos de llegar!
    if (iniciarSesionSocial) iniciarSesionSocial(); 
  };

  const handleLogout = () => {
    setToken(null);
    setUsername(null);
    setVistaActiva('home'); 
    setChatSeleccionado(null); // Limpiamos el chat al salir
    // 🚀 DISPARADOR: Apagamos el túnel y vaciamos los mensajes guardados al salir
    if (cerrarSesionSocial) cerrarSesionSocial();
  };

  // 🛡️ GUARD DE SEGURIDAD
  if (!token) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // 🧭 INTERCEPTORES DE NAVEGACIÓN
  if (estadoJuego === 'esperando') {
    
    // 🚀 INTERCEPTOR PRIORITARIO: Si tocaste un chat, mostramos la pantalla de chat
    if (chatSeleccionado) {
      return (
        <ChatActivoView 
          chat={chatSeleccionado} 
          onBack={() => setChatSeleccionado(null)} 
        />
      );
    }

    if (vistaActiva === 'perfil') {
      return <PerfilView onNavigate={setVistaActiva} onLogout={handleLogout} />;
    }
    if (vistaActiva === 'chats') {
      // 🚀 Le pasamos 'onOpenChat' para que los botones de amigos funcionen
      return <ChatsView onNavigate={setVistaActiva} onOpenChat={setChatSeleccionado} />;
    }
    if (vistaActiva === 'notificaciones') {
      return <NotificacionesView onNavigate={setVistaActiva} />;
    }
  }

  // 🔄 MÁQUINA DE ESTADOS DEL JUEGO
  switch (estadoJuego) {
    case 'esperando':
      return <LobbyView onNavigate={setVistaActiva} />;
    case 'en_ronda':
    case 'cuenta_regresiva':
      return <GameActiveView />;
    case 'evaluacion':
      return <VotingView />;
    case 'resultados':
      return <PodioView />;
    default:
      return <LobbyView onNavigate={setVistaActiva} />;
  }
};

export default function App() {
  return (
    <SocialProvider>
      <ZtopProvider>
        <div className="w-full h-full min-h-svh bg-brand-darkBg antialiased select-none">
          <AppContent />
        </div>
      </ZtopProvider>
    </SocialProvider>
  );
}