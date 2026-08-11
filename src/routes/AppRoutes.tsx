import { Routes, Route } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout/MainLayout'
import Home from '../pages/Home/Home'
import Afiliacion from '../pages/Afiliacion/Afiliacion'
import ReportarAveria from '../pages/ReportarAveria/ReportarAveria'
import Login from '../pages/Login/Login'

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <MainLayout>
            <Home />
          </MainLayout>
        }
      />
      <Route
        path="/afiliacion"
        element={
          <MainLayout>
            <Afiliacion />
          </MainLayout>
        }
      />
      <Route
        path="/reportar-averia"
        element={
          <MainLayout>
            <ReportarAveria />
          </MainLayout>
        }
      />
      <Route path="/login" element={<Login />} />
    </Routes>
  )
}

export default AppRoutes
