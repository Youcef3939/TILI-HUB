import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Grid,
    Chip,
    Divider,
    Paper,
    alpha,
    Avatar,
    IconButton
} from '@mui/material';
import {
    Person,
    People,
    Business,
    Email,
    Phone,
    LocationOn,
    Receipt,
    Close,
    Edit
} from '@mui/icons-material';
import { usePermissions } from '../../contexts/PermissionsContext.jsx';
import { Link } from 'react-router-dom';

const DonorViewDialog = ({ open, donor, onClose }) => {
    const { can, RESOURCES, ACTIONS } = usePermissions();

    if (!donor) return null;

    // Fonction pour obtenir le type de donateur
    const getDonorType = () => {
        if (donor.is_member) return { label: "Membre", icon: <People />, color: "primary" };
        if (donor.is_internal) return { label: "Interne", icon: <Business />, color: "secondary" };
        return { label: "Externe", icon: <Person />, color: "info" };
    };

    const donorType = getDonorType();

    // Formater la devise
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-TN', {
            style: 'currency',
            currency: 'TND'
        }).format(amount);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: '12px', overflow: 'hidden' }
            }}
        >
            {/* En-tête */}
            <DialogTitle
                sx={{
                    bgcolor: (theme) => theme.palette[donorType.color].main,
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {donorType.icon}
                    <Typography variant="h6">Détails du Donateur</Typography>
                </Box>
                <IconButton
                    onClick={onClose}
                    sx={{ color: 'white' }}
                >
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ py: 3 }}>
                {/* Avatar et nom du donateur */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                    <Avatar
                        sx={{
                            width: 80,
                            height: 80,
                            bgcolor: (theme) => theme.palette[donorType.color].main,
                            mb: 2
                        }}
                    >
                        {donor.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="h5" fontWeight="bold">
                        {donor.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip
                            icon={donorType.icon}
                            label={donorType.label}
                            color={donorType.color}
                            size="small"
                        />
                        {donor.is_anonymous && (
                            <Chip
                                label="Anonyme"
                                size="small"
                                color="default"
                            />
                        )}
                        <Chip
                            label={donor.is_active ? "Actif" : "Inactif"}
                            size="small"
                            color={donor.is_active ? "success" : "default"}
                        />
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Informations du donateur */}
                <Grid container spacing={3}>
                    {/* Informations de base */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Informations de Contact
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {donor.email && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), width: 36, height: 36 }}>
                                        <Email color="primary" fontSize="small" />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Email</Typography>
                                        <Typography variant="body2">{donor.email}</Typography>
                                    </Box>
                                </Box>
                            )}

                            {donor.phone && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), width: 36, height: 36 }}>
                                        <Phone color="primary" fontSize="small" />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Téléphone</Typography>
                                        <Typography variant="body2">{donor.phone}</Typography>
                                    </Box>
                                </Box>
                            )}

                            {donor.address && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), width: 36, height: 36 }}>
                                        <LocationOn color="primary" fontSize="small" />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Adresse</Typography>
                                        <Typography variant="body2">{donor.address}</Typography>
                                    </Box>
                                </Box>
                            )}

                            {donor.tax_id && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), width: 36, height: 36 }}>
                                        <Receipt color="primary" fontSize="small" />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Numéro Fiscal</Typography>
                                        <Typography variant="body2">{donor.tax_id}</Typography>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Grid>

                    {/* Informations de don */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Informations de Don
                        </Typography>

                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                bgcolor: (theme) => alpha(theme.palette.success.main, 0.1),
                                borderRadius: '12px',
                                mb: 2
                            }}
                        >
                            <Typography variant="h4" color="success.main" fontWeight="bold">
                                {formatCurrency(donor.total_donations)}
                            </Typography>
                            <Typography variant="subtitle2" color="text.secondary">
                                Dons Totaux
                            </Typography>
                        </Paper>

                        {/* Informations spécifiques aux membres */}
                        {donor.is_member && donor.member_details && (
                            <Box mt={3}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                    Informations de Membre
                                </Typography>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                                        borderRadius: '12px',
                                    }}
                                >
                                    <Grid container spacing={1}>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">ID de Membre</Typography>
                                            <Typography variant="body2">{donor.member_id}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">Rôle</Typography>
                                            <Typography variant="body2">{donor.member_details?.role || 'Inconnu'}</Typography>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Box>
                        )}

                        {/* Notes */}
                        {donor.notes && (
                            <Box mt={3}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                    Notes
                                </Typography>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        bgcolor: (theme) => alpha(theme.palette.background.default, 0.6),
                                        borderRadius: '12px',
                                        border: '1px solid',
                                        borderColor: 'divider'
                                    }}
                                >
                                    <Typography variant="body2">
                                        {donor.notes}
                                    </Typography>
                                </Paper>
                            </Box>
                        )}
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    sx={{ borderRadius: '8px' }}
                >
                    Fermer
                </Button>

                {can(ACTIONS.UPDATE, RESOURCES.FINANCE) && (
                    <Button
                        component={Link}
                        to={`/finances/donors/${donor.id}/edit`}
                        variant="contained"
                        color="primary"
                        startIcon={<Edit />}
                        sx={{ borderRadius: '8px' }}
                    >
                        Modifier le Donateur
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default DonorViewDialog;