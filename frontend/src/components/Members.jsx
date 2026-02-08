import React, { useEffect, useMemo, useState } from 'react';
import AxiosInstance from './Axios.jsx';
import { MaterialReactTable } from 'material-react-table';
import Dayjs from "dayjs";
import {
    Box,
    IconButton,
    Typography,
    Button,
    CircularProgress,
    Paper,
    Chip,
    Tooltip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    Snackbar,
    Alert,
    useTheme,
    alpha,
    Avatar,
    Card,
    CardContent,
    CardActions,
    Badge,
    Grid,
    Divider,
    useMediaQuery,
    Stack,
    Fab
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useNavigate, Link, useLocation } from 'react-router-dom';

// Import permission components
import { PermissionRequired } from '../contexts/ConditionalUI.jsx';
import { usePermissions } from '../contexts/PermissionsContext.jsx';
import { secureApi } from '../utils/secureApi.js';

// Icons
import PermIdentityIcon from '@mui/icons-material/PermIdentity';
import InfoIcon from '@mui/icons-material/Info';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ViewListIcon from '@mui/icons-material/ViewList';
import GridViewIcon from '@mui/icons-material/GridView';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EmailIcon from '@mui/icons-material/Email';
import WorkIcon from '@mui/icons-material/Work';
import HomeIcon from '@mui/icons-material/Home';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PublicIcon from '@mui/icons-material/Public';
import CakeIcon from '@mui/icons-material/Cake';
import EventIcon from '@mui/icons-material/Event';
import CloseIcon from '@mui/icons-material/Close';

// Styled components with mobile optimization
const HeaderContainer = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    padding: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
        padding: theme.spacing(2, 3),
    },
    borderRadius: '8px',
    marginBottom: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
        marginBottom: theme.spacing(3),
    },
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
}));

const ActionButton = styled(Button)(({ theme }) => ({
    borderRadius: '8px',
    fontWeight: 600,
    padding: '10px 20px',
    minHeight: 48,
    fontSize: '1rem',
    [theme.breakpoints.up('sm')]: {
        padding: '8px 16px',
        minHeight: 44,
        fontSize: '0.95rem',
    },
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 10px rgba(0, 0, 0, 0.15)',
    },
}));

const MemberCard = styled(Card)(({ theme }) => ({
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.3s ease',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',  // CRITICAL: Ensures absolute positioning works within card
    width: '100%',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.12)',
    }
}));

const MemberAvatar = styled(Avatar)(({ theme }) => ({
    width: 80,
    height: 80,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    fontSize: '2rem',
    fontWeight: 'bold',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    border: `3px solid ${theme.palette.background.paper}`,
    margin: '-50px auto 16px auto',
    position: 'relative',
    zIndex: 1,
    [theme.breakpoints.down('sm')]: {
        width: 70,
        height: 70,
        fontSize: '1.8rem',
        margin: '-45px auto 12px auto',
    }
}));

const RoleChip = styled(Chip)(({ theme, role }) => {
    const roleMap = {
        'Président': { color: theme.palette.error.main, bgcolor: alpha(theme.palette.error.main, 0.1) },
        'Secrétaire générale': { color: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.1) },
        'Trésorier': { color: theme.palette.success.main, bgcolor: alpha(theme.palette.success.main, 0.1) },
        'Membre': { color: theme.palette.info.main, bgcolor: alpha(theme.palette.info.main, 0.1) }
    };

    const roleStyle = roleMap[role] || { color: theme.palette.secondary.main, bgcolor: alpha(theme.palette.secondary.main, 0.1) };

    return {
        fontWeight: 500,
        fontSize: '0.875rem',
        color: roleStyle.color,
        backgroundColor: roleStyle.bgcolor,
        [theme.breakpoints.down('sm')]: {
            fontSize: '0.95rem',
            height: 28,
        },
    };
});

const MemberCardHeader = styled(Box)(({ theme }) => ({
    backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
    height: 80,
    width: '100%',
    position: 'relative',
    overflow: 'visible',  // CRITICAL: Allow badge to overflow
    [theme.breakpoints.down('sm')]: {
        height: 70,
    },
}));

