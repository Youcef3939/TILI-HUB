import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Chip,
    Button,
    Divider,
    IconButton,
    CircularProgress,
    LinearProgress,
    Tooltip,
    Tab,
    Tabs,
    Badge
} from '@mui/material';
import { styled, alpha, useTheme } from '@mui/material/styles';
import {
    Notifications as NotificationsIcon,
    CheckCircleOutline as CheckCircleIcon,
    DoNotDisturbAlt as UnreadIcon,
    AssignmentLate as ActionRequiredIcon,
    MailOutline as LetterIcon,
    CheckCircle as CompletedIcon,
    HighlightOff as HighPriorityIcon,
    ErrorOutline as WarningIcon,
    Info as InfoIcon,
    Event as EventIcon,
    Receipt as ReceiptIcon,
    Report as ReportIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    DoneAll as MarkAllReadIcon
} from '@mui/icons-material';
import { useNotifications } from '../contexts/NotificationContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Initialize dayjs plugins
dayjs.extend(relativeTime);

// Styled components
const StatsCard = styled(Card)(({ theme }) => ({
    height: '100%',
    borderRadius: 16,
    boxShadow: theme.palette.mode === 'dark'
        ? '0 6px 16px rgba(0, 0, 0, 0.3)'
        : '0 6px 16px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.3s, box-shadow 0.3s',
    '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: theme.palette.mode === 'dark'
            ? '0 12px 20px rgba(0, 0, 0, 0.4)'
            : '0 12px 20px rgba(0, 0, 0, 0.15)',
    }
}));

const NotificationItem = styled(ListItem)(({ theme, priority, read }) => {
    let bgColor = 'transparent';
    if (!read) {
        bgColor = alpha(theme.palette.primary.main, 0.08);
    }
    if (priority === 'high') {
        bgColor = alpha(theme.palette.error.main, read ? 0.05 : 0.1);
    } else if (priority === 'medium') {
        bgColor = alpha(theme.palette.warning.main, read ? 0.05 : 0.1);
    }

    return {
        padding: theme.spacing(2),
        borderRadius: 8,
        marginBottom: theme.spacing(1),
        backgroundColor: bgColor,
        borderLeft: priority === 'high'
            ? `4px solid ${theme.palette.error.main}`
            : priority === 'medium'
                ? `4px solid ${theme.palette.warning.main}`
                : read
                    ? 'none'
                    : `4px solid ${theme.palette.primary.main}`,
        transition: 'all 0.2s ease',
        '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.12),
            transform: 'translateX(5px)',
        }
    };
});

const PriorityIndicator = ({ priority, size = 'small' }) => {
    const theme = useTheme();

    let color, icon, label;
    switch (priority) {
        case 'high':
            color = 'error';
            icon = <HighPriorityIcon />;
            label = 'High';
            break;
        case 'medium':
            color = 'warning';
            icon = <WarningIcon />;
            label = 'Medium';
            break;
        default:
            color = 'info';
            icon = <InfoIcon />;
            label = 'Low';
    }

    return (
        <Chip
            size={size}
            color={color}
            icon={icon}
            label={label}
            sx={{ fontWeight: 500 }}
        />
    );
};

// Get icon for notification type
const getNotificationTypeIcon = (type, theme) => {
    const { NOTIFICATION_TYPES } = useNotifications();

    let icon;
    switch (type) {
        case NOTIFICATION_TYPES.MEETING_SCHEDULED:
        case NOTIFICATION_TYPES.MEETING_CANCELLED:
        case NOTIFICATION_TYPES.MEETING_REMINDER:
            icon = <EventIcon />;
            break;
        case NOTIFICATION_TYPES.TRANSACTION_CREATED:
        case NOTIFICATION_TYPES.TRANSACTION_UPDATED:
        case NOTIFICATION_TYPES.TRANSACTION_DELETED:
        case NOTIFICATION_TYPES.DONATION_RECEIVED:
            icon = <ReceiptIcon />;
            break;
        case NOTIFICATION_TYPES.REPORT_DUE:
        case NOTIFICATION_TYPES.REPORT_OVERDUE:
            icon = <ReportIcon />;
            break;
        case NOTIFICATION_TYPES.ADMIN_ACTION_REQUIRED:
            icon = <ActionRequiredIcon />;
            break;
        case NOTIFICATION_TYPES.OFFICIAL_LETTER_REQUIRED:
            icon = <LetterIcon />;
            break;
        default:
            icon = <NotificationsIcon />;
    }

    return icon;
};

