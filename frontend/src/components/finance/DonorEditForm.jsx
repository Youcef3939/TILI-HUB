import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    FormControlLabel,
    Checkbox,
    Typography,
    Box,
    IconButton,
    CircularProgress,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Snackbar,
    Alert,
    Divider
} from '@mui/material';
import {
    Close,
    Save,
    Cancel
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { usePermissions } from '../../contexts/PermissionsContext.jsx';
import axiosInstance from '../Axios.jsx';

const DonorEditForm = ({ isDialog = false, onClose = null, donors = [], onUpdate = null }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { can, RESOURCES, ACTIONS } = usePermissions();

    // État du formulaire
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        tax_id: '',
        notes: '',
        is_anonymous: false,
        is_member: false,
        is_internal: false,
        is_active: true,
        member_id: ''
    });

    // État du composant
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // Données des membres pour le menu déroulant (si le donateur est un membre)
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    // Chargement des données du donateur en cas de modification
    useEffect(() => {
        const fetchDonor = async () => {
            if (!id && !isDialog) return; // Nouveau donateur

            try {
                setLoading(true);
                let donorData;

                if (isDialog && donors.length > 0) {
                    // En mode dialogue, trouver le donateur dans le tableau fourni
                    donorData = donors.find(donor => donor.id === parseInt(id));
                } else {
                    // En mode page, récupérer depuis l'API
                    const response = await axiosInstance.get(`/finances/donors/${id}/`);
                    donorData = response.data;
                }

                if (donorData) {
                    setFormData({
                        name: donorData.name || '',
                        email: donorData.email || '',
                        phone: donorData.phone || '',
                        address: donorData.address || '',
                        tax_id: donorData.tax_id || '',
                        notes: donorData.notes || '',
                        is_anonymous: donorData.is_anonymous || false,
                        is_member: donorData.is_member || false,
                        is_internal: donorData.is_internal || false,
                        is_active: donorData.is_active !== undefined ? donorData.is_active : true,
                        member_id: donorData.member_id || ''
                    });

                    // Si c'est un membre, charger la liste des membres
                    if (donorData.is_member) {
                        fetchMembers();
                    }
                }
            } catch (err) {
                console.error('Erreur lors du chargement du donateur:', err);
                setError('Échec du chargement des données du donateur. Veuillez réessayer.');
            } finally {
                setLoading(false);
            }
        };

        fetchDonor();
    }, [id, isDialog, donors]);

    // Charger les membres lorsque is_member est coché
    const fetchMembers = async () => {
        try {
            setLoadingMembers(true);
            const response = await axiosInstance.get('/api/member/');
            setMembers(response.data || []);
        } catch (err) {
            console.error('Erreur lors du chargement des membres:', err);
            setNotification({
                open: true,
                message: 'Échec du chargement de la liste des membres. Certaines fonctionnalités peuvent être limitées.',
                severity: 'warning'
            });
        } finally {
            setLoadingMembers(false);
        }
    };

    // Gérer les changements de champs du formulaire
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        // Utiliser checked pour les cases à cocher, value pour les autres entrées
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Traitement spécial pour la case à cocher is_member
        if (name === 'is_member' && checked && members.length === 0) {
            fetchMembers();
        }

        // Si le statut de membre est décoché, effacer member_id
        if (name === 'is_member' && !checked) {
            setFormData(prev => ({ ...prev, member_id: '' }));
        }

        // Si le statut interne est coché, s'assurer que le statut de membre est décoché
        if (name === 'is_internal' && checked) {
            setFormData(prev => ({ ...prev, is_member: false, member_id: '' }));
        }

        // Si le statut de membre est coché, s'assurer que le statut interne est décoché
        if (name === 'is_member' && checked) {
            setFormData(prev => ({ ...prev, is_internal: false }));
        }
    };

    // Gérer la soumission du formulaire
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Vérifier si l'utilisateur a la permission
        if (!can(ACTIONS.UPDATE, RESOURCES.FINANCE)) {
            setNotification({
                open: true,
                message: 'Vous n\'avez pas la permission de modifier les donateurs',
                severity: 'error'
            });
            return;
        }

        try {
            setIsSaving(true);
            setError(null);

            // Créer ou mettre à jour le donateur
            let response;
            if (id) {
                // Mettre à jour le donateur existant
                response = await axiosInstance.put(`/finances/donors/${id}/`, formData);
            } else {
                // Créer un nouveau donateur
                response = await axiosInstance.post('/finances/donors/', formData);
            }

            setNotification({
                open: true,
                message: `Donateur ${id ? 'mis à jour' : 'créé'} avec succès !`,
                severity: 'success'
            });

            // Si en mode dialogue, appeler la fonction onUpdate
            if (isDialog && onUpdate) {
                onUpdate(response.data);
            }

            // Attendre un peu avant de fermer/naviguer pour montrer le message de succès
            setTimeout(() => {
                if (isDialog && onClose) {
                    onClose();
                } else {
                    navigate('/finances/donors');
                }
            }, 1500);

        } catch (err) {
            console.error('Erreur lors de l\'enregistrement du donateur:', err);

            let errorMessage = 'Échec de l\'enregistrement du donateur. Veuillez réessayer.';

            // Extraire les erreurs de validation si disponibles
            if (err.response?.data) {
                const errors = err.response.data;
                if (typeof errors === 'object') {
                    errorMessage = Object.entries(errors)
                        .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                        .join('; ');
                } else if (typeof errors === 'string') {
                    errorMessage = errors;
                }
            }

            setError(errorMessage);
            setNotification({
                open: true,
                message: errorMessage,
                severity: 'error'
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Gérer la fermeture du dialogue
    const handleClose = () => {
        if (isDialog && onClose) {
            onClose();
        } else {
            navigate('/finances/donors');
        }
    };

    // Gérer la fermeture de la notification
    const handleCloseNotification = () => {
        setNotification({ ...notification, open: false });
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: isDialog ? '300px' : '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Contenu principal du formulaire
    const formContent = (
        <form onSubmit={handleSubmit}>
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
            )}

            <Grid container spacing={3}>
                {/* Informations de base */}
                <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Informations de base
                    </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Nom du donateur"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        fullWidth
                        required
                        disabled={isSaving}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        fullWidth
                        disabled={isSaving}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Téléphone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        fullWidth
                        disabled={isSaving}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Numéro fiscal"
                        name="tax_id"
                        value={formData.tax_id}
                        onChange={handleChange}
                        fullWidth
                        disabled={isSaving}
                    />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        label="Adresse"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        fullWidth
                        multiline
                        rows={2}
                        disabled={isSaving}
                    />
                </Grid>

                <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                </Grid>

                {/* Type de donateur */}
                <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Type de donateur
                    </Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                name="is_member"
                                checked={formData.is_member}
                                onChange={handleChange}
                                disabled={isSaving || formData.is_internal}
                            />
                        }
                        label="Membre"
                    />
                </Grid>

                <Grid item xs={12} sm={4}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                name="is_internal"
                                checked={formData.is_internal}
                                onChange={handleChange}
                                disabled={isSaving || formData.is_member}
                            />
                        }
                        label="Interne"
                    />
                </Grid>

                <Grid item xs={12} sm={4}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                name="is_anonymous"
                                checked={formData.is_anonymous}
                                onChange={handleChange}
                                disabled={isSaving}
                            />
                        }
                        label="Anonyme"
                    />
                </Grid>

                {/* Sélection de membre si is_member est vrai */}
                {formData.is_member && (
                    <Grid item xs={12}>
                        <FormControl fullWidth disabled={isSaving || loadingMembers}>
                            <InputLabel>Sélectionner un membre</InputLabel>
                            <Select
                                name="member_id"
                                value={formData.member_id}
                                onChange={handleChange}
                                label="Sélectionner un membre"
                                required={formData.is_member}
                            >
                                <MenuItem value="" disabled>
                                    <em>Sélectionner un membre</em>
                                </MenuItem>
                                {members.map(member => (
                                    <MenuItem key={member.id} value={member.id}>
                                        {member.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                )}

                <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                </Grid>

                {/* Informations supplémentaires */}
                <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Informations supplémentaires
                    </Typography>
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        label="Notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        fullWidth
                        multiline
                        rows={4}
                        disabled={isSaving}
                    />
                </Grid>

                <Grid item xs={12}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                                disabled={isSaving}
                            />
                        }
                        label="Actif"
                    />
                </Grid>
            </Grid>

            {/* Boutons du formulaire - affichés uniquement en mode autonome, pas en mode dialogue */}
            {!isDialog && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
                    <Button
                        variant="outlined"
                        onClick={handleClose}
                        startIcon={<Cancel />}
                        disabled={isSaving}
                    >
                        Annuler
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={<Save />}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                                Enregistrement...
                            </>
                        ) : (
                            'Enregistrer le donateur'
                        )}
                    </Button>
                </Box>
            )}
        </form>
    );

    // Si c'est un dialogue, rendre dans un composant Dialog
    if (isDialog) {
        return (
            <>
                <Dialog
                    open={true}
                    onClose={isSaving ? undefined : handleClose}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: { borderRadius: '12px' }
                    }}
                >
                    <DialogTitle sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <Typography variant="h6">
                            {id ? 'Modifier le donateur' : 'Créer un donateur'}
                        </Typography>
                        <IconButton
                            onClick={handleClose}
                            disabled={isSaving}
                            sx={{ color: 'white' }}
                        >
                            <Close />
                        </IconButton>
                    </DialogTitle>

                    <DialogContent sx={{ p: 3, mt: 1 }}>
                        {formContent}
                    </DialogContent>

                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <Button
                            variant="outlined"
                            onClick={handleClose}
                            disabled={isSaving}
                            sx={{ borderRadius: '8px' }}
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmit}
                            disabled={isSaving}
                            sx={{ borderRadius: '8px' }}
                        >
                            {isSaving ? (
                                <>
                                    <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                                    Enregistrement...
                                </>
                            ) : (
                                'Enregistrer le donateur'
                            )}
                        </Button>
                    </DialogActions>
                </Dialog>

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
                        sx={{ width: '100%', borderRadius: '8px' }}
                    >
                        {notification.message}
                    </Alert>
                </Snackbar>
            </>
        );
    }

    // Sinon, rendre comme une page autonome
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" component="h1" gutterBottom>
                {id ? 'Modifier le donateur' : 'Créer un donateur'}
            </Typography>

            <Paper sx={{ p: 3, mt: 3, borderRadius: '12px' }}>
                {formContent}
            </Paper>

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
                    sx={{ width: '100%', borderRadius: '8px' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default DonorEditForm;