const DetailItem = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    marginBottom: theme.spacing(2),
}));

const DetailIcon = styled(Box)(({ theme }) => ({
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    borderRadius: '8px',
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.primary.main,
    flexShrink: 0,
    [theme.breakpoints.down('sm')]: {
        width: 36,
        height: 36,
    }
}));

const FloatingActionButton = styled(Fab)(({ theme }) => ({
    position: 'fixed',
    bottom: theme.spacing(3),
    right: theme.spacing(2),
    zIndex: 1000,
    width: 64,
    height: 64,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
}));

const MobileActionButton = styled(Button)(({ theme }) => ({
    minHeight: 48,
    fontSize: '1rem',
    fontWeight: 600,
    borderRadius: '8px',
    [theme.breakpoints.up('sm')]: {
        minHeight: 40,
        fontSize: '0.875rem',
    },
}));

const Members = () => {
    const { can, RESOURCES, ACTIONS } = usePermissions();
    const api = secureApi();

    const [myData, setMyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [refreshing, setRefreshing] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [memberToDelete, setMemberToDelete] = useState(null);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
    const [openViewDialog, setOpenViewDialog] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);

    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    const fetchData = async () => {
        setRefreshing(true);
        try {
            const response = await api.get(RESOURCES.MEMBERS, '/api/member/');
            setMyData(response.data);
        } catch (error) {
            console.error('Error fetching members:', error);
            setNotification({
                open: true,
                message: 'Failed to load members. Please try again.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();

        if (location.state?.success) {
            setNotification({
                open: true,
                message: location.state.message || 'Operation completed successfully',
                severity: 'success'
            });
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.pathname]);

    const handleOpenDeleteDialog = (member) => {
        setMemberToDelete(member);
        setOpenDeleteDialog(true);
        setDeleteConfirmText('');
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
        setMemberToDelete(null);
        setDeleteConfirmText('');
    };

    const handleOpenViewDialog = (member) => {
        setSelectedMember(member);
        setOpenViewDialog(true);
    };

    const handleCloseViewDialog = () => {
        setOpenViewDialog(false);
        setSelectedMember(null);
    };

    const handleDeleteMember = async () => {
        if (!memberToDelete) return;

        try {
            if (!can(ACTIONS.DELETE, RESOURCES.MEMBERS)) {
                setNotification({
                    open: true,
                    message: 'You do not have permission to delete members.',
                    severity: 'error'
                });
                handleCloseDeleteDialog();
                return;
            }

            await api.delete(RESOURCES.MEMBERS, `/api/member/${memberToDelete.id}/`);

            setNotification({
                open: true,
                message: `Le membre "${memberToDelete.name}" a été supprimé`,
                severity: 'success'
            });
            fetchData();
        } catch (error) {
            console.error('Error deleting member:', error);
            setNotification({
                open: true,
                message: error.message || 'Échec de la suppression du membre.',
                severity: 'error'
            });
        }

        handleCloseDeleteDialog();
    };

    const handleCloseNotification = (event, reason) => {
        if (reason === 'clickaway') return;
        setNotification({ ...notification, open: false });
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const columns = useMemo(
        () => [
            {
                accessorKey: 'name',
                header: 'Nom',
                size: 170,
                Cell: ({ cell, row }) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Badge
                            invisible={!row.original.needs_profile_completion}
                            badgeContent={<ErrorOutlineIcon fontSize="small" />}
                            color="warning"
                            overlap="circular"
                        >
                            <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 36, height: 36 }}>
                                {getInitials(cell.getValue())}
                            </Avatar>
                        </Badge>
                        <Box>
                            <Typography fontWeight={500} sx={{ fontSize: { xs: '1rem', sm: '0.875rem' } }}>
                                {cell.getValue()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.9rem', sm: '0.75rem' } }}>
                                {row.original.email}
                            </Typography>
                            {row.original.needs_profile_completion && (
                                <Chip
                                    label="Complétion nécessaire"
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    sx={{ mt: 0.5, height: 20 }}
                                />
                            )}
                        </Box>
                    </Box>
                ),
            },
        ],
        [theme]
    );

    return (
        <Box sx={{
            pb: isMobile ? 10 : 0,
            px: { xs: 1, sm: 2, md: 3 },
            width: '100%',
            overflowX: 'hidden',
            boxSizing: 'border-box'
        }}>
            {/* Header */}
            <HeaderContainer>
                <PersonIcon sx={{ mr: { xs: 1.5, sm: 2 }, fontSize: { xs: 24, sm: 28 } }} />
                <Box sx={{ zIndex: 1, flex: 1 }}>
                    <Typography
                        variant="h5"
                        component="h1"
                        fontWeight="bold"
                        sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
                    >
                        Gestion des Membres
                    </Typography>
                    <Typography
                        variant="subtitle2"
                        sx={{
                            fontSize: { xs: '0.85rem', sm: '0.875rem' },
                            display: { xs: 'none', sm: 'block' }
                        }}
                    >
                        Gérez les informations des membres
                    </Typography>
                </Box>
            </HeaderContainer>

            {/* Action Bar */}
            <Stack
                direction="row"
                spacing={1}
                sx={{
                    mb: 2,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Vue Grille">
                        <IconButton
                            color={viewMode === 'grid' ? 'primary' : 'default'}
                            onClick={() => setViewMode('grid')}
                            sx={{
                                bgcolor: viewMode === 'grid' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                                minWidth: 48,
                                minHeight: 48,
                            }}
                        >
                            <GridViewIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Vue Tableau">
                        <IconButton
                            color={viewMode === 'table' ? 'primary' : 'default'}
                            onClick={() => setViewMode('table')}
                            sx={{
                                bgcolor: viewMode === 'table' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                                minWidth: 48,
                                minHeight: 48,
                            }}
                        >
                            <ViewListIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Actualiser">
                        <IconButton
                            onClick={fetchData}
                            disabled={refreshing}
                            sx={{
                                minWidth: 48,
                                minHeight: 48,
                                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                            }}
                        >
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Stack>

                {/* Desktop Add Button */}
                {!isMobile && (
                    <PermissionRequired
                        resource={RESOURCES.MEMBERS}
                        action={ACTIONS.CREATE}
                    >
                        <ActionButton
                            variant="contained"
                            color="primary"
                            component={Link}
                            to="/CreateMember"
                            startIcon={<AddIcon />}
                        >
                            Ajouter un Membre
                        </ActionButton>
                    </PermissionRequired>
                )}
            </Stack>

            {/* Main Content */}
            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh" flexDirection="column" gap={2}>
                    <CircularProgress size={isMobile ? 60 : 50} color="primary" />
                    <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '1.1rem', sm: '1rem' } }}>
                        Chargement des membres...
                    </Typography>
                </Box>
            ) : myData.length === 0 ? (
                <Paper
                    sx={{
                        p: { xs: 3, sm: 4 },
                        textAlign: 'center',
                        borderRadius: '12px',
                        bgcolor: alpha(theme.palette.background.paper, 0.6),
                        border: `1px dashed ${theme.palette.divider}`
                    }}
                >
                    <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.15rem', sm: '1.25rem' } }}>
                        Aucun membre trouvé
                    </Typography>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 3, fontSize: { xs: '1rem', sm: '0.875rem' } }}
                    >
                        Commencez par ajouter votre premier membre
                    </Typography>

                    <PermissionRequired
                        resource={RESOURCES.MEMBERS}
                        action={ACTIONS.CREATE}
                    >
                        <ActionButton
                            variant="contained"
                            color="primary"
                            component={Link}
                            to="/CreateMember"
                            startIcon={<AddIcon />}
                            fullWidth={isMobile}
                        >
                            Ajouter un Membre
                        </ActionButton>
                    </PermissionRequired>
                </Paper>
            ) : viewMode === 'table' ? (
                <Box sx={{
                    '& .MuiTableCell-root': {
                        fontSize: { xs: '1rem', sm: '0.875rem' },
                        padding: { xs: '16px 12px', sm: '16px' }
                    }
                }}>
                    <MaterialReactTable
                        columns={columns}
                        data={myData}
                        enableRowActions
                        muiTablePaperProps={{
                            elevation: 0,
                            sx: {
                                borderRadius: '12px',
                                overflow: 'hidden',
                                border: `1px solid ${theme.palette.divider}`
                            },
                        }}
                        renderRowActions={({ row }) => (
                            <Stack direction="row" spacing={0.5}>
                                <Tooltip title="Voir">
                                    <IconButton
                                        size="small"
                                        color="info"
                                        onClick={() => handleOpenViewDialog(row.original)}
                                        sx={{ minWidth: 40, minHeight: 40 }}
                                    >
                                        <VisibilityIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>

                                <PermissionRequired
                                    resource={RESOURCES.MEMBERS}
                                    action={ACTIONS.EDIT}
                                >
                                    <Tooltip title="Modifier">
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            component={Link}
                                            to={`/member/editmember/${row.original.id}`}
                                            sx={{ minWidth: 40, minHeight: 40 }}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </PermissionRequired>

                                <PermissionRequired
                                    resource={RESOURCES.MEMBERS}
                                    action={ACTIONS.DELETE}
                                >
                                    <Tooltip title="Supprimer">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleOpenDeleteDialog(row.original)}
                                            sx={{ minWidth: 40, minHeight: 40 }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </PermissionRequired>
                            </Stack>
                        )}
                    />
                </Box>
            ) : (
                /* Grid View - FIXED LAYOUT TO PREVENT OVERFLOW */
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',                     // 1 column on mobile
                            sm: 'repeat(2, 1fr)',          // 2 columns on small tablets
                            md: 'repeat(3, 1fr)',          // 3 columns on medium screens
                            lg: 'repeat(4, 1fr)'           // 4 columns on large screens
                        },
                        gap: { xs: 2, sm: 3 },
                        width: '100%',
                        boxSizing: 'border-box',
                    }}
                >
                    {myData.map((member) => (
                        <Box key={member.id} sx={{ minWidth: 0 }}>  {/* minWidth: 0 is KEY - fixes grid overflow */}
                            <MemberCard>
                                <MemberCardHeader />

                                {member.needs_profile_completion && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 12,
                                            right: 12,
                                            zIndex: 10,
                                            backgroundColor: 'white',
                                            borderRadius: '50%',
                                            padding: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                                        }}
                                    >
                                        <Tooltip title="Ce profil doit être complété">
                                            <ErrorOutlineIcon
                                                fontSize="small"
                                                sx={{ color: theme.palette.warning.main }}
                                            />
                                        </Tooltip>
                                    </Box>
                                )}

                                <MemberAvatar>
                                    {getInitials(member.name)}
                                </MemberAvatar>

                                <CardContent sx={{ textAlign: 'center', pb: 1, px: { xs: 2, sm: 2 } }}>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontWeight: 'bold',
                                            mb: 0.5,
                                            fontSize: { xs: '1.1rem', sm: '1rem' }
                                        }}
                                    >
                                        {member.name}
                                    </Typography>

                                    <RoleChip
                                        label={member.role || 'Member'}
                                        role={member.role}
                                        size="small"
                                        sx={{ mb: 2 }}
                                    />

                                    {member.needs_profile_completion && (
                                        <Box
                                            sx={{
                                                bgcolor: alpha(theme.palette.warning.main, 0.1),
                                                p: 1,
                                                borderRadius: '6px',
                                                mb: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1
                                            }}
                                        >
                                            <InfoIcon fontSize="small" color="warning" />
                                            <Typography
                                                variant="caption"
                                                color="warning.main"
                                                sx={{ fontSize: { xs: '0.85rem', sm: '0.75rem' } }}
                                            >
                                                Le profil doit être complété
                                            </Typography>
                                        </Box>
                                    )}

                                    <Stack spacing={1} sx={{ mb: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                            <WorkIcon fontSize="small" color="action" />
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ fontSize: { xs: '0.95rem', sm: '0.875rem' } }}
                                            >
                                                {member.job || 'Aucun emploi'}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                            <EmailIcon fontSize="small" color="action" />
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                noWrap
                                                sx={{ fontSize: { xs: '0.95rem', sm: '0.875rem' } }}
                                            >
                                                {member.email}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
                                        <Chip
                                            icon={<PublicIcon fontSize="small" />}
                                            label={member.nationality || 'Inconnu'}
                                            size="small"
                                            sx={{
                                                bgcolor: alpha(theme.palette.background.default, 0.8),
                                                fontSize: { xs: '0.85rem', sm: '0.75rem' }
                                            }}
                                        />
                                        <Chip
                                            icon={<EventIcon fontSize="small" />}
                                            label={member.joining_date ? Dayjs(member.joining_date).format('DD/MM/YYYY') : 'Aucune date'}
                                            size="small"
                                            sx={{
                                                bgcolor: alpha(theme.palette.background.default, 0.8),
                                                fontSize: { xs: '0.85rem', sm: '0.75rem' }
                                            }}
                                        />
                                    </Stack>
                                </CardContent>

                                <Box sx={{ flexGrow: 1 }} />

                                <CardActions sx={{
                                    p: 2,
                                    pt: 0,
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    justifyContent: 'space-between',
                                    borderTop: `1px solid ${theme.palette.divider}`,
                                    gap: { xs: 1, sm: 0 }
                                }}>
                                    <MobileActionButton
                                        variant="outlined"
                                        size="small"
                                        startIcon={<VisibilityIcon />}
                                        onClick={() => handleOpenViewDialog(member)}
                                        fullWidth={isMobile}
                                    >
                                        Voir
                                    </MobileActionButton>

                                    <PermissionRequired
                                        resource={RESOURCES.MEMBERS}
                                        action={ACTIONS.EDIT}
                                    >
                                        <MobileActionButton
                                            variant="outlined"
                                            size="small"
                                            startIcon={<EditIcon />}
                                            component={Link}
                                            to={`/member/editmember/${member.id}`}
                                            fullWidth={isMobile}
                                        >
                                            Modifier
                                        </MobileActionButton>
                                    </PermissionRequired>

                                    <PermissionRequired
                                        resource={RESOURCES.MEMBERS}
                                        action={ACTIONS.DELETE}
                                    >
                                        <MobileActionButton
                                            variant="outlined"
                                            color="error"
                                            size="small"
                                            startIcon={<DeleteIcon />}
                                            onClick={() => handleOpenDeleteDialog(member)}
                                            fullWidth={isMobile}
                                        >
                                            Supprimer
                                        </MobileActionButton>
                                    </PermissionRequired>
                                </CardActions>
                            </MemberCard>
                        </Box>
                    ))}
                </Box>
            )}

            {/* Mobile FAB */}
            {isMobile && (
                <PermissionRequired
                    resource={RESOURCES.MEMBERS}
                    action={ACTIONS.CREATE}
                >
                    <FloatingActionButton
                        color="primary"
                        aria-label="Ajouter un membre"
                        component={Link}
                        to="/CreateMember"
                    >
                        <AddIcon sx={{ fontSize: 28 }} />
                    </FloatingActionButton>
                </PermissionRequired>
            )}

            {/* View Dialog */}
            <Dialog
                open={openViewDialog}
                onClose={handleCloseViewDialog}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : '12px',
                        m: isMobile ? 0 : 2,
                    }
                }}
            >
                {selectedMember && (
                    <>
                        <Box sx={{ position: 'relative' }}>
                            <Box sx={{
                                height: '120px',
                                backgroundImage: theme => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                            }} />

                            <IconButton
                                onClick={handleCloseViewDialog}
                                sx={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    color: 'white',
                                    bgcolor: 'rgba(0,0,0,0.2)',
                                }}
                            >
                                <CloseIcon />
                            </IconButton>

                            <Avatar
                                sx={{
                                    bgcolor: theme.palette.primary.main,
                                    width: { xs: 90, sm: 100 },
                                    height: { xs: 90, sm: 100 },
                                    fontSize: { xs: '2.2rem', sm: '2.5rem' },
                                    fontWeight: 'bold',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                    border: `4px solid ${theme.palette.background.paper}`,
                                    position: 'absolute',
                                    top: 70,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                }}
                            >
                                {getInitials(selectedMember.name)}
                            </Avatar>
                        </Box>

                        <DialogContent sx={{
                            pt: { xs: 6, sm: 7 },
                            pb: 3,
                            px: { xs: 2, sm: 4 }
                        }}>
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <Typography
                                    variant="h5"
                                    component="h2"
                                    fontWeight="bold"
                                    gutterBottom
                                    sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem' } }}
                                >
                                    {selectedMember.name}
                                </Typography>

                                <RoleChip
                                    label={selectedMember.role || 'Member'}
                                    role={selectedMember.role}
                                    sx={{ mt: 1 }}
                                />
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            <Grid container spacing={{ xs: 2, sm: 3 }}>
                                <Grid item xs={12} sm={6}>
                                    <DetailItem>
                                        <DetailIcon>
                                            <WorkIcon color="inherit" />
                                        </DetailIcon>
                                        <Box>
                                            <Typography
                                                variant="subtitle2"
                                                color="text.secondary"
                                                sx={{ fontSize: { xs: '1rem', sm: '0.875rem' } }}
                                            >
                                                Emploi
                                            </Typography>
                                            <Typography
                                                variant="body1"
                                                sx={{ fontSize: { xs: '1.05rem', sm: '1rem' } }}
                                            >
                                                {selectedMember.job || 'Non renseigné'}
                                            </Typography>
                                        </Box>
                                    </DetailItem>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <DetailItem>
                                        <DetailIcon>
                                            <PublicIcon color="inherit" />
                                        </DetailIcon>
                                        <Box>
                                            <Typography
                                                variant="subtitle2"
                                                color="text.secondary"
                                                sx={{ fontSize: { xs: '1rem', sm: '0.875rem' } }}
                                            >
                                                Nationalité
                                            </Typography>
                                            <Typography
                                                variant="body1"
                                                sx={{ fontSize: { xs: '1.05rem', sm: '1rem' } }}
                                            >
                                                {selectedMember.nationality || 'Non renseigné'}
                                            </Typography>
                                        </Box>
                                    </DetailItem>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <DetailItem>
                                        <DetailIcon>
                                            <PermIdentityIcon color="inherit" />
                                        </DetailIcon>
                                        <Box>
                                            <Typography
                                                variant="subtitle2"
                                                color="text.secondary"
                                                sx={{ fontSize: { xs: '1rem', sm: '0.875rem' } }}
                                            >
                                                CIN
                                            </Typography>
                                            <Typography
                                                variant="body1"
                                                sx={{ fontSize: { xs: '1.05rem', sm: '1rem' } }}
                                            >
                                                {selectedMember.cin || 'Non renseigné'}
                                            </Typography>
                                        </Box>
                                    </DetailItem>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <DetailItem>
                                        <DetailIcon>
                                            <CakeIcon color="inherit" />
                                        </DetailIcon>
                                        <Box>
                                            <Typography
                                                variant="subtitle2"
                                                color="text.secondary"
                                                sx={{ fontSize: { xs: '1rem', sm: '0.875rem' } }}
                                            >
                                                Date de Naissance
                                            </Typography>
                                            <Typography
                                                variant="body1"
                                                sx={{ fontSize: { xs: '1.05rem', sm: '1rem' } }}
                                            >
                                                {selectedMember.birth_date ? Dayjs(selectedMember.birth_date).format('DD-MM-YYYY') : 'Non renseigné'}
                                            </Typography>
                                        </Box>
                                    </DetailItem>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <DetailItem>
                                        <DetailIcon>
                                            <EventIcon color="inherit" />
                                        </DetailIcon>
                                        <Box>
                                            <Typography
                                                variant="subtitle2"
                                                color="text.secondary"
                                                sx={{ fontSize: { xs: '1rem', sm: '0.875rem' } }}
                                            >
                                                Date d'Adhésion
                                            </Typography>
                                            <Typography
                                                variant="body1"
                                                sx={{ fontSize: { xs: '1.05rem', sm: '1rem' } }}
                                            >
                                                {selectedMember.joining_date ? Dayjs(selectedMember.joining_date).format('DD-MM-YYYY') : 'Non renseigné'}
                                            </Typography>
                                        </Box>
                                    </DetailItem>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <DetailItem>
                                        <DetailIcon>
                                            <HomeIcon color="inherit" />
                                        </DetailIcon>
                                        <Box>
                                            <Typography
                                                variant="subtitle2"
                                                color="text.secondary"
                                                sx={{ fontSize: { xs: '1rem', sm: '0.875rem' } }}
                                            >
                                                Adresse
                                            </Typography>
                                            <Typography
                                                variant="body1"
                                                sx={{ fontSize: { xs: '1.05rem', sm: '1rem' } }}
                                            >
                                                {selectedMember.address || 'Non renseigné'}
                                            </Typography>
                                        </Box>
                                    </DetailItem>
                                </Grid>
                            </Grid>
                        </DialogContent>

                        <DialogActions sx={{
                            px: { xs: 2, sm: 4 },
                            pb: { xs: 2, sm: 3 },
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 1
                        }}>
                            <MobileActionButton
                                onClick={handleCloseViewDialog}
                                variant="outlined"
                                fullWidth={isMobile}
                            >
                                Fermer
                            </MobileActionButton>

                            <PermissionRequired
                                resource={RESOURCES.MEMBERS}
                                action={ACTIONS.EDIT}
                            >
                                <MobileActionButton
                                    component={Link}
                                    to={`/member/editmember/${selectedMember.id}`}
                                    variant="contained"
                                    color="primary"
                                    startIcon={<EditIcon />}
                                    fullWidth={isMobile}
                                >
                                    Modifier
                                </MobileActionButton>
                            </PermissionRequired>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Delete Dialog */}
            <Dialog
                open={openDeleteDialog}
                onClose={handleCloseDeleteDialog}
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : '12px',
                    }
                }}
            >
                <DialogTitle sx={{
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontSize: { xs: '1.15rem', sm: '1.25rem' }
                }}>
                    <WarningAmberIcon color="error" />
                    <Typography variant="h6" component="span" color="error.main">
                        Supprimer le Membre
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <DialogContentText sx={{ fontSize: { xs: '1.05rem', sm: '1rem' } }}>
                        Êtes-vous sûr de vouloir supprimer "{memberToDelete?.name}"? Cette action ne peut pas être annulée.
                    </DialogContentText>
                    <DialogContentText sx={{ mt: 2, mb: 1, fontSize: { xs: '1rem', sm: '0.95rem' } }}>
                        Taper <strong>delete</strong> pour confirmer:
                    </DialogContentText>
                    <TextField
                        fullWidth
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Tapez 'delete' ici"
                        variant="outlined"
                        error={deleteConfirmText.length > 0 && deleteConfirmText !== 'delete'}
                        sx={{
                            mt: 1,
                            '& .MuiInputBase-input': {
                                fontSize: { xs: '1.1rem', sm: '1rem' },
                                padding: { xs: '14px', sm: '12px' }
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{
                    px: { xs: 2, sm: 3 },
                    pb: { xs: 2, sm: 3 },
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 1
                }}>
                    <MobileActionButton
                        onClick={handleCloseDeleteDialog}
                        variant="outlined"
                        fullWidth={isMobile}
                    >
                        Annuler
                    </MobileActionButton>
                    <MobileActionButton
                        onClick={handleDeleteMember}
                        color="error"
                        variant="contained"
                        disabled={deleteConfirmText !== 'delete'}
                        fullWidth={isMobile}
                    >
                        Supprimer
                    </MobileActionButton>
                </DialogActions>
            </Dialog>

            {/* Notifications */}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                sx={{ mb: { xs: 10, sm: 0 } }}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.severity}
                    variant="filled"
                    sx={{
                        borderRadius: '8px',
                        fontSize: { xs: '1rem', sm: '0.875rem' }
                    }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Members;
