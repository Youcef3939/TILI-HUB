// Fixed and cleaned NotificationContext.jsx
// This version fixes the duplicate notification issue and improves real-time updates
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSnackbar } from 'notistack';
import notificationService from '../notificationService.js';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from './PermissionsContext.jsx';

// Create context
const NotificationContext = createContext();

// Custom hook to use notification context
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

// Notification types and their corresponding actions
const NOTIFICATION_TYPES = {
    MEETING_SCHEDULED: 'meeting_scheduled',
    MEETING_CANCELLED: 'meeting_cancelled',
    MEETING_REMINDER: 'meeting_reminder',
    REPORT_DUE: 'report_due',
    REPORT_OVERDUE: 'report_overdue',
    TRANSACTION_CREATED: 'transaction_created',
    TRANSACTION_UPDATED: 'transaction_updated',
    TRANSACTION_DELETED: 'transaction_deleted',
    DONATION_RECEIVED: 'donation_received',
    USER_JOINED: 'user_joined',
    USER_LEFT: 'user_left',
    ADMIN_ACTION_REQUIRED: 'admin_action_required',
    OFFICIAL_LETTER_REQUIRED: 'official_letter_required',
    BUDGET_THRESHOLD: 'budget_threshold',
    MONTHLY_SUMMARY: 'monthly_summary'
};

