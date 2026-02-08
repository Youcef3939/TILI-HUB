import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tab,
    Tabs,
    CircularProgress,
    Alert,
    Snackbar,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Divider,
    Chip,
    Card,
    CardContent,
    Avatar,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Tooltip,
    Badge,
    LinearProgress
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    Person as PersonIcon,
    Business as BusinessIcon,
    Refresh as RefreshIcon,
    Key as KeyIcon,
    Email as EmailIcon,
    CheckCircle as CheckCircleIcon,
    ErrorOutline as ErrorOutlineIcon,
    Info as InfoIcon,
    Save as SaveIcon,
    Assignment as AssignmentIcon,
    ManageAccounts as ManageAccountsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { usePermissions } from '../contexts/PermissionsContext.jsx';
import { PermissionRequired } from '../contexts/ConditionalUI';
import Axios from '../components/Axios';
import { styled } from '@mui/material/styles';

// Styled components
const TabPanel = ({ children, value, index, ...props }) => (
    <div role="tabpanel" hidden={value !== index} id={`admin-tabpanel-${index}`} {...props}>
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
);

const SectionTitle = styled(Typography)(({ theme }) => ({
    fontWeight: 600,
    marginBottom: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    '& svg': {
        marginRight: theme.spacing(1),
    },
}));

const StatsCard = styled(Card)(({ theme }) => ({
    height: '100%',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
    borderRadius: 12,
    transition: 'transform 0.3s, box-shadow 0.3s',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
    }
}));

// Status chip based on verification status
const StatusChip = ({ status }) => {
    if (status === 'verified') {
        return (
            <Chip
                size="small"
                color="success"
                icon={<CheckCircleIcon fontSize="small" />}
                label="Vérifié"
                sx={{ fontWeight: 500 }}
            />
        );
    } else if (status === 'failed') {
        return (
            <Chip
                size="small"
                color="error"
                icon={<ErrorOutlineIcon fontSize="small" />}
                label="Échec"
                sx={{ fontWeight: 500 }}
            />
        );
    } else {
        return (
            <Chip
                size="small"
                color="warning"
                icon={<InfoIcon fontSize="small" />}
                label="En attente"
                sx={{ fontWeight: 500 }}
            />
        );
    }
};

