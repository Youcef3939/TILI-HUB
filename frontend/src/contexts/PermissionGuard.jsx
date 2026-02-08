import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from './PermissionsContext.jsx';

/**
 * A component that checks if the user has the required permission to access a route
 * @param {Object} props
 * @param {React.ReactNode} props.children - The components to render if permission is granted
 * @param {string} props.resource - The resource being accessed (e.g., 'projects', 'members')
 * @param {string} props.action - The action being performed (e.g., 'view', 'create', 'edit', 'delete')
 * @param {string} props.redirectTo - Where to redirect if permission is denied (defaults to home)
 * @returns {React.ReactNode}
 */
const PermissionGuard = ({ children, resource, action, redirectTo = '/home' }) => {
    const { can, isLoading } = usePermissions();

    // While loading permissions, show nothing or a loading indicator
    if (isLoading) {
        return (
            <div className="loading-container" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                width: '100%',
            }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    // Check if user has the required permission
    if (!can(action, resource)) {
        return <Navigate to={redirectTo} replace />;
    }

    // If they have permission, render the children
    return children;
};

export default PermissionGuard;