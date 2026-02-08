// IndicateurNotifications.jsx - Composant amélioré de notification en temps réel
import React, { useState, useEffect } from 'react';
import {
    Box,
    Tooltip,
    Typography,
    Badge,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Collapse,
    List,
    ListItem,
    Paper,
    Button,
    CircularProgress
} from '@mui/material';
import { useTheme, styled, alpha } from '@mui/material/styles';
import {
    Notifications as NotificationsIcon,
    HighlightOff as HighPriorityIcon,
    WarningAmber as MediumPriorityIcon,
    Info as LowPriorityIcon,
    CheckCircleOutline as MarkReadIcon,
    WarningAmber as WarningIcon,
    ErrorOutline as ErrorIcon,
    CancelOutlined as DisconnectedIcon,
    RotateRight as SyncIcon,
    NotificationsActive as NotificationActiveIcon,
    NotificationsNone as NotificationEmptyIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    AccountBalance as FinanceIcon,
    AssignmentLate as ActionRequiredIcon,
    EventAvailable as EventIcon,
    MonetizationOn as MoneyIcon,
    People as MembersIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Initialiser les plugins dayjs
dayjs.extend(relativeTime);

// Composants stylisés pour un design visuel amélioré
const StyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        backgroundColor: theme.palette.error.main,
        color: theme.palette.error.contrastText,
        fontWeight: 'bold',
        boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
        '&::after': {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            animation: 'ripple 1.2s infinite ease-in-out',
            border: '1px solid currentColor',
            content: '""',
        },
    },
    '@keyframes ripple': {
        '0%': {
            transform: 'scale(.8)',
            opacity: 1,
        },
        '100%': {
            transform: 'scale(2.4)',
            opacity: 0,
        },
    },
}));

const StatusIndicator = styled(Box)(({ theme, status }) => {
    let color;
    switch (status) {
        case 'connected':
            color = theme.palette.success.main;
            break;
        case 'disconnected':
            color = theme.palette.error.main;
            break;
        case 'syncing':
            color = theme.palette.warning.main;
            break;
        default:
            color = theme.palette.grey[500];
    }

    return {
        width: 10,
        height: 10,
        borderRadius: '50%',
        backgroundColor: color,
        boxShadow: `0 0 5px ${color}`,
        animation: status === 'syncing' ? 'pulse 1.5s infinite' : 'none',
        '@keyframes pulse': {
            '0%': { opacity: 1 },
            '50%': { opacity: 0.4 },
            '100%': { opacity: 1 },
        },
    };
});

const StyledMenu = styled(Menu)(({ theme }) => ({
    '& .MuiPaper-root': {
        borderRadius: 16,
        minWidth: 320,
        maxWidth: 380,
        boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 24px rgba(0, 0, 0, 0.5)'
            : '0 8px 24px rgba(0, 0, 0, 0.1)',
    },
}));

const NotificationItem = styled(ListItem)(({ theme, priority, unread }) => {
    let priorityColor;
    switch (priority) {
        case 'high':
            priorityColor = theme.palette.error.main;
            break;
        case 'medium':
            priorityColor = theme.palette.warning.main;
            break;
        default:
            priorityColor = theme.palette.success.main;
    }

    return {
        borderLeft: unread ? `4px solid ${priorityColor}` : 'none',
        backgroundColor: unread ? alpha(priorityColor, 0.08) : 'transparent',
        transition: 'background-color 0.2s, transform 0.2s',
        padding: theme.spacing(1.2),
        '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            transform: 'translateX(4px)',
        },
        '&:not(:last-child)': {
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        },
    };
});

const CategoryBadge = styled(Box)(({ theme, category }) => {
    let color;
    switch (category) {
        case 'finance':
            color = theme.palette.success.main;
            break;
        case 'meeting':
            color = theme.palette.info.main;
            break;
        case 'member':
            color = theme.palette.secondary.main;
            break;
        case 'action':
            color = theme.palette.warning.main;
            break;
        default:
            color = theme.palette.grey[500];
    }

    return {
        backgroundColor: alpha(color, 0.1),
        color: color,
        borderRadius: 12,
        padding: theme.spacing(0.2, 1),
        fontSize: '0.7rem',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        display: 'inline-flex',
        alignItems: 'center',
        '& .MuiSvgIcon-root': {
            fontSize: '0.9rem',
            marginRight: theme.spacing(0.5),
        },
    };
});

/**
 * IndicateurNotification - Composant d'état de notification en temps réel amélioré
 *
 * Ce composant remplace l'ancien indicateur WebSocket par un indicateur de notification
 * plus utile qui affiche le nombre de notifications, la distribution des priorités,
 * et permet un accès rapide aux notifications récentes.
 */
const NotificationIndicator = ({
                                   size = 'medium',
                                   showText = false,
                                   sx = {},
                                   maxNotifications = 5
                               }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        handleNotificationClick,
        refresh
    } = useNotifications();

    // État pour la liste déroulante d'aperçu des notifications
    const [anchorEl, setAnchorEl] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [statusInfo, setStatusInfo] = useState({ status: 'disconnected', lastSynced: null });

    // Déterminer les tailles en fonction de la propriété size
    const iconSize = size === 'small' ? 18 : size === 'medium' ? 24 : 32;
    const textSize = size === 'small' ? 12 : size === 'medium' ? 14 : 16;

    // Calculer les statistiques des notifications
    const highPriorityCount = notifications.filter(n => n.priority === 'high' && !n.read).length;
    const requiresActionCount = notifications.filter(n => n.requires_action && !n.action_completed && !n.read).length;

    // Obtenir l'état de connexion et l'heure de la dernière synchronisation
    useEffect(() => {
        // Vérifier si nous sommes connectés et quand a eu lieu la dernière synchronisation
        const lastSyncTime = localStorage.getItem('lastNotificationSync');

        if (lastSyncTime) {
            setStatusInfo({
                status: 'connected',
                lastSynced: lastSyncTime
            });
        }

        // Configurer la vérification périodique de l'état
        const interval = setInterval(() => {
            const newLastSyncTime = localStorage.getItem('lastNotificationSync');
            if (newLastSyncTime) {
                const timeSinceSync = Date.now() - new Date(newLastSyncTime).getTime();

                // Si la synchronisation a eu lieu au cours de la dernière minute, afficher comme connecté
                if (timeSinceSync < 60000) {
                    setStatusInfo({
                        status: 'connected',
                        lastSynced: newLastSyncTime
                    });
                } else if (timeSinceSync < 300000) {
                    // Si la synchronisation a eu lieu au cours des 5 dernières minutes, afficher comme synchronisation
                    setStatusInfo({
                        status: 'syncing',
                        lastSynced: newLastSyncTime
                    });
                } else {
                    // Sinon, afficher comme déconnecté
                    setStatusInfo({
                        status: 'disconnected',
                        lastSynced: newLastSyncTime
                    });
                }
            }
        }, 10000); // Vérifier toutes les 10 secondes

        return () => clearInterval(interval);
    }, []);

    // Gérer l'ouverture de l'aperçu des notifications
    const handleOpenMenu = (event) => {
        setAnchorEl(event.currentTarget);

        // Déclencher une actualisation lors de l'ouverture
        handleRefresh();
    };

    // Gérer la fermeture de l'aperçu des notifications
    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    // Gérer l'affichage de toutes les notifications
    const handleViewAll = () => {
        navigate('/notifications');
        handleCloseMenu();
    };

    // Gérer l'actualisation des notifications
    const handleRefresh = async () => {
        setRefreshing(true);
        await refresh();

        // Mettre à jour l'heure de la dernière synchronisation
        const now = new Date().toISOString();
        localStorage.setItem('lastNotificationSync', now);

        setStatusInfo({
            status: 'connected',
            lastSynced: now
        });

        setTimeout(() => setRefreshing(false), 800);
    };

    // Gérer le clic sur une notification
    const handleItemClick = (notification) => {
        handleNotificationClick(notification);
        handleCloseMenu();
    };

    // Calculer le contenu de l'infobulle en fonction de l'état
    const getTooltipContent = () => {
        if (refreshing) return "Actualisation des notifications...";

        if (statusInfo.status === 'connected') {
            return `Notifications (${unreadCount} non lues) - Dernière mise à jour ${dayjs(statusInfo.lastSynced).fromNow()}`;
        } else if (statusInfo.status === 'syncing') {
            return "Synchronisation des notifications...";
        } else {
            return "Mises à jour des notifications en pause - Cliquez pour actualiser";
        }
    };

    // Obtenir la catégorie de notification
    const getNotificationCategory = (notification) => {
        const type = notification.notification_type;

        if (type.includes('transaction') || type.includes('donation') || type.includes('budget')) {
            return 'finance';
        } else if (type.includes('meeting') || type.includes('report')) {
            return 'meeting';
        } else if (type.includes('user') || type.includes('member')) {
            return 'member';
        } else if (notification.requires_action || type.includes('action') || notification.priority === 'high') {
            return 'action';
        }

        return 'general';
    };

    // Obtenir le composant d'icône de catégorie
    const getCategoryIcon = (category) => {
        switch (category) {
            case 'finance':
                return <MoneyIcon fontSize="inherit" />;
            case 'meeting':
                return <EventIcon fontSize="inherit" />;
            case 'member':
                return <MembersIcon fontSize="inherit" />;
            case 'action':
                return <ActionRequiredIcon fontSize="inherit" />;
            default:
                return <NotificationsIcon fontSize="inherit" />;
        }
    };

    // Traduire le nom de la catégorie
    const translateCategory = (category) => {
        switch (category) {
            case 'finance':
                return 'finance';
            case 'meeting':
                return 'réunion';
            case 'member':
                return 'membre';
            case 'action':
                return 'action';
            default:
                return 'général';
        }
    };

    return (
        <Box sx={{ position: 'relative', ...sx }}>
            <Tooltip title={getTooltipContent()}>
                <IconButton
                    onClick={handleOpenMenu}
                    sx={{
                        position: 'relative',
                        color: unreadCount > 0 ? theme.palette.primary.main : 'inherit'
                    }}
                >
                    <StyledBadge
                        badgeContent={unreadCount}
                        color="error"
                        invisible={unreadCount === 0}
                    >
                        <NotificationsIcon
                            sx={{
                                fontSize: iconSize,
                                animation: highPriorityCount > 0 ? 'tada 1.5s infinite' : 'none',
                                '@keyframes tada': {
                                    '0%': { transform: 'scale(1)' },
                                    '10%, 20%': { transform: 'scale(0.9) rotate(-3deg)' },
                                    '30%, 50%, 70%, 90%': { transform: 'scale(1.1) rotate(3deg)' },
                                    '40%, 60%, 80%': { transform: 'scale(1.1) rotate(-3deg)' },
                                    '100%': { transform: 'scale(1) rotate(0)' },
                                }
                            }}
                        />
                    </StyledBadge>

                    {/* Point indicateur d'état */}
                    <StatusIndicator
                        status={refreshing ? 'syncing' : statusInfo.status}
                        sx={{
                            position: 'absolute',
                            bottom: 2,
                            right: 2,
                        }}
                    />
                </IconButton>
            </Tooltip>

            {/* Texte d'état (affiché uniquement lorsque showText est true) */}
            {showText && (
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    ml: 1
                }}>
                    <Typography
                        variant="body2"
                        sx={{
                            fontSize: textSize,
                            fontWeight: 'medium',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {unreadCount > 0 ? `${unreadCount} notifications non lues` : 'Notifications'}
                    </Typography>

                    {highPriorityCount > 0 && (
                        <Box
                            sx={{
                                ml: 1,
                                display: 'flex',
                                alignItems: 'center',
                                color: theme.palette.error.main,
                                bgcolor: alpha(theme.palette.error.main, 0.1),
                                borderRadius: 4,
                                px: 1,
                                py: 0.2
                            }}
                        >
                            <HighPriorityIcon sx={{ fontSize: textSize, mr: 0.5 }} />
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                {highPriorityCount} haute priorité
                            </Typography>
                        </Box>
                    )}
                </Box>
            )}

            {/* Liste déroulante d'aperçu des notifications */}
            <StyledMenu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                {/* En-tête */}
                <Box sx={{
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: `1px solid ${theme.palette.divider}`
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            Notifications
                        </Typography>
                        {unreadCount > 0 && (
                            <Badge
                                badgeContent={unreadCount}
                                color="error"
                                sx={{ ml: 1 }}
                            />
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {unreadCount > 0 && (
                            <Tooltip title="Tout marquer comme lu">
                                <IconButton size="small" onClick={markAllAsRead}>
                                    <MarkReadIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}

                        <Tooltip title="Actualiser">
                            <IconButton
                                size="small"
                                onClick={handleRefresh}
                                sx={{ ml: 1 }}
                                disabled={refreshing}
                            >
                                {refreshing ? (
                                    <CircularProgress size={16} thickness={4} />
                                ) : (
                                    <SyncIcon fontSize="small" />
                                )}
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Informations sur l'état */}
                <Box sx={{
                    px: 2,
                    py: 1,
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: alpha(theme.palette.background.default, 0.5),
                    borderBottom: `1px solid ${theme.palette.divider}`
                }}>
                    <StatusIndicator status={statusInfo.status} />
                    <Typography variant="caption" sx={{ ml: 1, color: theme.palette.text.secondary }}>
                        {statusInfo.status === 'connected' ? 'Connecté' :
                            statusInfo.status === 'syncing' ? 'Synchronisation...' : 'Mises à jour en pause'}
                    </Typography>

                </Box>

                {/* Répartition par priorité */}
                <Box sx={{ p: 1.5 }}>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1
                    }}>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            Répartition par priorité:
                        </Typography>

                        <Box sx={{ display: 'flex' }}>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mr: 1.5
                            }}>
                                <HighPriorityIcon
                                    fontSize="small"
                                    sx={{
                                        color: theme.palette.error.main,
                                        fontSize: 14,
                                        mr: 0.5
                                    }}
                                />
                                <Typography variant="caption">
                                    {notifications.filter(n => n.priority === 'high').length}
                                </Typography>
                            </Box>

                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mr: 1.5
                            }}>
                                <MediumPriorityIcon
                                    fontSize="small"
                                    sx={{
                                        color: theme.palette.warning.main,
                                        fontSize: 14,
                                        mr: 0.5
                                    }}
                                />
                                <Typography variant="caption">
                                    {notifications.filter(n => n.priority === 'medium').length}
                                </Typography>
                            </Box>

                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <LowPriorityIcon
                                    fontSize="small"
                                    sx={{
                                        color: theme.palette.success.main,
                                        fontSize: 14,
                                        mr: 0.5
                                    }}
                                />
                                <Typography variant="caption">
                                    {notifications.filter(n => n.priority === 'low').length}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {requiresActionCount > 0 && (
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha(theme.palette.warning.main, 0.1),
                            color: theme.palette.warning.main,
                            borderRadius: 1,
                            py: 0.5,
                            mb: 1
                        }}>
                            <ActionRequiredIcon fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                                {requiresActionCount} {requiresActionCount === 1 ? 'élément nécessite' : 'éléments nécessitent'} votre action
                            </Typography>
                        </Box>
                    )}
                </Box>

                <Divider />

                {/* Notifications récentes */}
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {notifications.length === 0 ? (
                        <Box sx={{
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <NotificationEmptyIcon
                                sx={{
                                    fontSize: 48,
                                    color: alpha(theme.palette.text.secondary, 0.3),
                                    mb: 1
                                }}
                            />
                            <Typography variant="body2" color="textSecondary">
                                Pas encore de notifications
                            </Typography>
                        </Box>
                    ) : (
                        <List disablePadding>
                            {notifications.slice(0, maxNotifications).map(notification => {
                                const category = getNotificationCategory(notification);

                                return (
                                    <NotificationItem
                                        key={notification.id}
                                        priority={notification.priority}
                                        unread={!notification.read}
                                        onClick={() => handleItemClick(notification)}
                                        sx={{ cursor: 'pointer' }}
                                        divider
                                    >
                                        <Box sx={{ width: '100%' }}>
                                            <Box sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                                mb: 0.5
                                            }}>
                                                <Typography
                                                    variant="subtitle2"
                                                    sx={{
                                                        fontWeight: notification.read ? 400 : 600,
                                                        flex: 1
                                                    }}
                                                >
                                                    {notification.title}
                                                </Typography>

                                                <Typography
                                                    variant="caption"
                                                    color="textSecondary"
                                                    sx={{ ml: 1, whiteSpace: 'nowrap' }}
                                                >
                                                    {dayjs(notification.created_at).fromNow()}
                                                </Typography>
                                            </Box>

                                            <Typography
                                                variant="body2"
                                                color="textSecondary"
                                                sx={{
                                                    mb: 0.5,
                                                    display: '-webkit-box',
                                                    overflow: 'hidden',
                                                    WebkitBoxOrient: 'vertical',
                                                    WebkitLineClamp: 2,
                                                }}
                                            >
                                                {notification.message}
                                            </Typography>

                                            <Box sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <CategoryBadge category={category}>
                                                    {getCategoryIcon(category)}
                                                    {translateCategory(category)}
                                                </CategoryBadge>

                                                {notification.requires_action && !notification.action_completed && (
                                                    <Box
                                                        component="span"
                                                        sx={{
                                                            fontSize: '0.7rem',
                                                            color: theme.palette.warning.main,
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <ActionRequiredIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                                                        Action requise
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    </NotificationItem>
                                );
                            })}

                            {notifications.length > maxNotifications && (
                                <Box
                                    sx={{
                                        p: 1,
                                        textAlign: 'center',
                                        bgcolor: alpha(theme.palette.primary.main, 0.05)
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        color="primary"
                                        sx={{ fontWeight: 'medium' }}
                                    >
                                        +{notifications.length - maxNotifications} notifications supplémentaires
                                    </Typography>
                                </Box>
                            )}
                        </List>
                    )}
                </Box>

                <Divider />

                {/* Pied de page */}
                <Box sx={{ p: 1.5, textAlign: 'center' }}>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleViewAll}
                        size="small"
                        sx={{ borderRadius: 4 }}
                    >
                        Voir toutes les notifications
                    </Button>
                </Box>
            </StyledMenu>
        </Box>
    );
};

export default NotificationIndicator;