const AdminDashboard = () => {
    const { userRole, isSuperuser, can } = usePermissions();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    // Tabs state
    const [tabValue, setTabValue] = useState(0);

    // General state
    const [loading, setLoading] = useState(false);
    const [refreshingData, setRefreshingData] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Association state
    const [association, setAssociation] = useState(null);

    // Users state
    const [users, setUsers] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userDialogOpen, setUserDialogOpen] = useState(false);
    const [roles, setRoles] = useState([]);

    // Members state
    const [members, setMembers] = useState([]);
    const [membersWithIncompleteProfiles, setMembersWithIncompleteProfiles] = useState([]);

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Permission check
    useEffect(() => {
        // Check if user has the right permissions
        if (!loading && !isSuperuser && userRole !== 'president') {
            navigate('/home');
        }
    }, [userRole, isSuperuser, loading, navigate]);

    // Initial data loading
    useEffect(() => {
        fetchData();
    }, []);

    // Fetch all necessary data
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch association details
            const associationRes = await Axios.get('/users/association-management/association/');
            setAssociation(associationRes.data);

            // Fetch roles
            const rolesRes = await Axios.get('/users/association-management/roles/');
            setRoles(rolesRes.data);

            // Fetch users
            const usersRes = await Axios.get('/users/association-management/');
            setUsers(usersRes.data);

            // Fetch pending users
            const pendingUsersRes = await Axios.get('/users/association-management/?validated=false');
            setPendingUsers(pendingUsersRes.data);

            // Fetch members
            const membersRes = await Axios.get('/users/association-management/members/');
            setMembers(membersRes.data);

            // Fetch members with incomplete profiles
            const incompleteProfilesRes = await Axios.get('/users/association-management/members/?needs_profile_completion=true');
            setMembersWithIncompleteProfiles(incompleteProfilesRes.data);

        } catch (err) {
            console.error('Error fetching admin data:', err);
            setError('Une erreur est survenue lors du chargement des données.');
        } finally {
            setLoading(false);
        }
    };

    // Refresh data
    const refreshData = async () => {
        setRefreshingData(true);
        try {
            await fetchData();
            enqueueSnackbar('Données actualisées avec succès', { variant: 'success' });
        } catch (err) {
            enqueueSnackbar('Erreur lors de l\'actualisation des données', { variant: 'error' });
        } finally {
            setRefreshingData(false);
        }
    };

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Association data handlers
    const [editingAssociation, setEditingAssociation] = useState(false);
    const [associationData, setAssociationData] = useState({});

    const handleEditAssociation = () => {
        setAssociationData(association);
        setEditingAssociation(true);
    };

    const handleCancelEditAssociation = () => {
        setEditingAssociation(false);
        setAssociationData({});
    };

    const handleAssociationChange = (e) => {
        const { name, value } = e.target;
        setAssociationData({
            ...associationData,
            [name]: value
        });
    };

    const handleSaveAssociation = async () => {
        setLoading(true);
        try {
            const res = await Axios.put('/users/association-management/update_association/', associationData);
            setAssociation(res.data);
            setEditingAssociation(false);
            enqueueSnackbar('Association mise à jour avec succès', { variant: 'success' });
        } catch (err) {
            console.error('Error updating association:', err);
            enqueueSnackbar('Erreur lors de la mise à jour de l\'association', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // User management handlers
    const [userFormData, setUserFormData] = useState({
        email: '',
        full_name: '',
        role_id: '',
        password: '',
        is_validated: true
    });

    const resetUserForm = () => {
        setUserFormData({
            email: '',
            full_name: '',
            role_id: '',
            password: '',
            is_validated: true
        });
        setSelectedUser(null);
    };

    const handleAddUserClick = () => {
        resetUserForm();
        setUserDialogOpen(true);
    };

    const handleEditUserClick = (user) => {
        setSelectedUser(user);
        setUserFormData({
            email: user.email,
            full_name: user.full_name || '',
            role_id: user.role?.id || '',
            is_validated: user.is_validated || false
        });
        setUserDialogOpen(true);
    };

    const handleUserFormChange = (e) => {
        const { name, value, checked, type } = e.target;
        setUserFormData({
            ...userFormData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleUserDialogClose = () => {
        setUserDialogOpen(false);
        resetUserForm();
    };

    const handleSaveUser = async () => {
        setLoading(true);
        try {
            if (selectedUser) {
                // Update existing user
                const res = await Axios.put(`/users/association-management/${selectedUser.id}/update_user/`, userFormData);

                // Update users list
                setUsers(users.map(user =>
                    user.id === selectedUser.id ? res.data : user
                ));

                enqueueSnackbar('Utilisateur mis à jour avec succès', { variant: 'success' });
            } else {
                // Create new user
                const res = await Axios.post('/users/association-management/create_user/', userFormData);

                // Add to users list
                setUsers([...users, res.data]);

                enqueueSnackbar('Utilisateur créé avec succès', { variant: 'success' });

                // Show password if one was generated
                if (res.data.temporary_password) {
                    enqueueSnackbar(`Mot de passe temporaire: ${res.data.temporary_password}`, {
                        variant: 'info',
                        autoHideDuration: 10000 // Show for 10 seconds
                    });
                }
            }

            handleUserDialogClose();

        } catch (err) {
            console.error('Error saving user:', err);
            enqueueSnackbar(
                err.response?.data?.error || 'Erreur lors de l\'enregistrement de l\'utilisateur',
                { variant: 'error' }
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            return;
        }

        setLoading(true);
        try {
            await Axios.delete(`/users/association-management/${userId}/delete_user/`);

            // Update users list
            setUsers(users.filter(user => user.id !== userId));

            enqueueSnackbar('Utilisateur supprimé avec succès', { variant: 'success' });
        } catch (err) {
            console.error('Error deleting user:', err);
            enqueueSnackbar(
                err.response?.data?.error || 'Erreur lors de la suppression de l\'utilisateur',
                { variant: 'error' }
            );
        } finally {
            setLoading(false);
        }
    };

    const handleValidateUser = async (userId, validate = true) => {
        setLoading(true);
        try {
            const res = await Axios.post(`/users/association-management/${userId}/validate_user/`, {
                action: validate ? 'validate' : 'reject'
            });

            // Update both user lists
            if (validate) {
                setPendingUsers(pendingUsers.filter(user => user.id !== userId));

                // If the user wasn't deleted (rejected users might be deleted)
                if (res.data && res.data.id) {
                    setUsers([...users, res.data]);
                }

                enqueueSnackbar('Utilisateur validé avec succès', { variant: 'success' });
            } else {
                setPendingUsers(pendingUsers.filter(user => user.id !== userId));
                setUsers(users.filter(user => user.id !== userId));
                enqueueSnackbar('Utilisateur rejeté', { variant: 'info' });
            }
        } catch (err) {
            console.error('Error validating user:', err);
            enqueueSnackbar(
                err.response?.data?.error || 'Erreur lors de la validation de l\'utilisateur',
                { variant: 'error' }
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (userId) => {
        setLoading(true);
        try {
            await Axios.post(`/users/association-management/${userId}/reset_password/`);
            enqueueSnackbar('Email de réinitialisation du mot de passe envoyé', { variant: 'success' });
        } catch (err) {
            console.error('Error resetting password:', err);
            enqueueSnackbar('Erreur lors de l\'envoi de l\'email de réinitialisation', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleChangeRole = async (userId, roleId) => {
        setLoading(true);
        try {
            const res = await Axios.post(`/users/association-management/${userId}/set_role/`, {
                role_id: roleId
            });

            // Update users list
            setUsers(users.map(user =>
                user.id === userId ? res.data : user
            ));

            enqueueSnackbar('Rôle mis à jour avec succès', { variant: 'success' });
        } catch (err) {
            console.error('Error changing role:', err);
            enqueueSnackbar(
                err.response?.data?.error || 'Erreur lors du changement de rôle',
                { variant: 'error' }
            );
        } finally {
            setLoading(false);
        }
    };

    // Render association section
    const renderAssociationSection = () => {
        if (!association) {
            return (
                <Alert severity="warning">
                    Informations de l'association non disponibles
                </Alert>
            );
        }

        return (
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <SectionTitle variant="h5">
                        <BusinessIcon /> {association.name}
                    </SectionTitle>

                    <Box>
                        {editingAssociation ? (
                            <>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSaveAssociation}
                                    startIcon={<SaveIcon />}
                                    sx={{ mr: 1 }}
                                    disabled={loading}
                                >
                                    Enregistrer
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleCancelEditAssociation}
                                    disabled={loading}
                                >
                                    Annuler
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleEditAssociation}
                                startIcon={<EditIcon />}
                            >
                                Modifier
                            </Button>
                        )}
                    </Box>
                </Box>

                {editingAssociation ? (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Nom de l'association"
                                name="name"
                                value={associationData.name || ''}
                                onChange={handleAssociationChange}
                                margin="normal"
                            />
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                value={associationData.email || ''}
                                onChange={handleAssociationChange}
                                margin="normal"
                            />
                            <TextField
                                fullWidth
                                label="Matricule fiscal"
                                name="matricule_fiscal"
                                value={associationData.matricule_fiscal || ''}
                                onChange={handleAssociationChange}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Nom du président"
                                name="president_name"
                                value={associationData.president_name || ''}
                                onChange={handleAssociationChange}
                                margin="normal"
                            />
                            <TextField
                                fullWidth
                                label="Email du président"
                                name="president_email"
                                value={associationData.president_email || ''}
                                onChange={handleAssociationChange}
                                margin="normal"
                            />
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Statut de vérification
                                </Typography>
                                <StatusChip status={associationData.verification_status || 'pending'} />
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                Autres responsables
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Nom du trésorier"
                                name="treasurer_name"
                                value={associationData.treasurer_name || ''}
                                onChange={handleAssociationChange}
                                margin="normal"
                            />
                            <TextField
                                fullWidth
                                label="Email du trésorier"
                                name="treasurer_email"
                                value={associationData.treasurer_email || ''}
                                onChange={handleAssociationChange}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Nom du secrétaire"
                                name="secretary_name"
                                value={associationData.secretary_name || ''}
                                onChange={handleAssociationChange}
                                margin="normal"
                            />
                            <TextField
                                fullWidth
                                label="Email du secrétaire"
                                name="secretary_email"
                                value={associationData.secretary_email || ''}
                                onChange={handleAssociationChange}
                                margin="normal"
                            />
                        </Grid>
                    </Grid>
                ) : (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 3, height: '100%' }}>
                                <Typography variant="h6" gutterBottom>
                                    Informations générales
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                    <BusinessIcon sx={{ mr: 2, color: 'primary.main' }} />
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Nom
                                        </Typography>
                                        <Typography variant="body1">
                                            {association.name}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                    <EmailIcon sx={{ mr: 2, color: 'primary.main' }} />
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Email
                                        </Typography>
                                        <Typography variant="body1">
                                            {association.email}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                    <AssignmentIcon sx={{ mr: 2, color: 'primary.main' }} />
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Matricule fiscal
                                        </Typography>
                                        <Typography variant="body1">
                                            {association.matricule_fiscal}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                    <InfoIcon sx={{ mr: 2, color: 'primary.main' }} />
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Statut de vérification
                                        </Typography>
                                        <StatusChip status={association.verification_status || 'pending'} />
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 3, height: '100%' }}>
                                <Typography variant="h6" gutterBottom>
                                    Responsables
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                    <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Président
                                        </Typography>
                                        <Typography variant="body1">
                                            {association.president_name || 'Non spécifié'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {association.president_email || ''}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                    <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Trésorier
                                        </Typography>
                                        <Typography variant="body1">
                                            {association.treasurer_name || 'Non spécifié'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {association.treasurer_email || ''}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                    <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Secrétaire
                                        </Typography>
                                        <Typography variant="body1">
                                            {association.secretary_name || 'Non spécifié'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {association.secretary_email || ''}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                )}
            </Box>
        );
    };

    // Render users section
    const renderUsersSection = () => {
        return (
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <SectionTitle variant="h5">
                        <PersonIcon /> Gestion des Utilisateurs
                    </SectionTitle>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleAddUserClick}
                    >
                        Ajouter un utilisateur
                    </Button>
                </Box>

                {/* Stats cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatsCard>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Total des utilisateurs
                                </Typography>
                                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', my: 1 }}>
                                    {users.length}
                                </Typography>
                            </CardContent>
                        </StatsCard>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <StatsCard>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Utilisateurs en attente
                                </Typography>
                                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', my: 1 }}>
                                    {pendingUsers.length}
                                </Typography>
                            </CardContent>
                        </StatsCard>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <StatsCard>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Administrateurs
                                </Typography>
                                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', my: 1 }}>
                                    {users.filter(u => u.role?.name === 'president').length}
                                </Typography>
                            </CardContent>
                        </StatsCard>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <StatsCard>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Membres avec profil incomplet
                                </Typography>
                                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', my: 1 }}>
                                    {membersWithIncompleteProfiles.length}
                                </Typography>
                            </CardContent>
                        </StatsCard>
                    </Grid>
                </Grid>

                {/* Pending users section */}
                {pendingUsers.length > 0 && (
                    <Paper sx={{ p: 3, mb: 4 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: 'warning.main', display: 'flex', alignItems: 'center' }}>
                            <InfoIcon sx={{ mr: 1 }} /> Utilisateurs en attente de validation
                        </Typography>

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Nom</TableCell>
                                        <TableCell>Email</TableCell>
                                        <TableCell>CIN</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {pendingUsers.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell>{user.full_name || 'Non spécifié'}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{user.cin || 'Non spécifié'}</TableCell>
                                            <TableCell>
                                                <Tooltip title="Valider">
                                                    <IconButton
                                                        color="success"
                                                        onClick={() => handleValidateUser(user.id, true)}
                                                        disabled={loading}
                                                    >
                                                        <CheckIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Rejeter">
                                                    <IconButton
                                                        color="error"
                                                        onClick={() => handleValidateUser(user.id, false)}
                                                        disabled={loading}
                                                    >
                                                        <CloseIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}

                {/* All users table */}
                <Paper sx={{ width: '100%' }}>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Tous les utilisateurs</Typography>
                        <IconButton onClick={refreshData} disabled={refreshingData}>
                            <RefreshIcon />
                        </IconButton>
                    </Box>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Nom</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Rôle</TableCell>
                                    <TableCell>Statut</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell>{user.full_name || 'Non spécifié'}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                                    <Select
                                                        value={user.role?.id || ''}
                                                        onChange={(e) => handleChangeRole(user.id, e.target.value)}
                                                        disabled={loading}
                                                    >
                                                        {roles.map(role => (
                                                            <MenuItem key={role.id} value={role.id}>
                                                                {role.name}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={user.is_validated ? 'Validé' : 'En attente'}
                                                    color={user.is_validated ? 'success' : 'warning'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title="Modifier">
                                                    <IconButton
                                                        color="primary"
                                                        onClick={() => handleEditUserClick(user)}
                                                        disabled={loading}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Réinitialiser mot de passe">
                                                    <IconButton
                                                        color="secondary"
                                                        onClick={() => handleResetPassword(user.id)}
                                                        disabled={loading}
                                                    >
                                                        <KeyIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Supprimer">
                                                    <IconButton
                                                        color="error"
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        disabled={loading}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={users.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                    />
                </Paper>

                {/* Add/Edit User Dialog */}
                <Dialog open={userDialogOpen} onClose={handleUserDialogClose} maxWidth="sm" fullWidth>
                    <DialogTitle>{selectedUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}</DialogTitle>
                    <DialogContent>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Email"
                            name="email"
                            value={userFormData.email}
                            onChange={handleUserFormChange}
                            disabled={!!selectedUser} // Can't change email for existing users
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Nom complet"
                            name="full_name"
                            value={userFormData.full_name}
                            onChange={handleUserFormChange}
                        />
                        {!selectedUser && (
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Mot de passe (laissez vide pour générer automatiquement)"
                                name="password"
                                type="password"
                                value={userFormData.password}
                                onChange={handleUserFormChange}
                            />
                        )}
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Rôle</InputLabel>
                            <Select
                                name="role_id"
                                value={userFormData.role_id}
                                onChange={handleUserFormChange}
                                label="Rôle"
                            >
                                {roles.map(role => (
                                    <MenuItem key={role.id} value={role.id}>
                                        {role.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleUserDialogClose} disabled={loading}>
                            Annuler
                        </Button>
                        <Button
                            onClick={handleSaveUser}
                            variant="contained"
                            color="primary"
                            disabled={loading || !userFormData.email}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Enregistrer'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        );
    };

    // Render members section
    const renderMembersSection = () => {
        return (
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <SectionTitle variant="h5">
                        <PersonIcon /> Gestion des Membres
                    </SectionTitle>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/CreateMember')}
                    >
                        Ajouter un membre
                    </Button>
                </Box>

                {/* Members stats */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatsCard>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Total des membres
                                </Typography>
                                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', my: 1 }}>
                                    {members.length}
                                </Typography>
                            </CardContent>
                        </StatsCard>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <StatsCard>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Profils incomplets
                                </Typography>
                                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', my: 1 }}>
                                    {membersWithIncompleteProfiles.length}
                                </Typography>
                            </CardContent>
                        </StatsCard>
                    </Grid>
                </Grid>

                {/* Members with incomplete profiles */}
                {membersWithIncompleteProfiles.length > 0 && (
                    <Paper sx={{ p: 3, mb: 4 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: 'warning.main', display: 'flex', alignItems: 'center' }}>
                            <InfoIcon sx={{ mr: 1 }} /> Membres avec profil incomplet
                        </Typography>

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Nom</TableCell>
                                        <TableCell>Email</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {membersWithIncompleteProfiles.map(member => (
                                        <TableRow key={member.id}>
                                            <TableCell>{member.name || 'Non spécifié'}</TableCell>
                                            <TableCell>{member.email}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => navigate(`/member/editmember/${member.id}`)}
                                                >
                                                    Compléter profil
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}

                {/* All members table */}
                <Paper sx={{ width: '100%' }}>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Tous les membres</Typography>
                        <Button variant="contained" color="primary" onClick={() => navigate('/members')}>
                            Voir la liste complète
                        </Button>
                    </Box>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Nom</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Rôle</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {members
                                    .slice(0, 5) // Show only first 5 members for preview
                                    .map(member => (
                                        <TableRow key={member.id}>
                                            <TableCell>{member.name || 'Non spécifié'}</TableCell>
                                            <TableCell>{member.email}</TableCell>
                                            <TableCell>{member.role || 'Membre'}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => navigate(`/member/editmember/${member.id}`)}
                                                >
                                                    Voir détails
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {members.length > 5 && (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                            <Typography color="text.secondary">
                                {members.length - 5} membres supplémentaires...
                            </Typography>
                        </Box>
                    )}
                </Paper>
            </Box>
        );
    };

    return (
        <PermissionRequired resource="members" action="validate_user">
            <Box sx={{ p: 3 }}>
                {/* Header */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        mb: 3,
                        borderRadius: 3,
                        background: theme => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                            Administration
                        </Typography>
                        <Typography variant="body1">
                            Gérez votre association, les utilisateurs et les membres
                        </Typography>

                        <Box sx={{ display: 'flex', mt: 2 }}>
                            <Button
                                variant="contained"
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                                }}
                                onClick={refreshData}
                                startIcon={<RefreshIcon />}
                                disabled={refreshingData}
                            >
                                {refreshingData ? 'Actualisation...' : 'Actualiser les données'}
                            </Button>
                        </Box>
                    </Box>

                    {/* Decorative elements */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: -50,
                            right: -50,
                            width: 200,
                            height: 200,
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
                            width: 100,
                            height: 100,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)',
                            zIndex: 0
                        }}
                    />
                </Paper>

                {/* Error/Success alerts */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                        {success}
                    </Alert>
                )}

                {/* Loading indicator */}
                {loading && (
                    <LinearProgress sx={{ mb: 3 }} />
                )}

                {/* Main tabs */}
                <Box sx={{ mb: 3 }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
                        <Tab label="Association" icon={<BusinessIcon />} iconPosition="start" />
                        <Tab
                            label={
                                <>
                                    Utilisateurs
                                    {pendingUsers.length > 0 && (
                                        <Badge badgeContent={pendingUsers.length} color="error" sx={{ ml: 1 }}>
                                            <InfoIcon sx={{ fontSize: '0.1rem' }} />
                                        </Badge>
                                    )}
                                </>
                            }
                            icon={<ManageAccountsIcon />}
                            iconPosition="start"
                        />
                        <Tab label="Membres" icon={<PersonIcon />} iconPosition="start" />
                    </Tabs>
                </Box>

                {/* Tab panels */}
                <TabPanel value={tabValue} index={0}>
                    {renderAssociationSection()}
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    {renderUsersSection()}
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                    {renderMembersSection()}
                </TabPanel>
            </Box>
        </PermissionRequired>
    );
};

export default AdminDashboard;