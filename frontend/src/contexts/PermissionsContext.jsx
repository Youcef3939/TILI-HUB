import React, { createContext, useContext, useState, useEffect } from 'react';
import Axios from '../components/Axios.jsx';

// Define constants for resource and action names to avoid typos
export const RESOURCES = {
    PROJECTS: 'projects',
    MEMBERS: 'members',
    FINANCE: 'finance',
    TASKS: 'tasks',
    MEETINGS: 'meetings',
    REPORTS: 'reports',
    CHATBOT: 'chatbot',
    NOTIFICATIONS: 'notifications'  // Add this line
};

export const ACTIONS = {
    VIEW: 'view',
    CREATE: 'create',
    EDIT: 'edit',
    DELETE: 'delete',
    VALIDATE_USER: 'validate_user'
};


const RESOURCE_MAPPING = {
    [RESOURCES.PROJECTS]: RESOURCES.PROJECTS,
    [RESOURCES.MEMBERS]: RESOURCES.MEMBERS,
    [RESOURCES.FINANCE]: RESOURCES.FINANCE,
    [RESOURCES.TASKS]: RESOURCES.TASKS,
    [RESOURCES.MEETINGS]: RESOURCES.MEETINGS,
    [RESOURCES.REPORTS]: RESOURCES.REPORTS,
    [RESOURCES.NOTIFICATIONS]: RESOURCES.NOTIFICATIONS,
    'pendingUsers': RESOURCES.MEMBERS,
    [RESOURCES.CHATBOT]: RESOURCES.CHATBOT
};

const PermissionsContext = createContext({
    userRole: null,
    isSuperuser: false,
    permissions: {},
    can: () => false,
    canValidateUsers: false,
    isLoading: true
});

export const usePermissions = () => useContext(PermissionsContext);

export const PermissionsProvider = ({ children }) => {
    const [userRole, setUserRole] = useState(null);
    const [isSuperuser, setIsSuperuser] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [permissions, setPermissions] = useState({});
    const [canValidateUsers, setCanValidateUsers] = useState(false);
    const [userId, setUserId] = useState(null);


    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = localStorage.getItem('Token') || localStorage.getItem('token');
                if (!token) {
                    setIsLoading(false);
                    return;
                }

                const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
                Axios.defaults.headers.common['Authorization'] = authHeader;

                const response = await Axios.get('/users/profile/');
                const userData = response.data;

                // Store user ID for API calls
                setUserId(userData.id);

                // Set user role and superuser status
                const roleName = userData.role?.name?.toLowerCase() || null;
                setUserRole(roleName);
                setIsSuperuser(userData.is_superuser || false);

                // Build permissions object based on role
                const userPermissions = {};

                // Initialize all resources with empty permission arrays
                Object.values(RESOURCES).forEach(resource => {
                    userPermissions[resource] = [];
                });

                // For superusers, grant all permissions
                if (userData.is_superuser) {
                    Object.values(RESOURCES).forEach(resource => {
                        userPermissions[resource] = [
                            ACTIONS.VIEW,
                            ACTIONS.CREATE,
                            ACTIONS.EDIT,
                            ACTIONS.DELETE
                        ];
                    });
                    setCanValidateUsers(true);
                }

                else if (userData.role) {
                    setCanValidateUsers(['president', 'treasurer', 'secretary'].includes(roleName));
                    switch (roleName) {
                        case 'president':
                        case 'treasurer':
                        case 'secretary':
                            Object.values(RESOURCES).forEach(resource => {
                                userPermissions[resource] = [
                                    ACTIONS.VIEW,
                                    ACTIONS.CREATE,
                                    ACTIONS.EDIT,
                                    ACTIONS.DELETE
                                ];
                            });
                            break;

                        case 'member':
                            // Members can only view all resources except reports
                            Object.values(RESOURCES)
                                .filter(resource => resource !== RESOURCES.REPORTS)
                                .forEach(resource => {
                                    userPermissions[resource].push(ACTIONS.VIEW);
                                });
                            break;

                        default:
                            // For unknown roles, grant minimal permissions
                            console.warn(`Unknown role: ${roleName}`);
                            break;
                    }
                }

                // Debug: log the final permissions
                console.log('User role:', roleName);
                console.log('Is superuser:', userData.is_superuser);
                console.log('Final permissions:', userPermissions);

                // Set the permissions object
                setPermissions(userPermissions);
            } catch (error) {
                console.error('Error fetching user permissions:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserProfile();
    }, []);


    const can = (action, resource) => {

        if (isLoading) {
            console.log('Permissions still loading, denying access');
            return false;
        }


        if (isSuperuser) {
            console.log(`Superuser access granted for ${action} on ${resource}`);
            return true;
        }

        // Special case for validating users
        if (action === ACTIONS.VALIDATE_USER && resource === RESOURCES.MEMBERS) {
            console.log(`User can validate users: ${canValidateUsers}`);
            return canValidateUsers;
        }

        // Map the resource if needed
        const mappedResource = RESOURCE_MAPPING[resource] || resource;

        // Ensure the resource exists in our permissions
        if (!permissions || !permissions[mappedResource]) {
            console.warn(`Resource "${mappedResource}" not found in permissions`);
            return false;
        }

        // Check if the action is allowed for this resource
        const hasPermission = permissions[mappedResource].includes(action);
        console.log(`Permission check: ${action} on ${mappedResource} = ${hasPermission}`);
        console.log(`Available actions for ${mappedResource}:`, permissions[mappedResource]);
        return hasPermission;
    };

    return (
        <PermissionsContext.Provider
            value={{
                userRole,
                userId,
                isSuperuser,
                permissions,
                can,
                canValidateUsers,
                isLoading,
                RESOURCES,
                ACTIONS
            }}
        >
            {children}
        </PermissionsContext.Provider>
    );
};

export default PermissionsContext;