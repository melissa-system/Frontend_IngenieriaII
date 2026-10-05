import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './components/ui/ToastProvider'
import GestorAcceso from './components/seguridad/GestorAcceso'
import AppRoutes from './routes/AppRoutes'

function App() {
  return (
    <BrowserRouter>
      {/* Traduce el 403 de apiClient en la pantalla de acceso denegado; tiene
          que vivir dentro del Router para poder navegar. */}
      <GestorAcceso />
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
