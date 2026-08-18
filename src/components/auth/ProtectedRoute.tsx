import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles: string[];
  userRole?: string;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  userRole,
  redirectTo = '/login',
}) => {
  // Si no hay rol (usuario no autenticado), redirige al login
  if (!userRole) {
    return <Navigate to={redirectTo} replace />;
  }

  // Si el usuario es super_admin tiene acceso a todo, o si su rol está en los permitidos
  const hasPermission = userRole === 'super_admin' || allowedRoles.includes(userRole);

  if (!hasPermission) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};