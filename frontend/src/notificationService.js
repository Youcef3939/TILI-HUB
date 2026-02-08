// notificationService.js - Enhanced polling mechanism
import Axios from './components/Axios.jsx';

// Notification Service - Provides methods to interact with the notification API
const notificationService = {
    // Configuration
    apiBasePath: '/notifications/notifications/',
    pollingInterval: null,
    subscribers: [],
    options: {
        pollingIntervalTime: 30000, // Default polling interval: 30 seconds
        disableAutoPolling: false,
    },
    lastFetchTime: null,

    /**
     * Initialize the notification service
     * @param {Function} onNotification - Callback for new notifications
     * @param {Object} options - Configuration options
     */
    initialize(onNotification, options = {}) {
        console.log('Initializing notification service with options:', options);

        if (onNotification) {
            this.subscribe(onNotification);
        }

        // Merge options
        this.options = { ...this.options, ...options };

        // If auto-polling is enabled, start polling
        if (!this.options.disableAutoPolling) {
            this.startPolling();
        }

        // Request notification permission if supported
        this.requestNotificationPermission();
    },

    /**
     * Request permission to show desktop notifications
     */
    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    },

    /**
     * Subscribe to notifications
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        this.subscribers.push(callback);
        console.log(`Subscribed to notifications (${this.subscribers.length} subscribers)`);

        // Return unsubscribe function
        return () => {
            this.subscribers = this.subscribers.filter(cb => cb !== callback);
            console.log(`Unsubscribed from notifications (${this.subscribers.length} subscribers remaining)`);
        };
    },

    /**
     * Notify all subscribers
     * @param {Array} notifications - Array of notification objects
     */
    notifySubscribers(notifications) {
        if (notifications && this.subscribers.length > 0) {
            this.subscribers.forEach(callback => {
                try {
                    callback(notifications);
                } catch (error) {
                    console.error('Error in notification subscriber:', error);
                }
            });
        }
    },

    /**
     * Start polling for notifications
     */
    startPolling() {
        console.log('Starting notification polling');
        // Clear any existing polling
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }

        // Immediately fetch notifications
        this.fetchNotifications();

        // Set up interval for polling
        this.pollingInterval = setInterval(() => {
            this.fetchNotifications();
        }, this.options.pollingIntervalTime);
    },

    /**
     * Stop polling for notifications
     */
    stopPolling() {
        console.log('Stopping notification polling');
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    },

    /**
     * Cleanup the service
     */
    cleanup() {
        console.log('Cleaning up notification service');
        this.stopPolling();
        this.subscribers = [];
    },

    /**
     * Check if user is authenticated
     * @returns {boolean} True if authenticated
     */
    isAuthenticated() {
        const token = localStorage.getItem('Token') || localStorage.getItem('token');
        return !!token;
    },

    /**
     * Fetch notifications from the API
     * @returns {Promise<Array>} Array of notifications
     */
    async fetchNotifications() {
        try {
            // Check authentication
            if (!this.isAuthenticated()) {
                console.log('No authentication token found, skipping notification fetch');
                return [];
            }

            // Add trailing slash to match Django URL pattern if needed
            const url = this.apiBasePath.endsWith('/') ? this.apiBasePath : `${this.apiBasePath}/`;

            // Get the token and format it correctly
            const token = localStorage.getItem('Token') || localStorage.getItem('token');

            // Check token format and ensure it starts with "Bearer " or "Token " as required by the backend
            let formattedToken = token;
            if (token && !token.startsWith('Bearer ') && !token.startsWith('Token ')) {
                formattedToken = `Token ${token}`;
            }

            // Set the auth header for this request
            const headers = {
                'Authorization': formattedToken
            };

            // Track fetch time for performance monitoring
            const startTime = performance.now();
            this.lastFetchTime = new Date();

            const response = await Axios.get(url, { headers });

            // Calculate fetch duration
            const fetchDuration = performance.now() - startTime;
            console.log(`Notifications fetched in ${fetchDuration.toFixed(2)}ms`);

            const notifications = response.data;
            this.notifySubscribers(notifications);
            return notifications;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            // Enhanced error logging
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
                console.error('Response headers:', error.response.headers);
            }
            return [];
        }
    },

    /**
     * Get all notifications
     * @returns {Promise<Array>} Array of notifications
     */
    async getNotifications() {
        return this.fetchNotifications();
    },

    /**
     * Get unread notification count
     * @returns {Promise<number>} Unread count
     */
    async getUnreadCount() {
        try {
            if (!this.isAuthenticated()) {
                return 0;
            }

            const url = `${this.apiBasePath}unread_count/`.replace('//', '/');

            // Get the token and format it correctly
            const token = localStorage.getItem('Token') || localStorage.getItem('token');
            let formattedToken = token;
            if (token && !token.startsWith('Bearer ') && !token.startsWith('Token ')) {
                formattedToken = `Token ${token}`;
            }

            const headers = {
                'Authorization': formattedToken
            };

            const response = await Axios.get(url, { headers });
            return response.data.count;
        } catch (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
    },

    /**
     * Mark a notification as read
     * @param {number} id - Notification ID
     * @returns {Promise<boolean>} Success status
     */
    async markAsRead(id) {
        try {
            if (!this.isAuthenticated()) {
                return false;
            }

            const url = `${this.apiBasePath}${id}/mark_as_read/`.replace('//', '/');

            // Get the token and format it correctly
            const token = localStorage.getItem('Token') || localStorage.getItem('token');
            let formattedToken = token;
            if (token && !token.startsWith('Bearer ') && !token.startsWith('Token ')) {
                formattedToken = `Token ${token}`;
            }

            const headers = {
                'Authorization': formattedToken
            };

            const response = await Axios.post(url, {}, { headers });
            return response.status === 200;
        } catch (error) {
            console.error(`Error marking notification ${id} as read:`, error);
            return false;
        }
    },

    /**
     * Mark all notifications as read
     * @returns {Promise<boolean>} Success status
     */
    async markAllAsRead() {
        try {
            if (!this.isAuthenticated()) {
                return false;
            }

            const url = `${this.apiBasePath}mark_all_as_read/`.replace('//', '/');

            // Get the token and format it correctly
            const token = localStorage.getItem('Token') || localStorage.getItem('token');
            let formattedToken = token;
            if (token && !token.startsWith('Bearer ') && !token.startsWith('Token ')) {
                formattedToken = `Token ${token}`;
            }

            const headers = {
                'Authorization': formattedToken
            };

            const response = await Axios.post(url, {}, { headers });
            return response.status === 200;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            return false;
        }
    },
};

export default notificationService;