// Tab panel component
function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`notification-tabpanel-${index}`}
            aria-labelledby={`notification-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 2 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const NotificationStats = () => {
    const theme = useTheme();
    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        handleNotificationClick,
        refresh
    } = useNotifications();

    const [tabValue, setTabValue] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    // Calculate stats
    const highPriorityCount = notifications.filter(n => n.priority === 'high').length;
    const actionRequiredCount = notifications.filter(n => n.requires_action && !n.action_completed).length;
    const letterRequiredCount = notifications.filter(n => n.requires_official_letter && !n.official_letter_sent).length;

    // Filter notifications based on current tab
    const filteredNotifications = () => {
        switch (tabValue) {
            case 0: // All
                return notifications;
            case 1: // Unread
                return notifications.filter(n => !n.read);
            case 2: // Action Required
                return notifications.filter(n => n.requires_action && !n.action_completed);
            case 3: // Official Letters
                return notifications.filter(n => n.requires_official_letter && !n.official_letter_sent);
            case 4: // High Priority
                return notifications.filter(n => n.priority === 'high');
            default:
                return notifications;
        }
    };

    // Handle refresh button click
    const handleRefresh = async () => {
        setRefreshing(true);
        await refresh();
        setTimeout(() => setRefreshing(false), 1000); // Ensure the loading state is visible for at least 1 second
    };

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Handle marking a notification as read
    const handleMarkAsRead = async (notificationId, e) => {
        e.stopPropagation(); // Prevent triggering the notification click
        await markAsRead(notificationId);
    };

    return (
        <Box sx={{ py: 2 }}>
            {/* Header with stats summary */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">
                    Notifications Dashboard
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<RefreshIcon />}
                    onClick={handleRefresh}
                    disabled={refreshing}
                >
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
            </Box>

            {/* Loading indicator */}
            {loading && (
                <LinearProgress sx={{ mb: 3, borderRadius: 1 }} />
            )}

            {/* Stats cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography color="text.secondary" variant="subtitle2">
                                    Total Notifications
                                </Typography>
                                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                                    <NotificationsIcon />
                                </Avatar>
                            </Box>
                            <Typography variant="h3" sx={{ my: 1, fontWeight: 'bold' }}>
                                {notifications.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {unreadCount} unread
                            </Typography>
                        </CardContent>
                    </StatsCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography color="text.secondary" variant="subtitle2">
                                    High Priority
                                </Typography>
                                <Avatar sx={{ bgcolor: theme.palette.error.main }}>
                                    <HighPriorityIcon />
                                </Avatar>
                            </Box>
                            <Typography variant="h3" sx={{ my: 1, fontWeight: 'bold' }}>
                                {highPriorityCount}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Require immediate attention
                            </Typography>
                        </CardContent>
                    </StatsCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography color="text.secondary" variant="subtitle2">
                                    Actions Required
                                </Typography>
                                <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                                    <ActionRequiredIcon />
                                </Avatar>
                            </Box>
                            <Typography variant="h3" sx={{ my: 1, fontWeight: 'bold' }}>
                                {actionRequiredCount}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Pending tasks to complete
                            </Typography>
                        </CardContent>
                    </StatsCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography color="text.secondary" variant="subtitle2">
                                    Official Letters
                                </Typography>
                                <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                                    <LetterIcon />
                                </Avatar>
                            </Box>
                            <Typography variant="h3" sx={{ my: 1, fontWeight: 'bold' }}>
                                {letterRequiredCount}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Need to be prepared and sent
                            </Typography>
                        </CardContent>
                    </StatsCard>
                </Grid>
            </Grid>

            {/* Tabs and notification lists */}
            <Paper elevation={0} sx={{ borderRadius: 2, mb: 3, overflow: 'hidden', boxShadow: theme.shadows[2] }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        aria-label="notification tabs"
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        <Tab
                            label="All Notifications"
                            icon={<Badge badgeContent={notifications.length} color="primary"><NotificationsIcon /></Badge>}
                            iconPosition="start"
                        />
                        <Tab
                            label="Unread"
                            icon={<Badge badgeContent={unreadCount} color="error"><UnreadIcon /></Badge>}
                            iconPosition="start"
                        />
                        <Tab
                            label="Actions Required"
                            icon={<Badge badgeContent={actionRequiredCount} color="warning"><ActionRequiredIcon /></Badge>}
                            iconPosition="start"
                        />
                        <Tab
                            label="Official Letters"
                            icon={<Badge badgeContent={letterRequiredCount} color="info"><LetterIcon /></Badge>}
                            iconPosition="start"
                        />
                        <Tab
                            label="High Priority"
                            icon={<Badge badgeContent={highPriorityCount} color="error"><HighPriorityIcon /></Badge>}
                            iconPosition="start"
                        />
                    </Tabs>
                </Box>

                {/* Mark all as read button */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1">
                        {filteredNotifications().length} notifications
                    </Typography>

                    {unreadCount > 0 && (
                        <Button
                            variant="outlined"
                            startIcon={<MarkAllReadIcon />}
                            size="small"
                            onClick={markAllAsRead}
                        >
                            Mark All as Read
                        </Button>
                    )}
                </Box>

                {/* Tab panels */}
                <TabPanel value={tabValue} index={0}>
                    {refreshing ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : notifications.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <NotificationsIcon sx={{ fontSize: 60, color: alpha(theme.palette.text.secondary, 0.5), mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">No notifications</Typography>
                            <Typography variant="body2" color="text.secondary">
                                You'll be notified when you receive new notifications
                            </Typography>
                        </Box>
                    ) : (
                        <List sx={{ p: 2 }}>
                            {notifications.map(notification => (
                                <NotificationItem
                                    key={notification.id}
                                    priority={notification.priority}
                                    read={notification.read}
                                    onClick={() => handleNotificationClick(notification)}
                                    sx={{ cursor: 'pointer' }}
                                    divider
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{
                                            bgcolor: notification.priority === 'high'
                                                ? alpha(theme.palette.error.main, 0.2)
                                                : notification.priority === 'medium'
                                                    ? alpha(theme.palette.warning.main, 0.2)
                                                    : alpha(theme.palette.primary.main, 0.2),
                                            color: notification.priority === 'high'
                                                ? theme.palette.error.main
                                                : notification.priority === 'medium'
                                                    ? theme.palette.warning.main
                                                    : theme.palette.primary.main,
                                        }}>
                                            {getNotificationTypeIcon(notification.notification_type, theme)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Typography variant="subtitle1" fontWeight={notification.read ? 400 : 600}>
                                                    {notification.title}
                                                </Typography>
                                                <PriorityIndicator priority={notification.priority} />
                                            </Box>
                                        }
                                        secondary={
                                            <>
                                                <Typography variant="body2" sx={{ mb: 1 }}>
                                                    {notification.message}
                                                </Typography>

                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {dayjs(notification.created_at).fromNow()}
                                                    </Typography>

                                                    {notification.requires_action && !notification.action_completed && (
                                                        <Chip
                                                            label="Action Required"
                                                            size="small"
                                                            color="warning"
                                                            icon={<ActionRequiredIcon />}
                                                            variant="outlined"
                                                        />
                                                    )}

                                                    {notification.requires_official_letter && !notification.official_letter_sent && (
                                                        <Chip
                                                            label="Letter Required"
                                                            size="small"
                                                            color="info"
                                                            icon={<LetterIcon />}
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </Box>
                                            </>
                                        }
                                    />

                                    {!notification.read && (
                                        <IconButton
                                            color="primary"
                                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                                            size="small"
                                            sx={{ ml: 1 }}
                                            title="Mark as read"
                                        >
                                            <CheckCircleIcon />
                                        </IconButton>
                                    )}
                                </NotificationItem>
                            ))}
                        </List>
                    )}
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    {refreshing ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : filteredNotifications().length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <CheckCircleIcon sx={{ fontSize: 60, color: theme.palette.success.main, mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">All caught up!</Typography>
                            <Typography variant="body2" color="text.secondary">
                                You have no unread notifications
                            </Typography>
                        </Box>
                    ) : (
                        <List sx={{ p: 2 }}>
                            {filteredNotifications().map(notification => (
                                <NotificationItem
                                    key={notification.id}
                                    priority={notification.priority}
                                    read={notification.read}
                                    onClick={() => handleNotificationClick(notification)}
                                    sx={{ cursor: 'pointer' }}
                                    divider
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{
                                            bgcolor: notification.priority === 'high'
                                                ? alpha(theme.palette.error.main, 0.2)
                                                : notification.priority === 'medium'
                                                    ? alpha(theme.palette.warning.main, 0.2)
                                                    : alpha(theme.palette.primary.main, 0.2),
                                            color: notification.priority === 'high'
                                                ? theme.palette.error.main
                                                : notification.priority === 'medium'
                                                    ? theme.palette.warning.main
                                                    : theme.palette.primary.main,
                                        }}>
                                            {getNotificationTypeIcon(notification.notification_type, theme)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Typography variant="subtitle1" fontWeight={600}>
                                                    {notification.title}
                                                </Typography>
                                                <PriorityIndicator priority={notification.priority} />
                                            </Box>
                                        }
                                        secondary={
                                            <>
                                                <Typography variant="body2" sx={{ mb: 1 }}>
                                                    {notification.message}
                                                </Typography>

                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {dayjs(notification.created_at).fromNow()}
                                                    </Typography>
                                                </Box>
                                            </>
                                        }
                                    />

                                    <IconButton
                                        color="primary"
                                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                                        size="small"
                                        sx={{ ml: 1 }}
                                        title="Mark as read"
                                    >
                                        <CheckCircleIcon />
                                    </IconButton>
                                </NotificationItem>
                            ))}
                        </List>
                    )}
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                    {refreshing ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : filteredNotifications().length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <CompletedIcon sx={{ fontSize: 60, color: theme.palette.success.main, mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">No pending actions!</Typography>
                            <Typography variant="body2" color="text.secondary">
                                You have no notifications requiring action
                            </Typography>
                        </Box>
                    ) : (
                        <List sx={{ p: 2 }}>
                            {filteredNotifications().map(notification => (
                                <NotificationItem
                                    key={notification.id}
                                    priority={notification.priority}
                                    read={notification.read}
                                    onClick={() => handleNotificationClick(notification)}
                                    sx={{ cursor: 'pointer' }}
                                    divider
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.2), color: theme.palette.warning.main }}>
                                            <ActionRequiredIcon />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Typography variant="subtitle1" fontWeight={notification.read ? 400 : 600}>
                                                    {notification.title}
                                                </Typography>
                                                <PriorityIndicator priority={notification.priority} />
                                            </Box>
                                        }
                                        secondary={
                                            <>
                                                <Typography variant="body2" sx={{ mb: 1 }}>
                                                    {notification.message}
                                                </Typography>

                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {notification.action_deadline ? (
                                                            `Due ${dayjs(notification.action_deadline).fromNow()}`
                                                        ) : (
                                                            dayjs(notification.created_at).fromNow()
                                                        )}
                                                    </Typography>

                                                    <Chip
                                                        label="Action Required"
                                                        size="small"
                                                        color="warning"
                                                        icon={<ActionRequiredIcon />}
                                                    />
                                                </Box>
                                            </>
                                        }
                                    />
                                </NotificationItem>
                            ))}
                        </List>
                    )}
                </TabPanel>

                <TabPanel value={tabValue} index={3}>
                    {refreshing ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : filteredNotifications().length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <CompletedIcon sx={{ fontSize: 60, color: theme.palette.success.main, mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">No pending letters!</Typography>
                            <Typography variant="body2" color="text.secondary">
                                You have no notifications requiring official letters
                            </Typography>
                        </Box>
                    ) : (
                        <List sx={{ p: 2 }}>
                            {filteredNotifications().map(notification => (
                                <NotificationItem
                                    key={notification.id}
                                    priority={notification.priority}
                                    read={notification.read}
                                    onClick={() => handleNotificationClick(notification)}
                                    sx={{ cursor: 'pointer' }}
                                    divider
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.2), color: theme.palette.info.main }}>
                                            <LetterIcon />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Typography variant="subtitle1" fontWeight={notification.read ? 400 : 600}>
                                                    {notification.title}
                                                </Typography>
                                                <PriorityIndicator priority={notification.priority} />
                                            </Box>
                                        }
                                        secondary={
                                            <>
                                                <Typography variant="body2" sx={{ mb: 1 }}>
                                                    {notification.message}
                                                </Typography>

                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Recipient: {notification.official_letter_recipient}
                                                    </Typography>

                                                    <Chip
                                                        label="Letter Required"
                                                        size="small"
                                                        color="info"
                                                        icon={<LetterIcon />}
                                                    />
                                                </Box>
                                            </>
                                        }
                                    />
                                </NotificationItem>
                            ))}
                        </List>
                    )}
                </TabPanel>

                <TabPanel value={tabValue} index={4}>
                    {refreshing ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : filteredNotifications().length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <CompletedIcon sx={{ fontSize: 60, color: theme.palette.success.main, mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">No high priority items!</Typography>
                            <Typography variant="body2" color="text.secondary">
                                You have no high priority notifications
                            </Typography>
                        </Box>
                    ) : (
                        <List sx={{ p: 2 }}>
                            {filteredNotifications().map(notification => (
                                <NotificationItem
                                    key={notification.id}
                                    priority="high"
                                    read={notification.read}
                                    onClick={() => handleNotificationClick(notification)}
                                    sx={{ cursor: 'pointer' }}
                                    divider
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.2), color: theme.palette.error.main }}>
                                            <HighPriorityIcon />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Typography variant="subtitle1" fontWeight={notification.read ? 400 : 600}>
                                                    {notification.title}
                                                </Typography>
                                                <PriorityIndicator priority="high" />
                                            </Box>
                                        }
                                        secondary={
                                            <>
                                                <Typography variant="body2" sx={{ mb: 1 }}>
                                                    {notification.message}
                                                </Typography>

                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {dayjs(notification.created_at).fromNow()}
                                                    </Typography>

                                                    {notification.requires_action && !notification.action_completed && (
                                                        <Chip
                                                            label="Action Required"
                                                            size="small"
                                                            color="warning"
                                                            icon={<ActionRequiredIcon />}
                                                            variant="outlined"
                                                        />
                                                    )}

                                                    {notification.requires_official_letter && !notification.official_letter_sent && (
                                                        <Chip
                                                            label="Letter Required"
                                                            size="small"
                                                            color="info"
                                                            icon={<LetterIcon />}
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </Box>
                                            </>
                                        }
                                    />

                                    {!notification.read && (
                                        <IconButton
                                            color="primary"
                                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                                            size="small"
                                            sx={{ ml: 1 }}
                                            title="Mark as read"
                                        >
                                            <CheckCircleIcon />
                                        </IconButton>
                                    )}
                                </NotificationItem>
                            ))}
                        </List>
                    )}
                </TabPanel>
            </Paper>
        </Box>
    );
};

export default NotificationStats;