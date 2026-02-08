import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    IconButton,
    Chip,
    TextField,
    InputAdornment,
    Button,
    Tooltip,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    FormHelperText,
    Grid,
    CircularProgress,
    useTheme,
    Alert
} from '@mui/material';
import {
    Edit,
    Delete,
    Search,
    FilterList,
    Download,
    Visibility,
    MoreVert,
    Check,
    Close,
    FileDownload,
    Warning,
    PublicOutlined // Added for foreign donation indicator
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import AxiosInstance from '../Axios';
import DialogueDetailTransaction from './TransactionDetailDialog.jsx';

// Fonction utilitaire pour formater les montants avec devise
const formaterDevise = (montant) => {
    return new Intl.NumberFormat('fr-TN', {
        style: 'currency',
        currency: 'TND',
        minimumFractionDigits: 2
    }).format(montant);
};

// Helper function to determine if a transaction is a foreign donation
const isForeignDonation = (transaction) => {
    return transaction &&
        transaction.transaction_type === 'income' &&
        transaction.donor_details &&
        !transaction.donor_details.is_member &&
        !transaction.donor_details.is_internal;
};

// Composant de dialogue pour vérifier une transaction
const DialogueVerificationTransaction = ({ open, onClose, transaction, onVerify }) => {
    const theme = useTheme();
    const [chargement, setChargement] = useState(false);
    const [erreur, setErreur] = useState('');
    const [allocations, setAllocations] = useState([]);
    const [budgetSelectionne, setBudgetSelectionne] = useState(null);
    const [notesVerification, setNotesVerification] = useState('');

    // Récupérer les allocations budgétaires pour le projet lorsque le dialogue s'ouvre
    useEffect(() => {
        const recupererAllocations = async () => {
            if (!transaction || !transaction.project || transaction.transaction_type !== 'expense') {
                setAllocations([]);
                return;
            }

            try {
                const response = await AxiosInstance.get('/finances/budget-allocations/', {
                    params: { project: transaction.project }
                });
                setAllocations(response.data);

                // Si la transaction a déjà une allocation budgétaire, la sélectionner
                if (transaction.budget_allocation) {
                    setBudgetSelectionne(transaction.budget_allocation);
                } else if (response.data.length > 0) {
                    // Sinon, sélectionner le budget avec le plus de fonds restants
                    const budgetsTries = [...response.data].sort((a, b) =>
                        b.remaining_amount - a.remaining_amount
                    );
                    setBudgetSelectionne(budgetsTries[0].id);
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des allocations budgétaires:', error);
                setErreur('Échec du chargement des allocations budgétaires');
            }
        };

        if (open && transaction) {
            recupererAllocations();
            setNotesVerification('');
            setErreur('');
        }
    }, [open, transaction]);

    const handleVerifier = async (verifiee) => {
        if (verifiee && transaction.transaction_type === 'expense' &&
            transaction.is_project_wide &&
            !transaction.budget_allocation && !budgetSelectionne) {
            setErreur('Veuillez sélectionner une allocation budgétaire pour cette dépense à l\'échelle du projet');
            return;
        }

        setChargement(true);
        try {
            const donnees = {
                status: verifiee ? 'verified' : 'rejected',
                verification_notes: notesVerification
            };

            // Ajouter l'allocation budgétaire aux données si sélectionnée et pas déjà définie
            if (verifiee && transaction.transaction_type === 'expense' &&
                !transaction.budget_allocation && budgetSelectionne) {
                donnees.budget_allocation = budgetSelectionne;
            }

            await AxiosInstance.post(`/finances/transactions/${transaction.id}/verify/`, donnees);
            onVerify();
        } catch (error) {
            console.error('Erreur lors de la vérification de la transaction:', error);
            setErreur(error.response?.data?.error || 'Échec de la vérification de la transaction');
        } finally {
            setChargement(false);
        }
    };
    return (
        <Dialog open={open} onClose={() => chargement ? null : onClose()} maxWidth="sm" fullWidth>
            <DialogTitle>Vérifier la Transaction</DialogTitle>
            <DialogContent>
                {erreur && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {erreur}
                    </Alert>
                )}

                <Typography>
                    Voulez-vous approuver ou rejeter cette transaction ?
                </Typography>

                {transaction && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: theme.palette.grey[100], borderRadius: 1 }}>
                        <Typography variant="subtitle2">
                            {transaction.transaction_type === 'income' ? 'Revenu' : 'Dépense'}: {formaterDevise(transaction.amount)}
                        </Typography>
                        <Typography variant="body2">
                            {transaction.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Date : {dayjs(transaction.date).format('DD/MM/YYYY')}
                        </Typography>
                        {transaction.document && (
                            <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Document justificatif : {transaction.document.split('/').pop()}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}

                {/* Sélection d'allocation budgétaire pour les dépenses */}
                {transaction && transaction.transaction_type === 'expense' &&
                    !transaction.budget_allocation && allocations.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel>
                                    {transaction.is_project_wide
                                        ? "Sélectionner une allocation budgétaire (Requis)"
                                        : "Sélectionner une allocation budgétaire (Optionnel)"}
                                </InputLabel>
                                <Select
                                    value={budgetSelectionne || ''}
                                    onChange={(e) => setBudgetSelectionne(e.target.value)}
                                    label={transaction.is_project_wide
                                        ? "Sélectionner une allocation budgétaire (Requis)"
                                        : "Sélectionner une allocation budgétaire (Optionnel)"}
                                >
                                    {allocations.map((budget) => (
                                        <MenuItem key={budget.id} value={budget.id}>
                                            {formaterDevise(budget.allocated_amount)} - Restant : {formaterDevise(budget.remaining_amount)}
                                            {budget.remaining_amount < transaction.amount &&
                                                ' (Fonds insuffisants)'}
                                        </MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText>
                                    {transaction.is_project_wide
                                        ? "Pour les dépenses à l'échelle du projet, une allocation budgétaire est requise"
                                        : "Sélectionnez le budget duquel cette dépense peut être déduite (optionnel)"}
                                </FormHelperText>
                            </FormControl>
                        </Box>
                    )}

                {/* Avertissement si aucun budget disponible */}
                {transaction && transaction.transaction_type === 'expense' &&
                    !transaction.budget_allocation && allocations.length === 0 && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            Aucune allocation budgétaire trouvée pour ce projet. Vous pouvez quand même vérifier
                            la transaction, mais elle ne sera liée à aucun budget.
                        </Alert>
                    )}

                {/* Information si déjà lié à une allocation budgétaire */}
                {transaction && transaction.budget_allocation && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Cette transaction est déjà liée à une allocation budgétaire.
                    </Alert>
                )}

                <TextField
                    label="Notes de vérification"
                    fullWidth
                    multiline
                    rows={3}
                    value={notesVerification}
                    onChange={(e) => setNotesVerification(e.target.value)}
                    margin="normal"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={chargement}>Annuler</Button>
                <Button
                    onClick={() => handleVerifier(false)}
                    color="error"
                    variant="outlined"
                    disabled={chargement}
                >
                    Rejeter
                </Button>
                <Button
                    onClick={() => handleVerifier(true)}
                    color="success"
                    variant="contained"
                    disabled={chargement}
                >
                    {chargement ? <CircularProgress size={24} /> : 'Vérifier'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const ListeTransactions = ({ transactions, onRefresh, onAddTransaction }) => {
    const theme = useTheme();
    const [page, setPage] = useState(0);
    const [lignesParPage, setLignesParPage] = useState(10);
    const [transactionsFiltrees, setTransactionsFiltrees] = useState([]);
    const [recherche, setRecherche] = useState('');
    const [transactionSelectionnee, setTransactionSelectionnee] = useState(null);
    const [dialogueDetailOuvert, setDialogueDetailOuvert] = useState(false);
    const [dialogueSuppressionOuvert, setDialogueSuppressionOuvert] = useState(false);
    const [dialogueVerificationOuvert, setDialogueVerificationOuvert] = useState(false);
    const [actionChargement, setActionChargement] = useState(false);

    // État du menu
    const [anchorEl, setAnchorEl] = useState(null);
    const [transactionMenuSelectionnee, setTransactionMenuSelectionnee] = useState(null);

    // État des filtres
    const [filtres, setFiltres] = useState({
        type: '',
        category: '',
        status: '',
        startDate: null,
        endDate: null
    });
    const [dialogueFiltresOuvert, setDialogueFiltresOuvert] = useState(false);

    // Nouvel état pour les rapports de dons étrangers
    const [foreignDonationReports, setForeignDonationReports] = useState({});

    // Effet pour charger les rapports de dons étrangers
    useEffect(() => {
        if (!transactions || transactions.length === 0) return;

        const fetchReports = async () => {
            try {
                const response = await AxiosInstance.get('/finances/foreign-donation-reports/');
                const reportsMap = {};

                // Transformer la liste en map pour un accès facile par ID de transaction
                response.data.forEach(report => {
                    reportsMap[report.transaction] = report;
                });

                setForeignDonationReports(reportsMap);
            } catch (error) {
                console.error('Erreur lors du chargement des rapports de dons étrangers:', error);
            }
        };

        fetchReports();
    }, [transactions]);

    // Effet pour filtrer les transactions basé sur la recherche et les filtres
    useEffect(() => {
        if (!transactions) return;

        let filtrees = [...transactions];

        // Appliquer la recherche textuelle
        if (recherche) {
            const rechercheLower = recherche.toLowerCase();
            filtrees = filtrees.filter(transaction =>
                transaction.description.toLowerCase().includes(rechercheLower) ||
                (transaction.reference_number && transaction.reference_number.toLowerCase().includes(rechercheLower)) ||
                (transaction.project_details && transaction.project_details.name.toLowerCase().includes(rechercheLower)) ||
                (transaction.donor_details && transaction.donor_details.name.toLowerCase().includes(rechercheLower))
            );
        }

        // Appliquer les filtres
        if (filtres.type) {
            filtrees = filtrees.filter(t => t.transaction_type === filtres.type);
        }

        if (filtres.category) {
            filtrees = filtrees.filter(t => t.category === filtres.category);
        }

        if (filtres.status) {
            filtrees = filtrees.filter(t => t.status === filtres.status);
        }

        if (filtres.startDate) {
            filtrees = filtrees.filter(t => new Date(t.date) >= filtres.startDate.toDate());
        }

        if (filtres.endDate) {
            filtrees = filtrees.filter(t => new Date(t.date) <= filtres.endDate.toDate());
        }

        setTransactionsFiltrees(filtrees);
    }, [transactions, recherche, filtres]);

    const handleChangerPage = (event, nouvellePage) => {
        setPage(nouvellePage);
    };

    const handleChangerLignesParPage = (event) => {
        setLignesParPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleChangerRecherche = (event) => {
        setRecherche(event.target.value);
        setPage(0);
    };

    const handleOuvrirDialogueFiltres = () => {
        setDialogueFiltresOuvert(true);
    };

    const handleFermerDialogueFiltres = () => {
        setDialogueFiltresOuvert(false);
    };

    const handleChangerFiltre = (name, value) => {
        setFiltres({
            ...filtres,
            [name]: value
        });
    };

    const reinitialiserFiltres = () => {
        setFiltres({
            type: '',
            category: '',
            status: '',
            startDate: null,
            endDate: null
        });
        setDialogueFiltresOuvert(false);
    };

    const handleOuvrirMenu = (event, transaction) => {
        setAnchorEl(event.currentTarget);
        setTransactionMenuSelectionnee(transaction);
    };

    const handleFermerMenu = () => {
        setAnchorEl(null);
        setTransactionMenuSelectionnee(null);
    };

    const handleVoirDetails = (transaction) => {
        setTransactionSelectionnee(transaction);
        setDialogueDetailOuvert(true);
        handleFermerMenu();
    };

    const handleDialogueSuppression = (transaction) => {
        setTransactionSelectionnee(transaction);
        setDialogueSuppressionOuvert(true);
        handleFermerMenu();
    };

    const handleDialogueVerification = (transaction) => {
        setTransactionSelectionnee(transaction);
        setDialogueVerificationOuvert(true);
        handleFermerMenu();
    };

    const handleSuccesVerification = () => {
        setDialogueVerificationOuvert(false);
        setTransactionSelectionnee(null);
        onRefresh();
    };

    const handleSupprimerTransaction = async () => {
        if (!transactionSelectionnee) return;

        setActionChargement(true);
        try {
            await AxiosInstance.delete(`/finances/transactions/${transactionSelectionnee.id}/`);
            setDialogueSuppressionOuvert(false);
            setTransactionSelectionnee(null);
            onRefresh();
        } catch (error) {
            console.error('Erreur lors de la suppression de la transaction:', error);
        } finally {
            setActionChargement(false);
        }
    };

    const handleExporterTransactions = async () => {
        try {
            // Construire les paramètres de requête basés sur les filtres actuels
            const params = new URLSearchParams();
            if (filtres.type) params.append('transaction_type', filtres.type);
            if (filtres.category) params.append('category', filtres.category);
            if (filtres.status) params.append('status', filtres.status);
            if (filtres.startDate) params.append('start_date', filtres.startDate.format('YYYY-MM-DD'));
            if (filtres.endDate) params.append('end_date', filtres.endDate.format('YYYY-MM-DD'));

            // Faire une requête API avec responseType blob pour le téléchargement de fichier
            const response = await AxiosInstance.get(`/finances/transactions/export/?${params.toString()}`, {
                responseType: 'blob'
            });

            // Créer une URL pour le blob
            const url = window.URL.createObjectURL(new Blob([response.data]));

            // Créer un lien temporaire et déclencher le téléchargement
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `export_transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();

            // Nettoyage
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
        } catch (error) {
            console.error('Erreur lors de l\'exportation des transactions:', error);
        }
    };

    // Obtenir le nombre de filtres actifs pour le badge
    const getNombreFiltresActifs = () => {
        return Object.values(filtres).filter(value => value !== '' && value !== null).length;
    };

    // Puce de statut basée sur le statut de la transaction
    const getPuceStatut = (status) => {
        switch (status) {
            case 'verified':
                return (
                    <Chip
                        size="small"
                        color="success"
                        icon={<Check fontSize="small" />}
                        label="Vérifiée"
                        sx={{ fontWeight: 600 }}
                    />
                );
            case 'rejected':
                return (
                    <Chip
                        size="small"
                        color="error"
                        icon={<Close fontSize="small" />}
                        label="Rejetée"
                        sx={{ fontWeight: 600 }}
                    />
                );
            default:
                return (
                    <Chip
                        size="small"
                        color="warning"
                        icon={<Warning fontSize="small" />}
                        label="En attente"
                        sx={{ fontWeight: 600 }}
                    />
                );
        }
    };

    // Puce de type de transaction basée sur le type
    const getPuceType = (type) => {
        if (type === 'income') {
            return (
                <Chip
                    size="small"
                    label="Revenu"
                    sx={{
                        bgcolor: 'rgba(46, 125, 50, 0.1)',
                        color: 'success.main',
                        fontWeight: 600,
                        borderRadius: '4px'
                    }}
                />
            );
        }
        return (
            <Chip
                size="small"
                label="Dépense"
                sx={{
                    bgcolor: 'rgba(211, 47, 47, 0.1)',
                    color: 'error.main',
                    fontWeight: 600,
                    borderRadius: '4px'
                }}
            />
        );
    };

    // Fonction pour obtenir l'indicateur de don étranger
    const getForeignDonationIndicator = (transaction) => {
        // Vérifier si c'est un don étranger
        if (!isForeignDonation(transaction)) {
            return null;
        }

        const report = foreignDonationReports[transaction.id];

        // Si le rapport existe et est terminé, ne pas montrer d'avertissement
        if (report && report.report_status === 'completed') {
            return null;
        }

        // Déterminer la sévérité de l'avertissement
        let color = 'warning';
        let tooltipText = 'Don étranger - Déclaration requise';

        if (report) {
            const daysLeft = report.days_until_deadline;
            const deadlinePassed = daysLeft < 0;

            if (deadlinePassed) {
                color = 'error';
                tooltipText = `Don étranger - Déclaration en retard de ${Math.abs(daysLeft)} jours`;
            } else {
                tooltipText = `Don étranger - ${daysLeft} jours restants pour la déclaration`;
            }
        }

        return (
            <Tooltip title={tooltipText}>
                <PublicOutlined
                    fontSize="small"
                    color={color}
                    sx={{ ml: 1 }}
                />
            </Tooltip>
        );
    };

    return (
        <Box>
            {/* Barre d'outils de recherche et de filtre */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                    flexWrap: 'wrap',
                    gap: 1
                }}
            >
                <TextField
                    placeholder="Rechercher des transactions..."
                    size="small"
                    value={recherche}
                    onChange={handleChangerRecherche}
                    sx={{ flexGrow: 1, maxWidth: 500 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        onClick={handleOuvrirDialogueFiltres}
                        startIcon={<FilterList />}
                        color={getNombreFiltresActifs() > 0 ? "primary" : "inherit"}
                        sx={{
                            borderRadius: '8px',
                            position: 'relative'
                        }}
                    >
                        Filtres
                        {getNombreFiltresActifs() > 0 && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: -8,
                                    right: -8,
                                    bgcolor: 'primary.main',
                                    color: 'primary.contrastText',
                                    borderRadius: '50%',
                                    width: 20,
                                    height: 20,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                }}
                            >
                                {getNombreFiltresActifs()}
                            </Box>
                        )}
                    </Button>

                    <Button
                        variant="outlined"
                        onClick={handleExporterTransactions}
                        startIcon={<FileDownload />}
                        sx={{ borderRadius: '8px' }}
                    >
                        Exporter
                    </Button>
                </Box>
            </Box>

            {/* Tableau des transactions */}
            <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto', borderRadius: 2 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Catégorie</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Projet</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Lié à</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Montant</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {transactionsFiltrees.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        Aucune transaction trouvée
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactionsFiltrees
                                .slice(page * lignesParPage, page * lignesParPage + lignesParPage)
                                .map((transaction) => {
                                    // Vérifier si c'est un don étranger avec rapport non complété
                                    const isForeign = isForeignDonation(transaction) &&
                                        (!foreignDonationReports[transaction.id] ||
                                            foreignDonationReports[transaction.id].report_status !== 'completed');

                                    return (
                                        <TableRow
                                            key={transaction.id}
                                            hover
                                            sx={{
                                                bgcolor: isForeign ? 'rgba(255, 193, 7, 0.15)' : 'inherit',
                                                '&:hover': {
                                                    bgcolor: isForeign ? 'rgba(255, 193, 7, 0.2)' : undefined
                                                }
                                            }}
                                        >
                                            <TableCell>{dayjs(transaction.date).format('DD/MM/YYYY')}</TableCell>
                                            <TableCell>{getPuceType(transaction.transaction_type)}</TableCell>
                                            <TableCell>
                                                <Tooltip title={transaction.category}>
                                                    <span>
                                                        {transaction.category.split('_').map(word =>
                                                            word.charAt(0).toUpperCase() + word.slice(1)
                                                        ).join(' ')}
                                                    </span>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Tooltip title={transaction.description}>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                maxWidth: 150,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {transaction.description}
                                                        </Typography>
                                                    </Tooltip>
                                                    {getForeignDonationIndicator(transaction)}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                {transaction.project_details ? (
                                                    <Tooltip title={transaction.project_details.name}>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                maxWidth: 100,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {transaction.project_details.name}
                                                        </Typography>
                                                    </Tooltip>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                {transaction.donor_details ? (
                                                    <Tooltip title={transaction.donor_details.name}>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                maxWidth: 100,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {transaction.donor_details.name}
                                                        </Typography>
                                                    </Tooltip>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Typography
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        color: transaction.transaction_type === 'income' ? 'success.main' : 'error.main'
                                                    }}
                                                >
                                                    {transaction.transaction_type === 'income' ? '+' : '-'} {formaterDevise(transaction.amount)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{getPuceStatut(transaction.status)}</TableCell>
                                            <TableCell>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleOuvrirMenu(e, transaction)}
                                                    aria-label="options de transaction"
                                                >
                                                    <MoreVert fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={transactionsFiltrees.length}
                rowsPerPage={lignesParPage}
                page={page}
                onPageChange={handleChangerPage}
                onRowsPerPageChange={handleChangerLignesParPage}
                sx={{ borderTop: 'none' }}
                labelRowsPerPage="Lignes par page :"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
            />

            {/* Menu d'actions */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleFermerMenu}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <MenuItem onClick={() => handleVoirDetails(transactionMenuSelectionnee)}>
                    <Visibility fontSize="small" sx={{ mr: 1 }} /> Voir les détails
                </MenuItem>
                <MenuItem
                    onClick={() => handleDialogueVerification(transactionMenuSelectionnee)}
                    disabled={transactionMenuSelectionnee?.status === 'verified' || transactionMenuSelectionnee?.status === 'rejected'}
                >
                    <Check fontSize="small" sx={{ mr: 1 }} /> Vérifier la transaction
                </MenuItem>

                <MenuItem onClick={() => handleDialogueSuppression(transactionMenuSelectionnee)}>
                    <Delete fontSize="small" sx={{ mr: 1 }} /> Supprimer
                </MenuItem>
            </Menu>

            {/* Dialogue de filtre */}
            <Dialog open={dialogueFiltresOuvert} onClose={handleFermerDialogueFiltres} maxWidth="sm" fullWidth>
                <DialogTitle>Filtrer les transactions</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Type de transaction</InputLabel>
                                <Select
                                    value={filtres.type}
                                    onChange={(e) => handleChangerFiltre('type', e.target.value)}
                                    label="Type de transaction"
                                >
                                    <MenuItem value="">Tous les types</MenuItem>
                                    <MenuItem value="income">Revenu</MenuItem>
                                    <MenuItem value="expense">Dépense</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Statut</InputLabel>
                                <Select
                                    value={filtres.status}
                                    onChange={(e) => handleChangerFiltre('status', e.target.value)}
                                    label="Statut"
                                >
                                    <MenuItem value="">Tous les statuts</MenuItem>
                                    <MenuItem value="pending">En attente</MenuItem>
                                    <MenuItem value="verified">Vérifiée</MenuItem>
                                    <MenuItem value="rejected">Rejetée</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Catégorie</InputLabel>
                                <Select
                                    value={filtres.category}
                                    onChange={(e) => handleChangerFiltre('category', e.target.value)}
                                    label="Catégorie"
                                >
                                    <MenuItem value="">Toutes les catégories</MenuItem>
                                    <MenuItem value="donation">Don</MenuItem>
                                    <MenuItem value="membership_fee">Cotisation de membre</MenuItem>
                                    <MenuItem value="grant">Subvention</MenuItem>
                                    <MenuItem value="project_expense">Dépense de projet</MenuItem>
                                    <MenuItem value="operational_cost">Coût opérationnel</MenuItem>
                                    <MenuItem value="salary">Salaire</MenuItem>
                                    <MenuItem value="tax">Paiement d'impôt</MenuItem>
                                    <MenuItem value="other_income">Autre revenu</MenuItem>
                                    <MenuItem value="other_expense">Autre dépense</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Date de début"
                                    value={filtres.startDate}
                                    onChange={(date) => handleChangerFiltre('startDate', date)}
                                    slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
                                />
                            </LocalizationProvider>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Date de fin"
                                    value={filtres.endDate}
                                    onChange={(date) => handleChangerFiltre('endDate', date)}
                                    slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
                                />
                            </LocalizationProvider>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={reinitialiserFiltres}>Réinitialiser les filtres</Button>
                    <Button onClick={handleFermerDialogueFiltres} variant="contained">Appliquer les filtres</Button>
                </DialogActions>
            </Dialog>

            {/* Dialogue de détails */}
            {transactionSelectionnee && (
                <DialogueDetailTransaction
                    open={dialogueDetailOuvert}
                    onClose={() => setDialogueDetailOuvert(false)}
                    transaction={transactionSelectionnee}
                    onVerify={handleSuccesVerification}
                    onDelete={handleDialogueSuppression}
                    onEdit={() => {}} // Implement if needed
                    refreshData={onRefresh}
                />
            )}

            {/* Dialogue de vérification de transaction */}
            <DialogueVerificationTransaction
                open={dialogueVerificationOuvert}
                onClose={() => setDialogueVerificationOuvert(false)}
                transaction={transactionSelectionnee}
                onVerify={handleSuccesVerification}
            />

            {/* Dialogue de confirmation de suppression */}
            <Dialog open={dialogueSuppressionOuvert} onClose={() => setDialogueSuppressionOuvert(false)}>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogContent>
                    <Typography>
                        Êtes-vous sûr de vouloir supprimer cette transaction ? Cette action ne peut pas être annulée.
                    </Typography>
                    {transactionSelectionnee && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: theme.palette.grey[100], borderRadius: 1 }}>
                            <Typography variant="subtitle2">
                                {transactionSelectionnee.transaction_type === 'income' ? 'Revenu' : 'Dépense'}: {formaterDevise(transactionSelectionnee.amount)}
                            </Typography>
                            <Typography variant="body2">
                                {transactionSelectionnee.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Date : {dayjs(transactionSelectionnee.date).format('DD/MM/YYYY')}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogueSuppressionOuvert(false)}>Annuler</Button>
                    <Button
                        onClick={handleSupprimerTransaction}
                        color="error"
                        variant="contained"
                        disabled={actionChargement}
                    >
                        {actionChargement ? <CircularProgress size={24} /> : 'Supprimer'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ListeTransactions;