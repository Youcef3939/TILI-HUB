import React, { useState } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Button,
    TextField,
    InputAdornment,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Tooltip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Snackbar,
    Alert
} from '@mui/material';
import {
    Search,
    Edit,
    Delete,
    Visibility,
    Person,
    Business,
    People,
    PersonAdd,
    WarningAmber
} from '@mui/icons-material';
import { usePermissions } from '../../contexts/PermissionsContext.jsx';
import { Link } from 'react-router-dom';
import axiosInstance from '../Axios.jsx';
import DonorViewDialog from './DonorViewDialog';
import DonorEditForm from './DonorEditForm';

const DonorList = ({ donors, onRefresh, onAddDonor }) => {
    const { can, RESOURCES, ACTIONS } = usePermissions();
    const [searchTerm, setSearchTerm] = useState('');
    const [donorTypeFilter, setDonorTypeFilter] = useState('all');

    // État du dialogue de visualisation
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedDonor, setSelectedDonor] = useState(null);

    // État du dialogue de modification
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [donorToEdit, setDonorToEdit] = useState(null);

    // État du dialogue de suppression
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [donorToDelete, setDonorToDelete] = useState(null);

    // État des notifications
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // Filtrer les donateurs en fonction du terme de recherche et du type de donateur
    const filteredDonors = donors.filter((donor) => {
        // Filtre de recherche
        const matchesSearch =
            donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (donor.email && donor.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (donor.tax_id && donor.tax_id.toLowerCase().includes(searchTerm.toLowerCase()));

        // Filtre par type de donateur
        if (donorTypeFilter === 'all') return matchesSearch;
        if (donorTypeFilter === 'member') return matchesSearch && donor.is_member;
        if (donorTypeFilter === 'internal') return matchesSearch && donor.is_internal && !donor.is_member;
        if (donorTypeFilter === 'external') return matchesSearch && !donor.is_internal && !donor.is_member;

        return matchesSearch;
    });

    // Fonction pour obtenir l'icône du type de donateur
    const getDonorTypeIcon = (donor) => {
        if (donor.is_member) return <People color="primary" />;
        if (donor.is_internal) return <Business color="secondary" />;
        return <Person />;
    };

    // Fonction pour obtenir le libellé du type de donateur
    const getDonorTypeLabel = (donor) => {
        if (donor.is_member) return "Membre";
        if (donor.is_internal) return "Interne";
        return "Externe";
    };

    // Gestionnaire pour voir un donateur
    const handleViewDonor = (donor) => {
        setSelectedDonor(donor);
        setViewDialogOpen(true);
    };

    const handleCloseViewDialog = () => {
        setViewDialogOpen(false);
        setSelectedDonor(null);
    };

    // Gestionnaire pour modifier un donateur
    const handleEditDonor = (donor) => {
        setDonorToEdit(donor);
        setEditDialogOpen(true);
    };

    const handleCloseEditDialog = () => {
        setEditDialogOpen(false);
        setDonorToEdit(null);
    };

    const handleDonorUpdated = (updatedDonor) => {
        if (typeof onRefresh === 'function') {
            onRefresh();
        }
        setNotification({
            open: true,
            message: `Le donateur "${updatedDonor.name}" a été mis à jour avec succès`,
            severity: 'success'
        });
    };

    // Gestionnaires pour le dialogue de suppression
    const handleOpenDeleteDialog = (donor) => {
        setDonorToDelete(donor);
        setOpenDeleteDialog(true);
        setDeleteConfirmText('');
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
        setDonorToDelete(null);
        setDeleteConfirmText('');
    };

    // Gestionnaire de notification
    const handleCloseNotification = () => {
        setNotification({ ...notification, open: false });
    };

    // Gérer la suppression effective
    const handleDeleteDonor = async () => {
        if (donorToDelete && deleteConfirmText === 'supprimer') {
            try {
                // Vérifier les permissions
                if (!can(ACTIONS.DELETE, RESOURCES.FINANCE)) {
                    setNotification({
                        open: true,
                        message: 'Vous n\'avez pas la permission de supprimer des donateurs',
                        severity: 'error'
                    });
                    handleCloseDeleteDialog();
                    return;
                }

                // Appeler l'API pour supprimer le donateur
                await axiosInstance.delete(`/finances/donors/${donorToDelete.id}/`);

                setNotification({
                    open: true,
                    message: `Le donateur "${donorToDelete.name}" a été supprimé avec succès`,
                    severity: 'success'
                });

                // Fermer le dialogue et rafraîchir les données
                handleCloseDeleteDialog();
                if (typeof onRefresh === 'function') {
                    onRefresh();
                }
            } catch (error) {
                console.error('Erreur lors de la suppression du donateur:', error);
                setNotification({
                    open: true,
                    message: `Échec de la suppression du donateur : ${error.message || 'Erreur inconnue'}`,
                    severity: 'error'
                });
                handleCloseDeleteDialog();
            }
        }
    };

    return (
        <Box>
            {/* Filtres */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                    label="Rechercher des donateurs"
                    variant="outlined"
                    size="small"
                    sx={{ flexGrow: 1, minWidth: '200px' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                    }}
                />

                <FormControl variant="outlined" size="small" sx={{ minWidth: '150px' }}>
                    <InputLabel>Type de donateur</InputLabel>
                    <Select
                        value={donorTypeFilter}
                        onChange={(e) => setDonorTypeFilter(e.target.value)}
                        label="Type de donateur"
                    >
                        <MenuItem value="all">Tous les donateurs</MenuItem>
                        <MenuItem value="member">Membres</MenuItem>
                        <MenuItem value="internal">Internes</MenuItem>
                        <MenuItem value="external">Externes</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Tableau des donateurs */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell>Nom du donateur</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell align="right">Dons totaux</TableCell>
                            <TableCell>Statut</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredDonors.length > 0 ? (
                            filteredDonors.map((donor) => (
                                <TableRow key={donor.id}>
                                    <TableCell>
                                        <Tooltip title={getDonorTypeLabel(donor)}>
                                            {getDonorTypeIcon(donor)}
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        {donor.name}
                                        {donor.is_anonymous && (
                                            <Chip size="small" label="Anonyme" color="default" sx={{ ml: 1 }} />
                                        )}
                                    </TableCell>
                                    <TableCell>{donor.email || '-'}</TableCell>
                                    <TableCell align="right">
                                        {new Intl.NumberFormat('fr-TN', {
                                            style: 'currency',
                                            currency: 'TND'
                                        }).format(donor.total_donations)}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={donor.is_active ? 'Actif' : 'Inactif'}
                                            color={donor.is_active ? 'success' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Voir les détails du donateur">
                                            <IconButton
                                                size="small"
                                                color="info"
                                                onClick={() => handleViewDonor(donor)}
                                            >
                                                <Visibility fontSize="small" />
                                            </IconButton>
                                        </Tooltip>

                                        {can(ACTIONS.UPDATE, RESOURCES.FINANCE) && (
                                            <Tooltip title="Modifier le donateur">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => handleEditDonor(donor)}
                                                >
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}

                                        {can(ACTIONS.DELETE, RESOURCES.FINANCE) && (
                                            <Tooltip title="Supprimer le donateur">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleOpenDeleteDialog(donor)}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                                        Aucun donateur trouvé. {!searchTerm && 'Ajoutez votre premier donateur pour commencer.'}
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        startIcon={<PersonAdd />}
                                        onClick={onAddDonor}
                                        sx={{ mt: 1 }}
                                    >
                                        Ajouter un donateur
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Dialogue de visualisation */}
            {selectedDonor && (
                <DonorViewDialog
                    open={viewDialogOpen}
                    donor={selectedDonor}
                    onClose={handleCloseViewDialog}
                />
            )}

            {/* Dialogue de modification */}
            {editDialogOpen && (
                <DonorEditForm
                    isDialog={true}
                    onClose={handleCloseEditDialog}
                    donors={donors}
                    id={donorToEdit?.id}
                    onUpdate={handleDonorUpdated}
                />
            )}

            {/* Dialogue de confirmation de suppression */}
            <Dialog
                open={openDeleteDialog}
                onClose={handleCloseDeleteDialog}
                PaperProps={{
                    sx: { borderRadius: '8px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' }
                }}
            >
                <DialogTitle sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: 'error.light',
                    color: 'error.contrastText',
                    pb: 2
                }}>
                    <WarningAmber />
                    <Typography variant="h6" component="span">
                        Supprimer le donateur
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ pt: 3, px: 3 }}>
                    <DialogContentText>
                        Êtes-vous sûr de vouloir supprimer "{donorToDelete?.name}" ? Cette action <strong>ne peut pas</strong> être annulée.
                    </DialogContentText>
                    <DialogContentText sx={{ mt: 2, mb: 1 }}>
                        Tapez <strong>supprimer</strong> pour confirmer :
                    </DialogContentText>
                    <TextField
                        fullWidth
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Tapez 'supprimer' ici"
                        variant="outlined"
                        error={deleteConfirmText.length > 0 && deleteConfirmText !== 'supprimer'}
                        helperText={deleteConfirmText.length > 0 && deleteConfirmText !== 'supprimer' ?
                            "Veuillez taper 'supprimer' exactement pour confirmer" : ""}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button
                        onClick={handleCloseDeleteDialog}
                        variant="outlined"
                        sx={{ borderRadius: '8px' }}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleDeleteDonor}
                        color="error"
                        variant="contained"
                        disabled={deleteConfirmText !== 'supprimer'}
                        sx={{ borderRadius: '8px', px: 3 }}
                    >
                        Supprimer
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notification Snackbar */}
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

export default DonorList;