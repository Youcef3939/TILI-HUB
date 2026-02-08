import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    CircularProgress,
    Snackbar,
    Alert,
    Paper,
    IconButton,
    Chip,
    Tooltip,
    Divider,
    Avatar,
    Card,
    CardContent,
    CardActions,
    Badge,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    useTheme,
    alpha
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Dayjs from 'dayjs';
import AxiosInstance from './Axios.jsx';

// Icons
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EmailIcon from '@mui/icons-material/Email';
import WarningIcon from '@mui/icons-material/Warning';
import CloseIcon from '@mui/icons-material/Close';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BadgeIcon from '@mui/icons-material/Badge';
import CakeIcon from '@mui/icons-material/Cake';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const HeaderContainer = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    padding: theme.spacing(1.5, 2.5),  // ✅ Reduced padding
    borderRadius: theme.shape.borderRadius * 2,
    marginBottom: theme.spacing(2),  // ✅ Less margin
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: theme.shadows[3],
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(1.5, 2),
    },
    '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)',
        zIndex: 0,
    }
}));

const MemberCard = styled(Card)(({ theme }) => ({
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.3s ease',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 20px rgba(0, 0, 0, 0.12)',
    }
}));

const MemberAvatar = styled(Avatar)(({ theme }) => ({
    width: 70,
    height: 70,
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.common.white,
    fontSize: '1.8rem',
    fontWeight: 'bold',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    border: `3px solid ${theme.palette.background.paper}`,
    margin: '-50px auto 10px auto',
    position: 'relative',
    zIndex: 1
}));