// Notification provider component
export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [wsConnected, setWsConnected] = useState(false); // Kept for interface compatibility
    const [wsError, setWsError] = useState(null); // Kept for interface compatibility
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const { can, RESOURCES, ACTIONS, userRole } = usePermissions();
    const initialized = useRef(false);
    const fetchingNotifications = useRef(false);
    const lastNotificationId = useRef(null); // Track the last notification ID to detect new ones
    const pollingInterval = useRef(null);

    // Filter notifications based on user role
    const filterNotificationsByUserRole = (notificationsList) => {
        // If input is not an array, return an empty array to avoid errors
        if (!Array.isArray(notificationsList)) {
            return [];
        }

        // Map numeric role IDs to role names for easier comparison
        const roleIdToName = {
            1: 'president',
            2: 'treasurer',
            3: 'secretary',
            4: 'member'
        };

        // Get current user's role ID and userId from localStorage
        const userId = localStorage.getItem('userId');
        const userRoleId = parseInt(localStorage.getItem('userRoleId') || '4', 10);
        const roleNameFromId = roleIdToName[userRoleId] || 'member';

        // Create a set of allowed roles for the current user
        const userRoles = new Set(['all', roleNameFromId, 'finance']);

        // If user is president, add president-specific roles
        if (roleNameFromId === 'president') {
            userRoles.add('president');
            userRoles.add('admin');
        }

        // If user is treasurer, add treasurer-specific roles
        if (roleNameFromId === 'treasurer') {
            userRoles.add('treasurer');
            userRoles.add('finance');
        }

        // If user is secretary, add secretary-specific roles
        if (roleNameFromId === 'secretary') {
            userRoles.add('secretary');
        }

        // Create a map to track notifications by their content signature
        // This helps us identify and remove duplicates
        const uniqueNotifications = new Map();

        // Filter notifications based on user roles and remove duplicates
        const filteredNotifications = notificationsList.filter(notification => {
            // Check if this notification is for this user or their roles
            const isForUser = (
                // Meeting notifications for all users
                notification.notification_type?.startsWith('meeting_') ||

                // Notifications specifically for this user
                (notification.recipient && notification.recipient.toString() === userId) ||

                // Notifications for this user's roles
                (notification.recipient_role && userRoles.has(notification.recipient_role)) ||

                // Notifications for all users (no recipient and no role specified)
                (notification.recipient_role === null && notification.recipient === null)
            );

            if (!isForUser) {
                return false;
            }

            // Create a signature for this notification to detect duplicates
            // Use title, message, and notification_type as a unique identifier
            const signature = `${notification.title}|${notification.message}|${notification.notification_type}`;

            // If we've already seen this notification, skip it
            if (uniqueNotifications.has(signature)) {
                return false;
            }

            // Otherwise, add it to our map and include it
            uniqueNotifications.set(signature, notification.id);
            return true;
        });

        return filteredNotifications;
    };

    // Show a desktop notification
    const showDesktopNotification = (notification) => {
        if (!("Notification" in window)) {
            return;
        }

        if (Notification.permission === "granted") {
            const notif = new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico'
            });

            notif.onclick = () => {
                window.focus();
                handleNotificationClick(notification);
            };
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    showDesktopNotification(notification);
                }
            });
        }
    };

    // Handle notification click
    const handleNotificationClick = async (notification) => {
        // Mark as read
        await markAsRead(notification.id);

        // Navigate to the corresponding page based on notification type or URL
        if (notification.url) {
            navigate(notification.url);
        } else {
            // Default navigation based on notification type
            switch (notification.notification_type) {
                case NOTIFICATION_TYPES.MEETING_SCHEDULED:
                case NOTIFICATION_TYPES.MEETING_CANCELLED:
                case NOTIFICATION_TYPES.MEETING_REMINDER:
                    navigate('/meetings');
                    break;
                case NOTIFICATION_TYPES.TRANSACTION_CREATED:
                case NOTIFICATION_TYPES.TRANSACTION_UPDATED:
                case NOTIFICATION_TYPES.TRANSACTION_DELETED:
                case NOTIFICATION_TYPES.DONATION_RECEIVED:
                    navigate('/finance');
                    break;
                case NOTIFICATION_TYPES.USER_JOINED:
                case NOTIFICATION_TYPES.USER_LEFT:
                    navigate('/members');
                    break;
                default:
                    navigate('/notifications');
                    break;
            }
        }
    };

    // Mark a notification as read
    const markAsRead = async (notificationId) => {
        try {
            const success = await notificationService.markAsRead(notificationId);

            if (success) {
                // Update local state
                setNotifications(prevNotifications =>
                    prevNotifications.map(notification =>
                        notification.id === notificationId ? { ...notification, read: true } : notification
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            return success;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            // Still update the UI for better user experience
            setNotifications(prevNotifications =>
                prevNotifications.map(notification =>
                    notification.id === notificationId ? { ...notification, read: true } : notification
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
            return false;
        }
    };

    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            const success = await notificationService.markAllAsRead();

            if (success) {
                // Update local state
                setNotifications(prevNotifications =>
                    prevNotifications.map(notification => ({ ...notification, read: true }))
                );
                setUnreadCount(0);
            }
            return success;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            // Still update the UI for better user experience
            setNotifications(prevNotifications =>
                prevNotifications.map(notification => ({ ...notification, read: true }))
            );
            setUnreadCount(0);
            return false;
        }
    };

    // Get notifications from API
    const updateNotifications = useCallback(async () => {
        // Prevent simultaneous fetches that could cause infinite loops
        if (fetchingNotifications.current) {
            console.log('Already fetching notifications, ignoring...');
            return;
        }

        try {
            console.log('Fetching notifications via API...');
            setLoading(true);
            fetchingNotifications.current = true;

            // Get notifications from API
            const fetchedNotifications = await notificationService.getNotifications();
            console.log('Notifications fetched:', fetchedNotifications);

            // Verify fetchedNotifications is an array
            let notificationsArray = [];

            if (Array.isArray(fetchedNotifications)) {
                notificationsArray = fetchedNotifications;
            } else if (fetchedNotifications?.results && Array.isArray(fetchedNotifications.results)) {
                notificationsArray = fetchedNotifications.results;
            } else {
                console.warn('Unexpected notification data format:', fetchedNotifications);
            }

            // Apply filtering
            const filteredNotifications = filterNotificationsByUserRole(notificationsArray);
            console.log('Filtered notifications:', filteredNotifications.length);

            // Check for new notifications and display them
            if (lastNotificationId.current && filteredNotifications.length > 0) {
                const newNotifications = filteredNotifications.filter(n =>
                    n.id > lastNotificationId.current && !n.read
                );

                // Display snackbar notifications for new items
                newNotifications.forEach(notification => {
                    // Show a snackbar notification
                    enqueueSnackbar(notification.title, {
                        variant: notification.priority === 'high' ? 'error' :
                            notification.priority === 'medium' ? 'warning' : 'info',
                        autoHideDuration: 5000,
                        action: (key) => (
                            <button
                                onClick={() => { handleNotificationClick(notification); }}
                                style={{
                                    color: 'white',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                            >
                                View
                            </button>
                        )
                    });

                    // Show a desktop notification
                    showDesktopNotification(notification);
                });
            }

            // Update the last notification ID if we have notifications
            if (filteredNotifications.length > 0) {
                const maxId = Math.max(...filteredNotifications.map(n => n.id));
                lastNotificationId.current = maxId;
            }

            // Set filtered notifications in state
            setNotifications(filteredNotifications);

            // Calculate unread count safely based on filtered notifications
            const unreadItems = filteredNotifications.filter(n => !n.read);
            setUnreadCount(unreadItems ? unreadItems.length : 0);
        } catch (error) {
            console.error('Error updating notifications:', error);
        } finally {
            setLoading(false);
            fetchingNotifications.current = false;
        }
    }, [userRole, enqueueSnackbar]);

    // Force notification refresh
    const refresh = useCallback(() => {
        if (!fetchingNotifications.current) {
            updateNotifications();
        } else {
            console.log('Already fetching notifications, refresh request ignored');
        }
    }, [updateNotifications]);

    // Initialize notification service
    useEffect(() => {
        // Prevent multiple initializations
        if (initialized.current) {
            return;
        }

        const initializeNotifications = async () => {
            try {
                // Check if user is authenticated
                const token = localStorage.getItem('Token') || localStorage.getItem('token');
                if (!token) {
                    console.log('User not authenticated, skipping notification initialization');
                    setLoading(false);
                    return;
                }

                // Wait for permissions to load
                if (!can(ACTIONS.VIEW, RESOURCES.NOTIFICATIONS)) {
                    console.log('Waiting for permissions to load...');
                    setLoading(false);
                    return;
                }

                initialized.current = true;
                console.log('Initializing notification service with polling');

                // Initialize notification service - shorter polling interval for more responsive UI
                notificationService.initialize(null, {
                    pollingIntervalTime: 10000, // Poll every 10 seconds
                    disableAutoPolling: false // Enable automatic polling
                });

                // Perform initial fetch
                await updateNotifications();

                // Set up polling
                pollingInterval.current = setInterval(() => {
                    if (!fetchingNotifications.current) {
                        updateNotifications();
                    }
                }, 10000); // Poll every 10 seconds

                return () => {
                    // Cleanup
                    if (pollingInterval.current) {
                        clearInterval(pollingInterval.current);
                    }
                    notificationService.cleanup();
                    initialized.current = false;
                };
            } catch (error) {
                console.error('Failed to initialize notifications:', error);
                setLoading(false);
                initialized.current = false;
            }
        };

        initializeNotifications();
    }, [updateNotifications, can, ACTIONS, RESOURCES]);

    // Context value
    const value = {
        notifications,
        unreadCount,
        loading,
        wsConnected: false, // Always false since we're not using WebSockets
        wsError: "Direct API mode enabled", // Indicate we're in direct API mode
        markAsRead,
        markAllAsRead,
        refresh,
        handleNotificationClick,
        NOTIFICATION_TYPES
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext;