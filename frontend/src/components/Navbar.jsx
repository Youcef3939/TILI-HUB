import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    AppBar,
    Box,
    Toolbar,
    IconButton,
    Typography,
    Avatar,
    Menu,
    MenuItem,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    useMediaQuery,
    Badge,
    SwipeableDrawer,
    Breadcrumbs,
    Tooltip,
    Stack,
    Paper,
    Button,
} from '@mui/material';
import { styled, alpha, useTheme } from '@mui/material/styles';

// Icons
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import GroupIcon from '@mui/icons-material/Group';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import InfoIcon from '@mui/icons-material/Info';

import Axios from './Axios';
import { usePermissions } from "../contexts/PermissionsContext.jsx";
import { useNotifications } from "../contexts/NotificationContext.jsx";
import { useColorMode } from '../contexts/ThemeContext';

// Import logo
import logoImage from '../assets/logotili.jpeg';

// ============================================================================
// CONSTANTS
// ============================================================================
const DRAWER_WIDTH = 280;
const APPBAR_HEIGHT = 64;
const MOBILE_APPBAR_HEIGHT = 56;

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const StyledAppBar = styled(AppBar)(({ theme }) => ({
    background: theme.palette.mode === 'dark'
        ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
        : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
    zIndex: theme.zIndex.drawer + 1,
    boxShadow: theme.shadows[4],
    borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.12)}`,
    backdropFilter: 'blur(10px)',
}));

const LogoSection = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    minWidth: 180,
    cursor: 'pointer',
    transition: 'transform 0.2s ease',

    '&:hover': {
        transform: 'scale(1.02)',
    },

    [theme.breakpoints.down('sm')]: {
        minWidth: 'auto',
        gap: theme.spacing(1),
    },
}));

const LogoImage = styled('img')(({ theme }) => ({
    height: 42,
    width: 42,
    objectFit: 'contain',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.common.white,
    padding: 4,
    boxShadow: theme.shadows[2],
    transition: 'all 0.3s ease',

    '&:hover': {
        boxShadow: theme.shadows[4],
    },

    [theme.breakpoints.down('sm')]: {
        height: 36,
        width: 36,
        padding: 3,
    },
}));

const NavActionBox = styled(Stack)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),

    [theme.breakpoints.down('sm')]: {
        gap: theme.spacing(0.5),
    },
}));

const NavIconButton = styled(IconButton)(({ theme }) => ({
    color: theme.palette.common.white,
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    padding: theme.spacing(1.2),
    position: 'relative',
    backdropFilter: 'blur(10px)',
    background: alpha(theme.palette.common.white, 0.08),
    border: `1px solid ${alpha(theme.palette.common.white, 0.12)}`,

    '&:hover': {
        backgroundColor: alpha(theme.palette.common.white, 0.2),
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows[4],
    },

    '&:active': {
        transform: 'scale(0.95)',
    },

    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(0.9),
    },
}));

const NotificationBadgeStyled = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        backgroundColor: theme.palette.error.main,
        color: theme.palette.common.white,
        boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
        minWidth: 22,
        height: 22,
        borderRadius: '50%',
        fontSize: '0.75rem',
        fontWeight: 700,
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    },
    '@keyframes pulse': {
        '0%, 100%': {
            opacity: 1,
        },
        '50%': {
            opacity: 0.7,
        },
    },
}));

const StyledDrawer = styled(SwipeableDrawer)(({ theme }) => ({
    '& .MuiDrawer-paper': {
        width: DRAWER_WIDTH,
        boxSizing: 'border-box',
        background: theme.palette.mode === 'dark'
            ? theme.palette.background.paper
            : theme.palette.background.paper,
        borderRight: `1px solid ${theme.palette.divider}`,
        boxShadow: 'none',
        overflowX: 'hidden',
    },

    [theme.breakpoints.down('sm')]: {
        '& .MuiDrawer-paper': {
            width: '85vw',
            maxWidth: 320,
            boxShadow: theme.shadows[8],
        },
    },
}));

const PermanentDrawerStyled = styled(Box)(({ theme }) => ({
    width: DRAWER_WIDTH,
    flexShrink: 0,
    '& .MuiDrawer-paper': {
        width: DRAWER_WIDTH,
        boxSizing: 'border-box',
        background: theme.palette.mode === 'dark'
            ? theme.palette.background.paper
            : theme.palette.background.paper,
        borderRight: `1px solid ${theme.palette.divider}`,
        boxShadow: 'none',
        overflowX: 'hidden',
    },
}));

const UserProfileCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    margin: theme.spacing(2, 1.5),
    borderRadius: theme.shape.borderRadius * 2,
    background: theme.palette.mode === 'dark'
        ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`
        : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    backdropFilter: 'blur(10px)',
    boxShadow: theme.shadows[2],
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
    margin: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius * 2,
    transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    minHeight: 48,
    overflow: 'hidden',

    '&::before': {
        content: '""',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 0,
        background: `linear-gradient(90deg, ${theme.palette.primary.main}, transparent)`,
        transition: 'width 250ms ease',
    },

    '&:hover': {
        background: alpha(theme.palette.primary.main, 0.12),
        transform: 'translateX(4px)',

        '&::before': {
            width: '4px',
        },

        '& .MuiListItemIcon-root': {
            color: theme.palette.primary.main,
            transform: 'scale(1.15)',
        },
    },

    '&.Mui-selected': {
        background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.2)}, ${alpha(theme.palette.primary.main, 0.08)})`,
        color: theme.palette.primary.main,
        fontWeight: 700,
        borderLeft: `4px solid ${theme.palette.primary.main}`,

        '& .MuiListItemIcon-root': {
            color: theme.palette.primary.main,
        },

        '&:hover': {
            background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.25)}, ${alpha(theme.palette.primary.main, 0.12)})`,
        }
    },

    '& .MuiListItemIcon-root': {
        minWidth: 44,
        color: theme.palette.text.secondary,
        transition: 'all 200ms ease',
    },
}));