const MemberCardHeader = styled(Box)(({ theme }) => ({
    backgroundImage: 'linear-gradient(135deg, #FFA726, #FB8C00)',
    height: 80,
    width: '100%',
    position: 'relative',
    '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 80%)',
        zIndex: 0,
    }
}));

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const PendingUsers = () => {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
    const [confirmDialog, setConfirmDialog] = useState({ open: false, type: '', user: null });
    const [debugMode, setDebugMode] = useState(false); // For debugging purposes

    const theme = useTheme();
    const navigate = useNavigate();

    // Function to fetch pending users
    const fetchPendingUsers = async () => {
        setRefreshing(true);
        try {
            // Get pending users from the API
            const response = await AxiosInstance.get('/users/users/?validation_status=pending');
            console.log('Pending users API response:', response.data);

            // Process the users to ensure we have consistent data
            const processedUsers = response.data.map(user => {
                // Log each user data for debugging
                if (debugMode) {
                    console.log(`User ${user.id} (${user.email}) data:`, {
                        cin: user.cin,
                        birth_date: user.birth_date,
                        full_data: user
                    });
                }

                return {
                    ...user,
                    // Ensure CIN has a default value if missing
                    cin: user.cin || 'Non fourni',
                    // Ensure birth_date has a default value if missing
                    birth_date: user.birth_date || null
                };
            });

            setPendingUsers(processedUsers);
        } catch (error) {
            console.error('Error fetching pending users:', error);
            setNotification({
                open: true,
                message: 'Échec du chargement des utilisateurs en attente. Veuillez réessayer.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Fetch data on component mount
    useEffect(() => {
        fetchPendingUsers();
    }, []);

    // Helper function to get initials from name
    const getInitials = (name) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    // Handle validation or rejection
    const handleAction = async (userId, action) => {
        try {
            // Simple action request
            const requestData = { action };

            console.log(`Sending ${action} request for user ${userId}:`, requestData);
            const response = await AxiosInstance.post(`/users/users/${userId}/validate_user/`, requestData);
            console.log(`${action} response:`, response.data);

            setNotification({
                open: true,
                message: response.data.message || `L'utilisateur a été ${action === 'validate' ? 'approuvé' : 'rejeté'} avec succès`,
                severity: 'success'
            });

            // Remove the processed user from the list
            setPendingUsers(pendingUsers.filter(user => user.id !== userId));

        } catch (error) {
            console.error(`Error ${action === 'validate' ? 'validating' : 'rejecting'} user:`, error);
            setNotification({
                open: true,
                message: `Échec de ${action === 'validate' ? 'validation' : 'rejet'} de l'utilisateur. ${error.response?.data?.error || 'Veuillez réessayer.'}`,
                severity: 'error'
            });
        }

        setConfirmDialog({ open: false, type: '', user: null });
    };

    // Open confirmation dialog
    const openConfirmDialog = (user, actionType) => {
        console.log(`Opening ${actionType} dialog for user:`, user);
        setConfirmDialog({
            open: true,
            type: actionType,
            user: user
        });
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'Non fournie';
        try {
            return new Date(dateString).toLocaleDateString('fr-FR');
        } catch (e) {
            console.error('Error formatting date:', e);
            return dateString;
        }
    };

    // Handle notification close
    const handleCloseNotification = () => {
        setNotification({ ...notification, open: false });
    };

    // Toggle debug mode (hidden feature)
    const toggleDebugMode = () => {
        setDebugMode(!debugMode);
        console.log('Debug mode:', !debugMode);
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                when: "beforeChildren",
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration:.3 }
        }
    };

    return (
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <HeaderContainer>
                    <HourglassEmptyIcon sx={{ mr: 2, fontSize: { xs: 24, sm: 28 } }} />
                    <Box sx={{ zIndex: 1, flex: 1 }}>
                        <Typography
                            variant="h6"
                            component="h1"
                            fontWeight="700"
                            onDoubleClick={toggleDebugMode}
                            sx={{
                                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                                mb: 0.5,
                                lineHeight: 1.3
                            }}
                        >
                            Validation des Utilisateurs en Attente
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                opacity: 0.9
                            }}
                        >
                            Approuver ou rejeter les nouvelles inscriptions d'utilisateurs
                        </Typography>
                    </Box>
                    {/* Decorative circles */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: -20,
                            right: -20,
                            width: 100,
                            height: 100,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)',
                            zIndex: 0
                        }}
                    />
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: -30,
                            right: 100,
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)',
                            zIndex: 0
                        }}
                    />
                </HeaderContainer>
            </motion.div>

            {/* Debug Panel - only shown when debug mode is active */}
            {debugMode && (
                <Paper sx={{ p: 2, mb: 2, bgcolor: '#FFFBE6', border: '1px dashed #FFB74D' }}>
                    <Typography variant="subtitle2" gutterBottom>Debug Mode</Typography>
                    <Typography variant="body2">
                        API Response: {pendingUsers.length} users loaded
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => console.log('Current users:', pendingUsers)}
                            sx={{ mr: 1 }}
                        >
                            Log Users
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={fetchPendingUsers}
                        >
                            Reload Data
                        </Button>
                    </Box>
                </Paper>
            )}

            {/* Refresh Button - ✅ FIXED: Now on the left */}
            <Box sx={{
                display: 'flex',
                justifyContent: { xs: 'center', sm: 'flex-start' },
                mb: 3,
                px: { xs: 0, sm: 1 }
            }}>
                <Button
                    onClick={fetchPendingUsers}
                    startIcon={<RefreshIcon />}
                    disabled={refreshing}
                    variant="outlined"
                    size="medium"
                    sx={{
                        borderRadius: 2,
                        fontWeight: 600,
                        minWidth: { xs: '100%', sm: 140 },
                        animation: refreshing ? 'spin 1s linear infinite' : 'none',
                        '@keyframes spin': {
                            '0%': { transform: 'rotate(0deg)' },
                            '100%': { transform: 'rotate(360deg)' }
                        }
                    }}
                >
                    {refreshing ? 'Actualisation...' : 'Actualiser'}
                </Button>
            </Box>

            {/* Main Content */}
            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh" flexDirection="column" gap={2}>
                    <CircularProgress size={50} color="primary" />
                    <Typography variant="body1" color="text.secondary">
                        Chargement des utilisateurs en attente...
                    </Typography>
                </Box>
            ) : pendingUsers.length === 0 ? (
                <Paper
                    sx={{
                        p: 4,
                        textAlign: 'center',
                        borderRadius: '12px',
                        bgcolor: alpha(theme.palette.background.paper, 0.6),
                        border: `1px dashed ${theme.palette.divider}`
                    }}
                >
                    <Typography variant="h6" gutterBottom>Aucun utilisateur en attente trouvé</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Toutes les inscriptions d'utilisateurs ont été traitées
                    </Typography>
                </Paper>
            ) : (
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                sm: 'repeat(2, 1fr)',
                                md: 'repeat(3, 1fr)',
                                lg: 'repeat(4, 1fr)'
                            },
                            gap: 3
                        }}
                    >
                        {pendingUsers.map((user) => (
                            <motion.div key={user.id} variants={itemVariants}>
                                <MemberCard>
                                    <MemberCardHeader />

                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 10,
                                            right: 10,
                                            zIndex: 2
                                        }}
                                    >
                                        <Tooltip title="En attente de validation">
                                            <Badge
                                                badgeContent={
                                                    <HourglassEmptyIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />
                                                }
                                                overlap="circular"
                                                color="warning"
                                            >
                                                <Box width={24} height={24} />
                                            </Badge>
                                        </Tooltip>
                                    </Box>

                                    <MemberAvatar>
                                        {getInitials(user.full_name || user.email)}
                                    </MemberAvatar>

                                    <CardContent sx={{ textAlign: 'center', pb: 1 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                            {user.full_name || 'Aucun nom fourni'}
                                        </Typography>

                                        <Chip
                                            label="En Attente d'Approbation"
                                            size="small"
                                            sx={{
                                                mb: 2,
                                                bgcolor: alpha(theme.palette.warning.main, 0.1),
                                                color: theme.palette.warning.main,
                                                fontWeight: 500
                                            }}
                                            icon={<HourglassEmptyIcon style={{ color: theme.palette.warning.main }} />}
                                        />

                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'center' }}>
                                            <EmailIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                {user.email}
                                            </Typography>
                                        </Box>

                                        {/* CIN display */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'center' }}>
                                            <BadgeIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                                            <Typography variant="body2" color={user.cin === 'Non fourni' ? 'text.disabled' : 'text.secondary'}>
                                                CIN: {user.cin}
                                            </Typography>
                                        </Box>

                                        {/* Birth date display */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'center' }}>
                                            <CakeIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                                            <Typography variant="body2" color={!user.birth_date ? 'text.disabled' : 'text.secondary'}>
                                                Naissance: {formatDate(user.birth_date)}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.warning.light, 0.1), borderRadius: '8px' }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Cet utilisateur attend l'approbation pour accéder au système.
                                            </Typography>
                                        </Box>
                                    </CardContent>

                                    <Box sx={{ flexGrow: 1 }} />

                                    <CardActions sx={{
                                        p: 2,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        borderTop: `1px solid ${theme.palette.divider}`
                                    }}>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            color="success"
                                            startIcon={<CheckCircleIcon />}
                                            onClick={() => openConfirmDialog(user, 'validate')}
                                            sx={{ borderRadius: '8px' }}
                                        >
                                            Approuver
                                        </Button>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            color="error"
                                            startIcon={<CancelIcon />}
                                            onClick={() => openConfirmDialog(user, 'reject')}
                                            sx={{ borderRadius: '8px' }}
                                        >
                                            Rejeter
                                        </Button>
                                    </CardActions>
                                </MemberCard>
                            </motion.div>
                        ))}
                    </Box>
                </motion.div>
            )}

            {/* Confirmation Dialog */}
            <Dialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
                PaperProps={{
                    sx: {
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    }
                }}
            >
                <DialogTitle sx={{
                    bgcolor: confirmDialog.type === 'validate'
                        ? alpha(theme.palette.success.main, 0.1)
                        : alpha(theme.palette.error.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}>
                    {confirmDialog.type === 'validate'
                        ? <CheckCircleIcon color="success" />
                        : <WarningIcon color="error" />
                    }
                    <Typography variant="h6" component="span" color={confirmDialog.type === 'validate' ? "success.main" : "error.main"}>
                        {confirmDialog.type === 'validate' ? 'Approuver l\'Utilisateur' : 'Rejeter l\'Utilisateur'}
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <DialogContentText>
                        {confirmDialog.type === 'validate'
                            ? `Êtes-vous sûr de vouloir approuver ${confirmDialog.user?.full_name || confirmDialog.user?.email}? Ils auront accès au système.`
                            : `Êtes-vous sûr de vouloir rejeter ${confirmDialog.user?.full_name || confirmDialog.user?.email}? Ils ne pourront pas accéder au système jusqu'à leur approbation.`
                        }
                    </DialogContentText>

                    {/* Display user information summary if we're validating */}
                    {confirmDialog.type === 'validate' && (
                        <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.background.default, 0.6), borderRadius: '8px' }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Informations de l'utilisateur:
                            </Typography>

                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        Nom complet
                                    </Typography>
                                    <Typography variant="body2">
                                        {confirmDialog.user?.full_name || 'Non fourni'}
                                    </Typography>
                                </Grid>

                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        Email
                                    </Typography>
                                    <Typography variant="body2">
                                        {confirmDialog.user?.email}
                                    </Typography>
                                </Grid>

                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        CIN
                                    </Typography>
                                    <Typography variant="body2">
                                        {confirmDialog.user?.cin}
                                    </Typography>
                                </Grid>

                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        Date de naissance
                                    </Typography>
                                    <Typography variant="body2">
                                        {formatDate(confirmDialog.user?.birth_date)}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button
                        onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
                        variant="outlined"
                        sx={{ borderRadius: '8px' }}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={() => handleAction(confirmDialog.user?.id, confirmDialog.type)}
                        color={confirmDialog.type === 'validate' ? "success" : "error"}
                        variant="contained"
                        sx={{
                            borderRadius: '8px',
                            px: 3
                        }}
                    >
                        {confirmDialog.type === 'validate' ? 'Approuver' : 'Rejeter'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notifications */}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.severity}
                    variant="filled"
                    sx={{ borderRadius: '8px' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default PendingUsers;