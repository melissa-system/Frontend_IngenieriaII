import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  requiredPermission?: string;
  userRole?: string;
  redirectTo?: string;
}

export const ProtectedRoute = ({
  allowedRoles,
  requiredPermission,
  userRole,
  redirectTo = '/login',
}: ProtectedRouteProps) => {
  // Obtener rol del prop o de localStorage si no viene inyectado
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const currentRole = userRole || user?.role;

  // 1. Si no hay usuario ni rol, redirigir al login
  if (!currentRole) {
    return <Navigate to={redirectTo} replace />;
  }

  // 2. Si es super_admin, acceso directo
  if (currentRole === 'super_admin') {
    return <Outlet />;
  }

  // 3. Validación por roles permitidos
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(currentRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 4. Validación por permiso granular específico
  if (requiredPermission) {
    const userPermissions: string[] = user?.permissions || [];
    if (!userPermissions.includes(requiredPermission)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
};