const NotificationItem = styled(Paper)(({ theme, isRead }) => ({
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1),
    borderRadius: theme.shape.borderRadius * 1.5,
    border: `1px solid ${theme.palette.divider}`,
    background: isRead
        ? 'transparent'
        : theme.palette.mode === 'dark'
            ? alpha(theme.palette.primary.main, 0.08)
            : alpha(theme.palette.primary.main, 0.05),
    cursor: 'pointer',
    transition: 'all 200ms ease',
    position: 'relative',
    overflow: 'hidden',

    '&::before': {
        content: '""',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: isRead ? 0 : '4px',
        background: theme.palette.primary.main,
    },

    '&:hover': {
        background: alpha(theme.palette.primary.main, 0.12),
        boxShadow: theme.shadows[3],
        transform: 'translateX(4px)',
    },
}));

const StyledProfileMenu = styled(Menu)(({ theme }) => ({
    '& .MuiPaper-root': {
        borderRadius: theme.shape.borderRadius * 2.5,
        minWidth: 260,
        marginTop: theme.spacing(1.5),
        boxShadow: theme.shadows[8],
        border: `1px solid ${theme.palette.divider}`,
        backdropFilter: 'blur(20px)',
        background: theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.95)
            : alpha(theme.palette.background.paper, 0.98),
        maxHeight: 'calc(100vh - 100px)',
        overflow: 'auto',

        [theme.breakpoints.down('sm')]: {
            minWidth: 'calc(100vw - 32px)',
            maxWidth: 'calc(100vw - 32px)',
            width: 'calc(100vw - 32px)',
            left: '16px !important',
            right: '16px !important',
            marginTop: theme.spacing(1),
        },
    },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
    fontSize: '0.7rem',
    fontWeight: 800,
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    padding: theme.spacing(2, 2, 1, 2),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),

    '&::before': {
        content: '""',
        width: 3,
        height: 12,
        background: theme.palette.primary.main,
        borderRadius: 2,
    },
}));

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function NavBar({ content }) {
    const theme = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { can } = usePermissions();
    const { notifications = [], unreadCount = 0, markAsRead = () => {}, clearAll = () => {} } = useNotifications() || {};
    const colorMode = useColorMode();

    // State
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
    const [notificationMenuAnchor, setNotificationMenuAnchor] = useState(null);
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState('member');
    const [userInitial, setUserInitial] = useState('');
    const [associationName, setAssociationName] = useState('');

    const darkMode = colorMode.mode === 'dark';
    const isProfileMenuOpen = Boolean(profileMenuAnchor);
    const isNotificationMenuOpen = Boolean(notificationMenuAnchor);

    // Navigation structure - Simplified (no sub-menus)
    const navigationStructure = useMemo(() => [
        {
            id: 'main',
            title: 'Principal',
            items: [
                {
                    name: 'Tableau de Bord',
                    path: '/home',
                    icon: <DashboardIcon />,
                    resource: null,
                    action: null
                },
                ...(userRole === 'president' ? [{
                    name: 'Admin Dashboard',
                    path: '/admin-dashboard',
                    icon: <AdminPanelSettingsIcon />,
                    resource: 'members',
                    action: 'validate_user'
                }] : []),
            ]
        },
        {
            id: 'management',
            title: 'Gestion',
            items: [
                {
                    name: 'Projets',
                    path: '/projects',
                    icon: <BusinessIcon />,
                    resource: 'projects',
                    action: 'view',
                },
                {
                    name: 'Membres',
                    path: '/members',
                    icon: <GroupIcon />,
                    resource: 'members',
                    action: 'view',
                },
                {
                    name: 'En Attente',
                    path: '/pending-users',
                    icon: <HourglassEmptyIcon />,
                    resource: 'members',
                    action: 'validate_user',
                },
                {
                    name: 'Finance',
                    path: '/finance',
                    icon: <AccountBalanceIcon />,
                    resource: 'finance',
                    action: 'view',
                },
                {
                    name: 'Réunions',
                    path: '/meetings',
                    icon: <MeetingRoomIcon />,
                    resource: 'meetings',
                    action: 'view',
                },
                {
                    name: 'Notifications',
                    path: '/notifications',
                    icon: <NotificationsIcon />,
                    resource: null,
                    action: null
                },
            ]
        },
        {
            id: 'system',
            title: 'Système',
            items: [
                {
                    name: 'Assistant IA',
                    path: '/chatbot',
                    icon: <SmartToyIcon />,
                    resource: 'chatbot',
                    action: 'view'
                },
            ]
        }
    ], [userRole]);

    // Fetch user data
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('Token') || localStorage.getItem('token');
                if (!token) {
                    navigate('/');
                    return;
                }

                const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
                Axios.defaults.headers.common['Authorization'] = authHeader;

                const response = await Axios.get('/users/profile/');
                if (response.data) {
                    const fullName = response.data.full_name || 'User';
                    setUserName(fullName);
                    setUserInitial(fullName.charAt(0).toUpperCase());
                    setUserRole(response.data.role?.name?.toLowerCase() || 'member');
                    if (response.data.association) {
                        setAssociationName(response.data.association.name);
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
    }, [navigate]);

    // Update page title
    useEffect(() => {
        const pageName = location.pathname.split('/').filter(Boolean).pop() || 'home';
        const formattedPageName = pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/-/g, ' ');
        document.title = `${formattedPageName} - ${associationName || 'Application'}`;
    }, [location.pathname, associationName]);

    // Close drawer on route change
    useEffect(() => {
        setMobileDrawerOpen(false);
    }, [location.pathname]);

    // Handlers
    const handleProfileMenuOpen = (event) => {
        setProfileMenuAnchor(event.currentTarget);
    };

    const handleProfileMenuClose = () => {
        setProfileMenuAnchor(null);
    };

    const handleNotificationMenuOpen = (event) => {
        setNotificationMenuAnchor(event.currentTarget);
    };

    const handleNotificationMenuClose = () => {
        setNotificationMenuAnchor(null);
    };

    const handleLogout = () => {
        handleProfileMenuClose();
        localStorage.removeItem('Token');
        localStorage.removeItem('token');
        navigate('/');
    };

    const handleThemeToggle = () => {
        colorMode.toggleColorMode();
        handleProfileMenuClose();
    };

    const handleNavigateToAdmin = () => {
        handleProfileMenuClose();
        navigate('/admin-dashboard');
    };

    const handleNotificationClick = (notificationId) => {
        if (markAsRead) {
            markAsRead(notificationId);
        }
    };

    const handleClearAllNotifications = () => {
        if (clearAll) {
            clearAll();
        }
        handleNotificationMenuClose();
    };

    // Breadcrumbs
    const getBreadcrumbs = () => {
        const pathnames = location.pathname.split('/').filter(x => x);

        if (pathnames.length === 0) {
            return [{ label: 'Accueil', path: '/home', icon: <HomeIcon fontSize="small" /> }];
        }

        return [
            { label: 'Accueil', path: '/home', icon: <HomeIcon fontSize="small" /> },
            ...pathnames.map((value, index) => {
                const path = `/${pathnames.slice(0, index + 1).join('/')}`;
                const label = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');
                return { label, path };
            })
        ];
    };

    // Drawer content
    const drawerContent = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Spacer for AppBar */}
            <Box sx={{ height: { xs: MOBILE_APPBAR_HEIGHT, sm: APPBAR_HEIGHT } }} />

            <UserProfileCard elevation={0}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{
                        width: 48,
                        height: 48,
                        fontWeight: 800,
                        bgcolor: 'primary.main',
                        fontSize: '1.2rem',
                        boxShadow: 3,
                    }}>
                        {userInitial}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {userName}
                        </Typography>
                        <Typography variant="caption" sx={{
                            color: 'primary.main',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            fontSize: '0.7rem',
                            letterSpacing: '0.05em'
                        }}>
                            {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                        </Typography>
                    </Box>
                </Box>
                {associationName && (
                    <Typography
                        variant="caption"
                        sx={{
                            color: 'text.secondary',
                            display: 'block',
                            mt: 1,
                            pt: 1,
                            borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                            fontWeight: 500,
                        }}
                    >
                        📍 {associationName}
                    </Typography>
                )}
            </UserProfileCard>

            <List sx={{ flex: 1, overflow: 'auto', px: 0.5, pb: 2 }}>
                {navigationStructure.map((section) => (
                    <Box key={section.id}>
                        <SectionTitle>
                            {section.title}
                        </SectionTitle>
                        {section.items.map((item) => {
                            const isActive = location.pathname === item.path;
                            const hasAccess = !item.resource || can(item.action, item.resource);

                            if (!hasAccess) return null;

                            return (
                                <StyledListItemButton
                                    key={item.path}
                                    component={Link}
                                    to={item.path}
                                    selected={isActive}
                                    disableRipple
                                >
                                    <ListItemIcon>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.name}
                                        primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500 }}
                                    />
                                </StyledListItemButton>
                            );
                        })}
                    </Box>
                ))}
            </List>
        </Box>
    );

    // ============================================================================
    // RENDER
    // ============================================================================
    return (
        <>
            {/* AppBar */}
            <StyledAppBar position="fixed">
                <Toolbar
                    sx={{
                        minHeight: { xs: `${MOBILE_APPBAR_HEIGHT}px !important`, sm: `${APPBAR_HEIGHT}px !important` },
                        justifyContent: 'space-between',
                        gap: 2,
                        px: { xs: 1.5, sm: 3 },
                    }}
                >
                    {/* Left Section - Menu + Logo */}
                    <LogoSection onClick={() => navigate('/home')}>
                        {isMobile && (
                            <NavIconButton
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMobileDrawerOpen(!mobileDrawerOpen);
                                }}
                                aria-label="Menu"
                                disableRipple
                            >
                                <MenuIcon />
                            </NavIconButton>
                        )}
                        <LogoImage src={logoImage} alt="Logo" />
                        {!isSmallMobile && (
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 800,
                                    color: 'white',
                                    lineHeight: 1,
                                    fontSize: '1.25rem',
                                    letterSpacing: '-0.02em',
                                }}
                            >
                                TILI
                            </Typography>
                        )}
                    </LogoSection>

                    {/* Center Section - Breadcrumbs */}
                    {!isSmallMobile && (
                        <Breadcrumbs
                            sx={{
                                flex: 1,
                                '& .MuiBreadcrumbs-separator': {
                                    color: alpha(theme.palette.common.white, 0.5),
                                    mx: 0.5,
                                },
                                '& a': {
                                    color: alpha(theme.palette.common.white, 0.85),
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    fontSize: '0.9rem',
                                    fontWeight: 500,
                                    transition: 'all 200ms ease',
                                    padding: theme.spacing(0.5, 1),
                                    borderRadius: theme.shape.borderRadius,

                                    '&:hover': {
                                        color: theme.palette.common.white,
                                        background: alpha(theme.palette.common.white, 0.15),
                                    }
                                }
                            }}
                        >
                            {getBreadcrumbs().map((crumb, index) => (
                                <Link key={crumb.path} to={crumb.path}>
                                    {index === 0 && crumb.icon}
                                    {crumb.label}
                                </Link>
                            ))}
                        </Breadcrumbs>
                    )}

                    {/* Right Section - Actions */}
                    <NavActionBox direction="row">
                        {/* Notifications Button */}
                        <Tooltip title="Notifications" arrow>
                            <NavIconButton
                                onClick={handleNotificationMenuOpen}
                                aria-label="Notifications"
                                disableRipple
                            >
                                <NotificationBadgeStyled badgeContent={unreadCount} color="error">
                                    <NotificationsIcon />
                                </NotificationBadgeStyled>
                            </NavIconButton>
                        </Tooltip>

                        {/* Profile Button */}
                        <Tooltip title="Profil" arrow>
                            <NavIconButton
                                onClick={handleProfileMenuOpen}
                                aria-label="Profil"
                                disableRipple
                            >
                                <Avatar sx={{
                                    width: 28,
                                    height: 28,
                                    fontSize: '0.8rem',
                                    fontWeight: 800,
                                    border: `2px solid ${alpha(theme.palette.common.white, 0.3)}`,
                                }}>
                                    {userInitial}
                                </Avatar>
                            </NavIconButton>
                        </Tooltip>
                    </NavActionBox>
                </Toolbar>
            </StyledAppBar>

            {/* Notification Menu */}
            <StyledProfileMenu
                anchorEl={notificationMenuAnchor}
                open={isNotificationMenuOpen}
                onClose={handleNotificationMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                disableScrollLock
            >
                <Box sx={{
                    p: 2.5,
                    minWidth: { xs: 'auto', sm: 380 },
                    maxWidth: '100%',
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
                            Notifications
                        </Typography>
                        {unreadCount > 0 && (
                            <Button
                                size="small"
                                startIcon={<ClearAllIcon />}
                                onClick={handleClearAllNotifications}
                                disableRipple
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                }}
                            >
                                Tout Effacer
                            </Button>
                        )}
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    {notifications && notifications.length > 0 ? (
                        <Box sx={{ maxHeight: 450, overflowY: 'auto', overflowX: 'hidden', pr: 0.5 }}>                            {notifications.slice(0, 10).map((notif) => (
                                <NotificationItem
                                    key={notif.id}
                                    isRead={notif.isRead}
                                    onClick={() => handleNotificationClick(notif.id)}
                                    elevation={0}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: notif.isRead ? 400 : 700,
                                                flex: 1,
                                                fontSize: '0.9rem',
                                                wordBreak: 'break-word',
                                                overflowWrap: 'break-word',
                                                whiteSpace: 'normal',
                                            }}
                                        >
                                            {notif.message}
                                        </Typography>
                                        {!notif.isRead && (
                                            <Box
                                                sx={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: '50%',
                                                    background: theme.palette.primary.main,
                                                    ml: 1.5,
                                                    mt: 0.5,
                                                    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`,
                                                }}
                                            />
                                        )}
                                    </Box>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: 'text.secondary',
                                            display: 'block',
                                            mt: 1,
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                        }}
                                    >
                                        {notif.timestamp && new Date(notif.timestamp).toLocaleString('fr-FR')}
                                    </Typography>
                                </NotificationItem>
                            ))}
                        </Box>
                    ) : (
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                            <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                Aucune notification
                            </Typography>
                        </Box>
                    )}
                </Box>
            </StyledProfileMenu>

            {/* Profile Menu */}
            <StyledProfileMenu
                anchorEl={profileMenuAnchor}
                open={isProfileMenuOpen}
                onClose={handleProfileMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                disableScrollLock
            >
                <Box sx={{ px: 2.5, py: 2, minWidth: { xs: 'auto', sm: 260 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <Avatar sx={{
                            width: 48,
                            height: 48,
                            fontWeight: 800,
                            bgcolor: 'primary.main',
                            fontSize: '1.2rem',
                        }}>
                            {userInitial}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {userName}
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: 'primary.main',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    fontSize: '0.7rem',
                                }}
                            >
                                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
                <Divider />

                {userRole === 'president' && (
                    <MenuItem
                        onClick={handleNavigateToAdmin}
                        disableRipple
                        sx={{
                            color: 'primary.main',
                            py: 1.5,
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.12),
                            }
                        }}
                    >
                        <ListItemIcon>
                            <AdminPanelSettingsIcon fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText
                            primary="Administration"
                            primaryTypographyProps={{ fontWeight: 600 }}
                        />
                    </MenuItem>
                )}

                <MenuItem
                    onClick={() => { handleProfileMenuClose(); navigate('/settings'); }}
                    disableRipple
                    sx={{
                        py: 1.5,
                        '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        }
                    }}
                >
                    <ListItemIcon>
                        <SettingsIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                        primary="Paramètres"
                        primaryTypographyProps={{ fontWeight: 500 }}
                    />
                </MenuItem>

                <MenuItem
                    onClick={handleThemeToggle}
                    disableRipple
                    sx={{
                        py: 1.5,
                        '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        }
                    }}
                >
                    <ListItemIcon>
                        {darkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
                    </ListItemIcon>
                    <ListItemText
                        primary={darkMode ? 'Mode Clair' : 'Mode Sombre'}
                        primaryTypographyProps={{ fontWeight: 500 }}
                    />
                </MenuItem>

                <Divider />

                <MenuItem
                    onClick={handleLogout}
                    disableRipple
                    sx={{
                        color: 'error.main',
                        py: 1.5,
                        '&:hover': {
                            backgroundColor: alpha(theme.palette.error.main, 0.12),
                        }
                    }}
                >
                    <ListItemIcon>
                        <LogoutIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText
                        primary="Déconnexion"
                        primaryTypographyProps={{ fontWeight: 600 }}
                    />
                </MenuItem>
            </StyledProfileMenu>

            {/* Drawer */}
            {isMobile ? (
                <StyledDrawer
                    anchor="left"
                    open={mobileDrawerOpen}
                    onClose={() => setMobileDrawerOpen(false)}
                    onOpen={() => setMobileDrawerOpen(true)}
                    disableBackdropTransition
                >
                    {drawerContent}
                </StyledDrawer>
            ) : (
                <PermanentDrawerStyled
                    component="nav"
                    sx={{
                        '& > div': {
                            position: 'fixed',
                            height: '100vh',
                            top: 0,
                            left: 0,
                        }
                    }}
                >
                    <Box
                        sx={{
                            width: DRAWER_WIDTH,
                            borderRight: `1px solid ${theme.palette.divider}`,
                            bgcolor: 'background.paper',
                            height: '100vh',
                            overflow: 'auto',
                        }}
                    >
                        {drawerContent}
                    </Box>
                </PermanentDrawerStyled>
            )}

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    pt: { xs: `${MOBILE_APPBAR_HEIGHT}px`, sm: `${APPBAR_HEIGHT}px` },
                    ml: { xs: 0, md: `${DRAWER_WIDTH}px` },
                    minHeight: '100vh',
                    width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
                    backgroundColor: theme.palette.background.default,
                    transition: 'all 200ms ease',
                }}
            >
                {content}
            </Box>
        </>
    );
}