import type { ReactNode, ComponentType } from 'react';

interface CanProps {
  permission?: string;
  permissions?: string[];
  role?: string;
  roles?: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export const Can = ({
  permission,
  permissions,
  role,
  roles,
  children,
  fallback = null,
}: CanProps) => {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  if (!user) {
    return <>{fallback}</>;
  }

  // Bypass total para super_admin
  if (user.role === 'super_admin') {
    return <>{children}</>;
  }

  // Validación por rol único
  if (role && user.role !== role) {
    return <>{fallback}</>;
  }

  // Validación por lista de roles
  if (roles && !roles.includes(user.role)) {
    return <>{fallback}</>;
  }

  // Validación por permiso granular
  const userPermissions: string[] = user.permissions || [];

  if (permission && !userPermissions.includes(permission)) {
    return <>{fallback}</>;
  }

  if (
    permissions &&
    !permissions.every((p) => userPermissions.includes(p))
  ) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// HOC para componentes completos
export function withPermission<P extends object>(
  Component: ComponentType<P>,
  requiredPermission: string,
) {
  return function ProtectedComponent(props: P) {
    return (
      <Can permission={requiredPermission}>
        <Component {...props} />
      </Can>
    );
  };
}