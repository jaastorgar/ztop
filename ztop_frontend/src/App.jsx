import React, { useState, useContext } from 'react';
import { JuegoContext, JuegoProvider } from './context/JuegoContext';
import LoginView from './views/LoginView';
import LobbyView from './views/LobbyView';
import JuegoView from './views/JuegoView';
import PodioView from './views/PodioView';
import PerfilView from './views/PerfilView'; // 💡 IMPORTAMOS LA NUEVA VISTA DE PERFIL

const ContenidoApp = () => {
  const { usuario, estadoJuego, setSala } = useContext(JuegoContext);
  
  // Estado local para controlar el flujo lineal de pantallas en el MVP
  const [pantallaActual, setPantallaActual] = useState('login');

  // Máquina de estados simple para renderizar la pantalla correcta
  if (!usuario) {
    return <LoginView onLoginSuccess={() => setPantallaActual('lobby')} />;
  }

  switch (pantallaActual) {
    case 'login':
    case 'lobby':
      return (
        <LobbyView 
          onStartGame={() => setPantallaActual('juego')} 
          onViewProfile={() => setPantallaActual('perfil')} // 💡 CONECTAMOS EL BOTÓN DEL PERFIL
        />
      );
      
    case 'perfil': // 💡 NUEVO ESTADO PARA MOSTRAR EL PERFIL
      return (
        <PerfilView 
          onBackToLobby={() => setPantallaActual('lobby')} 
        />
      );

    case 'juego':
      return <JuegoView onTimeOut={() => setPantallaActual('podio')} />;
      
    case 'podio':
      return (
        <PodioView 
          onNextRound={() => {
            // El Host limpia la sala para reiniciar la máquina de estados local
            setPantallaActual('lobby');
          }} 
        />
      );
      
    default:
      return <LobbyView />;
  }
};

// Inyectamos el proveedor global del juego para que todas las vistas tengan acceso al WebSocket
function App() {
  return (
    <JuegoProvider>
      <ContenidoApp />
    </JuegoProvider>
  );
}

export default App;