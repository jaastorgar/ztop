import { useContext } from 'react';
import { ZtopContext } from '../context/ZtopContext';

/**
 * Hook personalizado para acceder rápidamente a la máquina de estados 
 * y acciones en tiempo real de ztop!
 */
export const useZtop = () => {
  const context = useContext(ZtopContext);
  
  // Protección por si intentamos usar el hook fuera del Proveedor global
  if (!context) {
    throw new Error('❌ useZtop debe ser utilizado dentro de un ZtopProvider');
  }
  
  return context;
};