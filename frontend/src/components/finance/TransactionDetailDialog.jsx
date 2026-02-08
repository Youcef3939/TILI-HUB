import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Grid,
    Box,
    Chip,
    Divider,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    IconButton,
    Alert
} from '@mui/material';
import {
    Visibility,
    Delete,
    Edit,
    CheckCircle,
    Cancel,
    Download,
    AttachFile
} from '@mui/icons-material';
import dayjs from 'dayjs';
import AxiosInstance from '../Axios';
import ForeignDonationWarning from './ForeignDonationWarning';

// Format currency function
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-TN', {
        style: 'currency',
        currency: 'TND',
        minimumFractionDigits: 2
    }).format(amount);
};

const TransactionDetail = ({
                               open,
                               onClose,
                               transaction,
                               onVerify,
                               onDelete,
                               refreshData
                           }) => {
    const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
    const [verificationNote, setVerificationNote] = useState('');
    const [verificationStatus, setVerificationStatus] = useState('verified');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Reset verification form when transaction changes
        if (transaction) {
            setVerificationNote('');
            setVerificationStatus(transaction.status || 'verified');
        }
    }, [transaction]);

    if (!transaction) return null;

    const handleVerifyClick = () => {
        setVerifyDialogOpen(true);
    };

    const handleVerifyClose = () => {
        setVerifyDialogOpen(false);
    };

    const handleVerifySubmit = async () => {
        try {
            setLoading(true);
            setError('');

            await onVerify({
                status: verificationStatus,
                verification_notes: verificationNote
            });

            setLoading(false);
            setVerifyDialogOpen(false);
        } catch (err) {
            console.error("Verification error:", err);
            setError('Erreur lors de la vérification: ' + (err.message || 'Une erreur est survenue'));
            setLoading(false);
        }
    };

    const handleDownloadDocument = async () => {
        if (transaction && transaction.id) {
            try {
                // Use the new endpoint
                const response = await AxiosInstance.get(
                    `/finances/transactions/${transaction.id}/download_document/`,
                    { responseType: 'blob' }
                );

                // Get filename from content-disposition or use a default
                const contentDisposition = response.headers['content-disposition'];
                let filename = 'document.pdf';
                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                    if (filenameMatch.length === 2) {
                        filename = filenameMatch[1];
                    }
                }

                // Create a blob URL and trigger download
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Download failed:', error);
                // You can add error notification here
            }
        }
    };


    const handleRefresh = () => {
        if (refreshData) {
            refreshData();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                        Détails de la Transaction
                    </Typography>
                    <Chip
                        label={
                            transaction.transaction_type === 'income' ? 'Revenu' : 'Dépense'
                        }
                        color={
                            transaction.transaction_type === 'income' ? 'success' : 'error'
                        }
                        size="medium"
                    />
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <ForeignDonationWarning
                    transaction={transaction}
                    onRefresh={handleRefresh}
                />

                <Grid container spacing={3}>
                    {/* Basic Information */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom>
                            Informations de base
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Montant:
                                </Typography>
                                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                                    {formatCurrency(transaction.amount)}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Date:
                                </Typography>
                                <Typography variant="body1">
                                    {dayjs(transaction.date).format('DD/MM/YYYY')}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Catégorie:
                                </Typography>
                                <Typography variant="body1">
                                    {transaction.category === 'donation' ? 'Don' :
                                        transaction.category === 'membership_fee' ? 'Cotisation membre' :
                                            transaction.category === 'grant' ? 'Subvention' :
                                                transaction.category === 'project_expense' ? 'Dépense projet' :
                                                    transaction.category === 'operational_cost' ? 'Coût opérationnel' :
                                                        transaction.category === 'salary' ? 'Salaire' :
                                                            transaction.category === 'tax' ? 'Impôt' :
                                                                transaction.category === 'other_income' ? 'Autre revenu' :
                                                                    transaction.category === 'other_expense' ? 'Autre dépense' :
                                                                        transaction.category}
                                </Typography>
                            </Box>

                            {transaction.reference_number && (
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Numéro de référence:
                                    </Typography>
                                    <Typography variant="body1">
                                        {transaction.reference_number}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Grid>

                    {/* Related Entities */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom>
                            Entités liées
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {transaction.project && (
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Projet:
                                    </Typography>
                                    <Typography variant="body1">
                                        {transaction.project_details?.name || 'N/A'}
                                    </Typography>
                                </Box>
                            )}

                            {transaction.donor && (
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Donateur:
                                    </Typography>
                                    <Typography variant="body1">
                                        {transaction.donor_details?.name || 'N/A'}
                                        {transaction.donor_details?.is_member && (
                                            <Chip
                                                label="Membre"
                                                size="small"
                                                color="primary"
                                                sx={{ ml: 1 }}
                                            />
                                        )}
                                        {transaction.donor_details?.is_internal && (
                                            <Chip
                                                label="Interne"
                                                size="small"
                                                color="secondary"
                                                sx={{ ml: 1 }}
                                            />
                                        )}
                                    </Typography>
                                </Box>
                            )}

                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Statut:
                                </Typography>
                                <Chip
                                    label={
                                        transaction.status === 'pending' ? 'En attente' :
                                            transaction.status === 'verified' ? 'Vérifié' :
                                                transaction.status === 'rejected' ? 'Rejeté' :
                                                    transaction.status
                                    }
                                    color={
                                        transaction.status === 'pending' ? 'warning' :
                                            transaction.status === 'verified' ? 'success' :
                                                transaction.status === 'rejected' ? 'error' :
                                                    'default'
                                    }
                                    size="small"
                                />
                            </Box>

                            {transaction.document && (
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Document:
                                    </Typography>
                                    <Button
                                        startIcon={<Download />}
                                        size="small"
                                        onClick={handleDownloadDocument}
                                    >
                                        Télécharger
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    </Grid>

                    {/* Description */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom>
                            Description
                        </Typography>
                        <Typography variant="body1" paragraph>
                            {transaction.description}
                        </Typography>
                    </Grid>

                    {/* Verification Information */}
                    {transaction.status === 'verified' && transaction.verified_by && (
                        <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="subtitle1" gutterBottom>
                                Informations de vérification
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Vérifié par:
                                    </Typography>
                                    <Typography variant="body1">
                                        {transaction.verified_by_details?.email || 'N/A'}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Date de vérification:
                                    </Typography>
                                    <Typography variant="body1">
                                        {transaction.verification_date ?
                                            dayjs(transaction.verification_date).format('DD/MM/YYYY HH:mm') :
                                            'N/A'}
                                    </Typography>
                                </Box>

                                {transaction.verification_notes && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Notes de vérification:
                                        </Typography>
                                        <Typography variant="body1">
                                            {transaction.verification_notes}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>
                    Fermer
                </Button>
                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => onDelete(transaction)}
                >
                    Supprimer
                </Button>
            </DialogActions>

            {/* Verification Dialog */}
            <Dialog
                open={verifyDialogOpen}
                onClose={handleVerifyClose}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Vérifier la transaction</DialogTitle>

                <DialogContent>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Statut</InputLabel>
                        <Select
                            value={verificationStatus}
                            onChange={(e) => setVerificationStatus(e.target.value)}
                            label="Statut"
                        >
                            <MenuItem value="verified">Vérifié</MenuItem>
                            <MenuItem value="rejected">Rejeté</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        label="Notes de vérification"
                        multiline
                        rows={3}
                        fullWidth
                        margin="normal"
                        value={verificationNote}
                        onChange={(e) => setVerificationNote(e.target.value)}
                    />
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleVerifyClose} disabled={loading}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleVerifySubmit}
                        color="primary"
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                        disabled={loading}
                    >
                        Confirmer
                    </Button>
                </DialogActions>
            </Dialog>
        </Dialog>
    );
};

export default TransactionDetail;