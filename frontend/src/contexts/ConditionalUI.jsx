import React from 'react';
import { usePermissions } from './PermissionsContext.jsx';

/**
 * A component that conditionally renders UI elements based on user permissions
 * @param {Object} props
 * @param {React.ReactNode} props.children - The components to render if permission is granted
 * @param {string} props.resource - The resource being accessed (e.g., 'projects', 'members')
 * @param {string} props.action - The action being performed (e.g., 'view', 'create', 'edit', 'delete')
 * @param {React.ReactNode} props.fallback - Optional component to render if permission is denied
 * @returns {React.ReactNode}
 */
export const PermissionRequired = ({ children, resource, action, fallback = null }) => {
    const { can } = usePermissions();

    // If user has permission, render the children; otherwise render the fallback or nothing
    return can(action, resource) ? children : fallback;
};

/**
 * A component that renders its children only if the user is a superuser
 * @param {Object} props
 * @param {React.ReactNode} props.children - The components to render if the user is a superuser
 * @param {React.ReactNode} props.fallback - Optional component to render if the user is not a superuser
 * @returns {React.ReactNode}
 */
export const SuperuserOnly = ({ children, fallback = null }) => {
    const { isSuperuser } = usePermissions();

    return isSuperuser ? children : fallback;
};

/**
 * A component that renders its children only if the user can validate users
 * @param {Object} props
 * @param {React.ReactNode} props.children - The components to render if the user can validate users
 * @param {React.ReactNode} props.fallback - Optional component to render if the user cannot validate users
 * @returns {React.ReactNode}
 */
export const CanValidateUsers = ({ children, fallback = null }) => {
    const { canValidateUsers } = usePermissions();

    return canValidateUsers ? children : fallback;
};