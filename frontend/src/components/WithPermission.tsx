import React from 'react';
import { useAuth } from '../context/AuthContext';

interface WithPermissionProps {
  children: React.ReactNode;
  permission: string;
  fallback?: React.ReactNode;
}

export const WithPermission: React.FC<WithPermissionProps> = ({
  children,
  permission,
  fallback = null
}) => {
  const { hasPermission } = useAuth();
  
  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface WithRoleProps {
  children: React.ReactNode;
  roles: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

export const WithRole: React.FC<WithRoleProps> = ({
  children,
  roles,
  requireAll = false,
  fallback = null
}) => {
  const { hasAnyRole, hasAllRoles } = useAuth();
  
  const hasRole = requireAll 
    ? hasAllRoles(roles)
    : hasAnyRole(roles);

  if (!hasRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface ShowForAdminProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ShowForAdmin: React.FC<ShowForAdminProps> = ({ 
  children, 
  fallback = null 
}) => {
  const { isAdmin } = useAuth();

  if (!isAdmin()) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface ShowForManagerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ShowForManager: React.FC<ShowForManagerProps> = ({ 
  children, 
  fallback = null 
}) => {
  const { isManager } = useAuth();

  if (!isManager()) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface ShowForOwnerProps {
  children: React.ReactNode;
  resourceUserId: number;
  fallback?: React.ReactNode;
}

export const ShowForOwner: React.FC<ShowForOwnerProps> = ({
  children,
  resourceUserId,
  fallback = null
}) => {
  const { user, isAdmin } = useAuth();
  
  const isOwner = user?.id === resourceUserId;
  const canAccess = isOwner || isAdmin();

  if (!canAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};