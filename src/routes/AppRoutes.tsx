import { Routes, Route } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout/MainLayout'
import Home from '../pages/Home/Home'
import Afiliacion from '../pages/Afiliacion/Afiliacion'
import ReportarAveria from '../pages/ReportarAveria/ReportarAveria'

function AppRoutes() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/afiliacion" element={<Afiliacion />} />
        <Route path="/reportar-averia" element={<ReportarAveria />} />
      </Routes>
    </MainLayout>
  )
}

export default AppRoutes
