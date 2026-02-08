// TableauDeBordNotifications.jsx - Version améliorée du tableau de bord des notifications
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
    Badge,
    Alert,
    AlertTitle
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
    DoneAll as MarkAllReadIcon,
    WifiOutlined as ConnectedIcon,
    WifiOff as DisconnectedIcon
} from '@mui/icons-material';
import { useNotifications } from '../contexts/NotificationContext';
import WebSocketIndicator from './WebSocketIndicator';
import notificationService from '../notificationService';

import Axios from '../components/Axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Initialiser les plugins dayjs
dayjs.extend(relativeTime);

// Composants stylisés
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
            label = 'Élevée';
            break;
        case 'medium':
            color = 'warning';
            icon = <WarningIcon />;
            label = 'Moyenne';
            break;
        default:
            color = 'info';
            icon = <InfoIcon />;
            label = 'Basse';
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

// Obtenir l'icône pour le type de notification
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
        case NOTIFICATION_TYPES.USER_JOINED:
        case NOTIFICATION_TYPES.USER_LEFT:
            icon = <InfoIcon />;
            break;
        default:
            icon = <NotificationsIcon />;
    }

    return icon;
};

// Composant panneau d'onglet
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

const NotificationDashboard = () => {
    const theme = useTheme();
    const {
        notifications,
        unreadCount,
        loading,
        wsConnected,
        markAsRead,
        markAllAsRead,
        handleNotificationClick,
        refresh
    } = useNotifications();

    const [tabValue, setTabValue] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [debugOutput, setDebugOutput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Calculer les statistiques
    const highPriorityCount = notifications.filter(n => n.priority === 'high').length;
    const actionRequiredCount = notifications.filter(n => n.requires_action && !n.action_completed).length;
    const letterRequiredCount = notifications.filter(n => n.requires_official_letter && !n.official_letter_sent).length;

    // Filtrer les notifications en fonction de l'onglet actuel
    const filteredNotifications = () => {
        switch (tabValue) {
            case 0: // Toutes
                return notifications;
            case 1: // Non lues
                return notifications.filter(n => !n.read);
            case 2: // Action requise
                return notifications.filter(n => n.requires_action && !n.action_completed);
            case 3: // Priorité élevée
                return notifications.filter(n => n.priority === 'high');
            case 4: // Finance
                return notifications.filter(n =>
                    n.notification_type === 'transaction_created' ||
                    n.notification_type === 'transaction_updated' ||
                    n.notification_type === 'transaction_deleted' ||
                    n.notification_type === 'donation_received'
                );
            case 5: // Réunions
                return notifications.filter(n =>
                    n.notification_type === 'meeting_scheduled' ||
                    n.notification_type === 'meeting_cancelled' ||
                    n.notification_type === 'meeting_reminder'
                );
            case 6: // Membres
                return notifications.filter(n =>
                    n.notification_type === 'user_joined' ||
                    n.notification_type === 'user_left'
                );
            default:
                return notifications;
        }
    };

    // Gérer le clic sur le bouton d'actualisation
    const handleRefresh = async () => {
        setRefreshing(true);

        try {
            await refresh();

        } catch (error) {
            console.error('Erreur lors de l\'actualisation:', error);
        } finally {
            setTimeout(() => setRefreshing(false), 1000);
        }
    };

    // Gérer le changement d'onglet
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Gérer le marquage d'une notification comme lue
    const handleMarkAsRead = async (notificationId, e) => {
        e.stopPropagation(); // Empêcher le déclenchement du clic de notification
        await markAsRead(notificationId);
    };

    // Fonctions de test pour le débogage
    const testDirectFetch = async () => {
        setIsLoading(true);
        setDebugOutput('Test de récupération directe...');

        try {
            // Obtenir le jeton
            const token = localStorage.getItem('Token') || localStorage.getItem('token');
            let formattedToken = token;
            if (token && !token.startsWith('Bearer ') && !token.startsWith('Token ')) {
                formattedToken = `Token ${token}`;
            }

            // Faire une requête Axios directe
            const response = await Axios.get('/notifications/notifications/', {
                headers: { 'Authorization': formattedToken }
            });

            setDebugOutput(JSON.stringify({
                status: response.status,
                dataLength: response.data?.length || 0,
                firstItem: response.data?.[0] || null,
                headers: response.headers
            }, null, 2));
        } catch (error) {
            setDebugOutput(JSON.stringify({
                error: error.message,
                response: error.response?.data || null,
                status: error.response?.status || null
            }, null, 2));
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <Box sx={{ py: 2 }}>
            {/* Indicateur d'état en temps réel */}
            <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <WebSocketIndicator size="large" showText={true} />
                </Box>

            </Paper>

            {/* En-tête avec résumé des statistiques */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">
                    Tableau de Bord des Notifications
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<RefreshIcon />}
                    onClick={handleRefresh}
                    disabled={refreshing}
                >
                    {refreshing ? 'Actualisation...' : 'Actualiser'}
                </Button>
            </Box>

            {/* Indicateur de chargement */}
            {loading && (
                <LinearProgress sx={{ mb: 3, borderRadius: 1 }} />
            )}

            {/* Cartes de statistiques */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography color="text.secondary" variant="subtitle2">
                                    Total des Notifications
                                </Typography>
                                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                                    <NotificationsIcon />
                                </Avatar>
                            </Box>
                            <Typography variant="h3" sx={{ my: 1, fontWeight: 'bold' }}>
                                {notifications.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {unreadCount} non lues
                            </Typography>
                        </CardContent>
                    </StatsCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography color="text.secondary" variant="subtitle2">
                                    Priorité Élevée
                                </Typography>
                                <Avatar sx={{ bgcolor: theme.palette.error.main }}>
                                    <HighPriorityIcon />
                                </Avatar>
                            </Box>
                            <Typography variant="h3" sx={{ my: 1, fontWeight: 'bold' }}>
                                {highPriorityCount}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Requièrent une attention immédiate
                            </Typography>
                        </CardContent>
                    </StatsCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography color="text.secondary" variant="subtitle2">
                                    Actions Requises
                                </Typography>
                                <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                                    <ActionRequiredIcon />
                                </Avatar>
                            </Box>
                            <Typography variant="h3" sx={{ my: 1, fontWeight: 'bold' }}>
                                {actionRequiredCount}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Tâches en attente à compléter
                            </Typography>
                        </CardContent>
                    </StatsCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography color="text.secondary" variant="subtitle2">
                                    Notifications Non Lues
                                </Typography>
                                <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                                    <UnreadIcon />
                                </Avatar>
                            </Box>
                            <Typography variant="h3" sx={{ my: 1, fontWeight: 'bold' }}>
                                {unreadCount}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Nouveaux éléments à examiner
                            </Typography>
                        </CardContent>
                    </StatsCard>
                </Grid>
            </Grid>

            {/* Onglets et listes de notifications */}
            <Paper elevation={0} sx={{ borderRadius: 2, mb: 3, overflow: 'hidden', boxShadow: theme.shadows[2] }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        aria-label="onglets de notifications"
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        <Tab
                            label="Toutes les Notifications"
                            icon={<Badge badgeContent={notifications.length} color="primary"><NotificationsIcon /></Badge>}
                            iconPosition="start"
                        />
                        <Tab
                            label="Non lues"
                            icon={<Badge badgeContent={unreadCount} color="error"><UnreadIcon /></Badge>}
                            iconPosition="start"
                        />
                        <Tab
                            label="Actions Requises"
                            icon={<Badge badgeContent={actionRequiredCount} color="warning"><ActionRequiredIcon /></Badge>}
                            iconPosition="start"
                        />
                        <Tab
                            label="Priorité Élevée"
                            icon={<Badge badgeContent={highPriorityCount} color="error"><HighPriorityIcon /></Badge>}
                            iconPosition="start"
                        />
                        <Tab
                            label="Finance"
                            icon={<ReceiptIcon />}
                            iconPosition="start"
                        />
                        <Tab
                            label="Réunions"
                            icon={<EventIcon />}
                            iconPosition="start"
                        />
                        <Tab
                            label="Membres"
                            icon={<InfoIcon />}
                            iconPosition="start"
                        />
                    </Tabs>
                </Box>

                {/* Bouton marquer tout comme lu */}
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
                            Tout marquer comme lu
                        </Button>
                    )}
                </Box>

                {/* Contenu de la liste de notifications */}
                <TabPanel value={tabValue} index={tabValue}>
                    {refreshing ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : filteredNotifications().length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            {tabValue === 1 ? (
                                <>
                                    <CheckCircleIcon sx={{ fontSize: 60, color: theme.palette.success.main, mb: 2 }} />
                                    <Typography variant="h6" color="text.secondary">Tout est à jour!</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Vous n'avez pas de notifications non lues
                                    </Typography>
                                </>
                            ) : (
                                <>
                                    <NotificationsIcon sx={{ fontSize: 60, color: alpha(theme.palette.text.secondary, 0.5), mb: 2 }} />
                                    <Typography variant="h6" color="text.secondary">Aucune notification</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Vous serez notifié lorsque vous recevrez de nouvelles notifications
                                    </Typography>
                                </>
                            )}
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
                                                            label="Action Requise"
                                                            size="small"
                                                            color="warning"
                                                            icon={<ActionRequiredIcon />}
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
                                            title="Marquer comme lu"
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

export default NotificationDashboard;