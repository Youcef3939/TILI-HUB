import Axios from '../components/Axios';
import { ACTIONS, RESOURCES, usePermissions } from '../contexts/PermissionsContext';

// Generic error handler
const handleApiError = (error) => {
    console.error('API Error:', error);

    // Handle unauthorized or forbidden errors
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        // Redirect to login or show permission denied message
        alert('Permission denied or session expired');
        // Consider redirecting to login page or showing a modal
    }

    throw error;
};

// Helper to check permissions before making API calls
export const secureApi = () => {
    const { can, isLoading } = usePermissions();

    // Wait until permissions are loaded
    if (isLoading) {
        return {
            get: () => Promise.reject(new Error('Permissions still loading')),
            post: () => Promise.reject(new Error('Permissions still loading')),
            put: () => Promise.reject(new Error('Permissions still loading')),
            delete: () => Promise.reject(new Error('Permissions still loading')),
        };
    }

    return {
        // GET requests (view permission)
        get: async (resource, endpoint) => {
            if (!can(ACTIONS.VIEW, resource)) {
                console.error(`Permission denied: Cannot view ${resource}`);
                return Promise.reject(new Error('Permission denied'));
            }

            try {
                return await Axios.get(endpoint);
            } catch (error) {
                return handleApiError(error);
            }
        },

        // POST requests (create permission)
        post: async (resource, endpoint, data) => {
            if (!can(ACTIONS.CREATE, resource)) {
                console.error(`Permission denied: Cannot create ${resource}`);
                return Promise.reject(new Error('Permission denied'));
            }

            try {
                return await Axios.post(endpoint, data);
            } catch (error) {
                return handleApiError(error);
            }
        },

        // PUT requests (edit permission)
        put: async (resource, endpoint, data) => {
            if (!can(ACTIONS.EDIT, resource)) {
                console.error(`Permission denied: Cannot edit ${resource}`);
                return Promise.reject(new Error('Permission denied'));
            }

            try {
                return await Axios.put(endpoint, data);
            } catch (error) {
                return handleApiError(error);
            }
        },

        // DELETE requests (delete permission)
        delete: async (resource, endpoint) => {
            if (!can(ACTIONS.DELETE, resource)) {
                console.error(`Permission denied: Cannot delete ${resource}`);
                return Promise.reject(new Error('Permission denied'));
            }

            try {
                return await Axios.delete(endpoint);
            } catch (error) {
                return handleApiError(error);
            }
        }
    };
};
