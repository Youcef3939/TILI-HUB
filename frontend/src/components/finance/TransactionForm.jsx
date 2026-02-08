import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Grid,
    FormControl,
    InputLabel,
    Select,
    FormHelperText,
    Box,
    Typography,
    InputAdornment,
    Autocomplete,
    CircularProgress,
    Alert,
    IconButton,
    Divider,
    Checkbox,
    FormControlLabel,
    ButtonGroup,
    Chip
} from '@mui/material';
import {
    AttachMoney,
    Description,
    AccountBalance,
    Person,
    Close,
    AttachFile,
    UploadFile,
    Delete,
    Business,
    Receipt,
    PersonOutline,
    People,
    Add,
    Refresh
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import AxiosInstance from '../Axios';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import DonorForm from './DonorForm';

// Définir les catégories de revenus
const incomeCategories = [
    { value: 'donation', label: 'Don' },
    { value: 'membership_fee', label: 'Cotisation' },
    { value: 'grant', label: 'Subvention' },
    { value: 'other_income', label: 'Autre Revenu' }
];

// Définir les catégories de dépenses
const expenseCategories = [
    { value: 'project_expense', label: 'Dépense de Projet' },
    { value: 'operational_cost', label: 'Coût Opérationnel' },
    { value: 'salary', label: 'Salaire' },
    { value: 'tax', label: 'Paiement de Taxe' },
    { value: 'other_expense', label: 'Autre Dépense' }
];

// Définir les catégories de revenus qui ne nécessitent pas d'association de projet
const nonProjectIncomeCategories = ['membership_fee', 'other_income'];

// Destinataires de dépenses courants basés sur le rapport de dépenses
const commonExpenseRecipients = [
    { id: 'team_member', name: 'Membre de l\'Équipe' },
    { id: 'Toute l\'équipe', name: 'Toute l\'équipe' },
    { id: 'non_member', name: 'Non-Membre (Externe)' },
    { id: 'cnss', name: 'CNSS (Sécurité Sociale)' },
    { id: 'internet', name: 'Fournisseur Internet' },
    { id: 'rent', name: 'Loyer de Bureau' },
    { id: 'Transport', name: 'Transport' },
    { id: 'vendor', name: 'Vendeur/Fournisseur' },
    { id: 'utility', name: 'Paiement de Services Publics' },
    { id: 'tax_authority', name: 'Administration Fiscale' },
    { id: 'other', name: 'Autre' }
];

// Fonction utilitaire pour formater les montants avec la devise
const formatCurrency = (amount) => {
    // Gérer les valeurs undefined, null ou NaN
    if (amount === undefined || amount === null || isNaN(amount)) {
        return '0.00 TND';
    }

    try {
        return new Intl.NumberFormat('fr-TN', {
            style: 'currency',
            currency: 'TND',
            minimumFractionDigits: 2
        }).format(amount);
    } catch (error) {
        console.error('Erreur lors du formatage de la devise:', error);
        return `${amount.toFixed(2)} TND`;
    }
};

// Schéma de validation du formulaire avec validation conditionnelle pour projet et donateur
const createTransactionSchema = yup.object({
    transaction_type: yup.string().required('Le type de transaction est requis'),
    category: yup.string().required('La catégorie est requise'),
    amount: yup
        .number()
        .typeError('Le montant doit être un nombre')
        .positive('Le montant doit être supérieur à zéro')
        .required('Le montant est requis'),
    description: yup.string().required('La description est requise'),
    date: yup.date().required('La date est requise'),
    // Le projet est requis uniquement pour des conditions spécifiques:
    // 1. Pour les dépenses à l'échelle du projet
    // 2. Pour les revenus qui ne sont pas des cotisations ou autres revenus
    project: yup.number().nullable().when(['transaction_type', 'category', 'is_project_wide'], {
        is: (type, category, isProjectWide) =>
            (type === 'expense' && isProjectWide) ||
            (type === 'income' && !nonProjectIncomeCategories.includes(category)),
        then: schema => schema.required('Le projet est requis'),
        otherwise: schema => schema.nullable()
    }),
    budget_allocation: yup.number().nullable(),
    paid_to: yup.string().nullable(), // Pour les destinataires de dépenses
    paid_to_notes: yup.string().when('recipient_type', {
        is: 'non_member',
        then: schema => schema.required('Des notes sont requises pour les destinataires non-membres')
    }),
    // Le donateur est requis uniquement pour des conditions spécifiques:
    // Pour l'instant, juste pour les dons
    donor: yup.number().nullable().when(['transaction_type', 'category'], {
        is: (type, category) => type === 'income' && category === 'donation',
        then: schema => schema.required('Le donateur est requis pour les dons'),
        otherwise: schema => schema.nullable()
    }),
    reference_number: yup.string().nullable(),
    recipient_type: yup.string().when('transaction_type', {
        is: 'expense',
        then: schema => schema.required('Le type de destinataire est requis')
    }),
    is_project_wide: yup.boolean().default(false)
});

const TransactionForm = ({ open, onClose, type = 'income', onSuccess }) => {
    // États
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    const [donors, setDonors] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [nonMemberRecipients, setNonMemberRecipients] = useState([]);
    const [budgetAllocations, setBudgetAllocations] = useState([]);
    const [budgetAllocationsLoading, setBudgetAllocationsLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileError, setFileError] = useState('');
    const [recipientType, setRecipientType] = useState('');
    const [customRecipient, setCustomRecipient] = useState('');
    const [recipientNotes, setRecipientNotes] = useState('');
    const [isProjectWide, setIsProjectWide] = useState(false);
    const [donorTypeFilter, setDonorTypeFilter] = useState('all');
    const [donorFormOpen, setDonorFormOpen] = useState(false);
    const [newDonorAdded, setNewDonorAdded] = useState(false);

    // Configuration du formulaire
    const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(createTransactionSchema),
        defaultValues: {
            transaction_type: type,
            category: '',
            amount: '',
            description: '',
            date: dayjs(),
            project: null,
            budget_allocation: null,
            donor: null,
            paid_to: '',
            paid_to_notes: '',
            reference_number: '',
            recipient_type: '',
            is_project_wide: false
        }
    });

    // Observer les valeurs pour le rendu conditionnel
    const watchTransactionType = watch('transaction_type');
    const watchCategory = watch('category');
    const watchProject = watch('project');
    const watchRecipientType = watch('recipient_type');
    const watchIsProjectWide = watch('is_project_wide');

    // Vérifier si le projet est requis
    const isProjectRequired =
        (watchTransactionType === 'expense' && watchIsProjectWide) ||
        (watchTransactionType === 'income' && !nonProjectIncomeCategories.includes(watchCategory));

    // Gérer l'ajout d'un nouveau donateur
    const handleAddDonor = () => {
        setDonorFormOpen(true);
    };

    // Gérer le succès du formulaire de donateur
    const handleDonorFormSuccess = () => {
        setDonorFormOpen(false);
        setNewDonorAdded(true);
        // Récupérer à nouveau la liste des donateurs pour inclure le nouveau donateur
        fetchDonors();
    };

    // Fonction pour récupérer les donateurs
    const fetchDonors = async () => {
        try {
            const donorsResponse = await AxiosInstance.get('/finances/donors/');
            setDonors(donorsResponse.data);
            console.log("Donateurs récupérés:", donorsResponse.data);
        } catch (error) {
            console.error('Erreur lors de la récupération des donateurs:', error);
        }
    };

    // Fonction d'aide pour filtrer les donateurs par type
    const filterDonorsByType = (donors, type) => {
        switch (type) {
            case 'member':
                return donors.filter(donor => donor.is_member);
            case 'internal':
                return donors.filter(donor => donor.is_internal);
            case 'external':
                return donors.filter(donor => !donor.is_member && !donor.is_internal);
            case 'all':
            default:
                return donors;
        }
    };

    // Fonction d'aide pour formater l'étiquette du donateur avec un indicateur de type
    const getDonorLabel = (donor) => {
        if (!donor) return '';

        let label = donor.name || '';
        if (donor.is_anonymous) {
            label += ' (Anonyme)';
        }
        return label;
    };

    // Récupérer les membres de l'équipe depuis l'API
    useEffect(() => {
        const fetchTeamMembers = async () => {
            try {
                const response = await AxiosInstance.get('/api/member/');
                setTeamMembers(response.data.map(member => ({
                    id: member.id,
                    name: member.name || member.full_name || member.username // Utiliser d'abord le nom de la réponse API
                })));
                console.log('Membres de l\'équipe récupérés:', response.data); // Ajouter ceci pour le débogage
            } catch (error) {
                console.error('Erreur lors de la récupération des membres de l\'équipe:', error);
                // Revenir à un tableau vide si l'API échoue
                setTeamMembers([]);
            }
        };

        fetchTeamMembers();
    }, []);

    // Charger les projets, donateurs et destinataires non-membres au montage du composant
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Récupérer les projets
                const projectsResponse = await AxiosInstance.get('/api/project/');
                setProjects(projectsResponse.data);

                // Récupérer les donateurs (nécessaire uniquement pour les transactions de revenus)
                if (watchTransactionType === 'income') {
                    fetchDonors();
                }

                // Récupérer les destinataires non-membres (pour les transactions de dépenses)
                if (watchTransactionType === 'expense') {
                    try {
                        const nonMembersResponse = await AxiosInstance.get('/api/non-members/');
                        setNonMemberRecipients(nonMembersResponse.data);
                    } catch (err) {
                        // Si le point de terminaison n'existe pas ou échoue, nous laisserons simplement la liste vide
                        console.warn('Impossible de récupérer les destinataires non-membres', err);
                        setNonMemberRecipients([]);
                    }
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des données:', error);
            }
        };

        fetchData();
    }, [watchTransactionType]);

    // Actualiser les donateurs si un nouveau a été ajouté
    useEffect(() => {
        if (newDonorAdded) {
            fetchDonors();
            setNewDonorAdded(false);
        }
    }, [newDonorAdded]);

    // Charger les allocations budgétaires lorsqu'un projet est sélectionné
    useEffect(() => {
        const fetchBudgetAllocations = async () => {
            if (!watchProject) {
                setBudgetAllocations([]);
                setValue('budget_allocation', null);
                return;
            }

            try {
                // Afficher l'état de chargement pendant la récupération
                setBudgetAllocationsLoading(true);

                // Récupérer les allocations budgétaires pour le projet sélectionné
                const response = await AxiosInstance.get('/finances/budget-allocations/', {
                    params: { project: watchProject }
                });

                console.log("Allocations budgétaires récupérées:", response.data);

                // S'assurer que nous avons des données valides
                if (response.data && Array.isArray(response.data)) {
                    setBudgetAllocations(response.data);
                } else {
                    console.error("Format de données d'allocation budgétaire inattendu:", response.data);
                    setBudgetAllocations([]);
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des allocations budgétaires:', error);
                setBudgetAllocations([]);
            } finally {
                setBudgetAllocationsLoading(false);
            }
        };

        fetchBudgetAllocations();
    }, [watchProject, setValue]);

    // Actualisation manuelle des allocations budgétaires
    const handleRefreshBudgetAllocations = () => {
        if (watchProject) {
            // Réinitialiser la sélection actuelle
            setValue('budget_allocation', null);

            // Récupérer à nouveau les allocations budgétaires
            const fetchBudgetAllocations = async () => {
                try {
                    setBudgetAllocationsLoading(true);

                    const response = await AxiosInstance.get('/finances/budget-allocations/', {
                        params: { project: watchProject }
                    });

                    console.log("Allocations budgétaires actualisées:", response.data);

                    if (response.data && Array.isArray(response.data)) {
                        setBudgetAllocations(response.data);
                    } else {
                        console.error("Format de données d'allocation budgétaire inattendu:", response.data);
                        setBudgetAllocations([]);
                    }
                } catch (error) {
                    console.error('Erreur lors de l\'actualisation des allocations budgétaires:', error);
                    setBudgetAllocations([]);
                } finally {
                    setBudgetAllocationsLoading(false);
                }
            };

            fetchBudgetAllocations();
        }
    };

    // Mettre à jour le formulaire lorsque la catégorie de revenu change
    useEffect(() => {
        // Si passage à une catégorie de revenu sans projet, effacer le champ de projet
        if (watchTransactionType === 'income' && nonProjectIncomeCategories.includes(watchCategory)) {
            setValue('project', null);
        }

        // Effacer le champ donateur lors du passage à membership_fee
        if (watchTransactionType === 'income' && watchCategory === 'membership_fee') {
            setValue('donor', null);
        }
    }, [watchCategory, watchTransactionType, setValue]);

    // Réinitialiser le formulaire lorsque la modale s'ouvre
    useEffect(() => {
        if (open) {
            reset({
                transaction_type: type,
                category: '',
                amount: '',
                description: '',
                date: dayjs(),
                project: null,
                budget_allocation: null,
                donor: null,
                paid_to: '',
                paid_to_notes: '',
                reference_number: '',
                recipient_type: '',
                is_project_wide: false
            });
            setSelectedFile(null);
            setFileError('');
            setSubmitError('');
            setRecipientType('');
            setCustomRecipient('');
            setRecipientNotes('');
            setIsProjectWide(false);
            setDonorTypeFilter('all');
            setBudgetAllocations([]);
        }
    }, [open, type, reset]);

    // Gérer la sélection de fichier
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Valider la taille du fichier (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setFileError('La taille du fichier dépasse la limite de 10MB');
            setSelectedFile(null);
            return;
        }

        // Valider le type de fichier
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            setFileError('Seuls les fichiers PDF, JPEG et PNG sont autorisés');
            setSelectedFile(null);
            return;
        }

        setSelectedFile(file);
        setFileError('');
    };

    // Supprimer le fichier sélectionné
    const handleRemoveFile = () => {
        setSelectedFile(null);
    };

    // Gérer le changement de type de destinataire
    const handleRecipientTypeChange = (e) => {
        const newRecipientType = e.target.value;
        setRecipientType(newRecipientType);
        setValue('recipient_type', newRecipientType);

        // Réinitialiser le champ paid_to lors du changement de types de destinataires
        setValue('paid_to', '');

        // Réinitialiser les notes lors du changement depuis non_member
        if (newRecipientType !== 'non_member') {
            setValue('paid_to_notes', '');
            setRecipientNotes('');
        }
    };

    // Gérer la sélection d'un membre de l'équipe
    const handleTeamMemberChange = (event) => {
        setValue('paid_to', event.target.value);
    };

    // Gérer la sélection d'un non-membre
    const handleNonMemberChange = (event) => {
        setValue('paid_to', event.target.value);
    };

    // Gérer la saisie d'un destinataire personnalisé
    const handleCustomRecipientChange = (e) => {
        setCustomRecipient(e.target.value);
        setValue('paid_to', e.target.value);
    };

    // Gérer le changement des notes du destinataire
    const handleRecipientNotesChange = (e) => {
        setRecipientNotes(e.target.value);
        setValue('paid_to_notes', e.target.value);
    };

    // Gérer le basculement à l'échelle du projet
    const handleProjectWideChange = (e) => {
        const isChecked = e.target.checked;
        setIsProjectWide(isChecked);
        setValue('is_project_wide', isChecked);

        // Si ce n'est pas à l'échelle du projet, nous n'exigeons pas de sélection de projet
        if (!isChecked && !watchProject) {
            setValue('project', null);
        }
    };

    // Déterminer si le donateur est requis en fonction de la catégorie de revenu
    const isDonorRequired =
        watchTransactionType === 'income' &&
        watchCategory === 'donation'; // Exiger un donateur uniquement pour la catégorie donation

    // Gestionnaire de soumission du formulaire
    const onSubmit = async (data) => {
        setLoading(true);
        setSubmitError('');

        try {
            // Créer l'objet FormData
            const formData = new FormData();

            // Ajouter les données du formulaire
            formData.append('transaction_type', data.transaction_type);
            formData.append('category', data.category);
            formData.append('amount', data.amount);
            formData.append('description', data.description);
            formData.append('date', dayjs(data.date).format('YYYY-MM-DD'));

            // Inclure le projet uniquement s'il est sélectionné
            if (data.project !== null) {
                formData.append('project', data.project);
            }

            // Ajouter budget_allocation si sélectionné
            if (data.budget_allocation !== null) {
                formData.append('budget_allocation', data.budget_allocation);
            }

            // Pour les transactions de revenus, toujours inclure le champ donateur si disponible
            if (data.transaction_type === 'income') {
                if (data.donor !== null) {
                    console.log("Ajout de l'ID de donateur à la requête:", data.donor);
                    formData.append('donor', data.donor);
                }
            }
            // Pour les transactions de dépenses avec un destinataire
            else if (data.transaction_type === 'expense' && data.paid_to) {
                // Traitement amélioré basé sur le type de destinataire
                switch(data.recipient_type) {
                    case 'team_member':
                        // Pour les membres de l'équipe, nous pourrions avoir une API pour trouver leur ID
                        // Pour l'instant, ajouter à la description
                        const teamMemberDescription = `${data.description} (Payé au membre de l'équipe: ${data.paid_to})`;
                        formData.set('description', teamMemberDescription);

                        // Si vous avez un ID de membre d'équipe, vous pourriez l'utiliser ici
                        // formData.append('team_member_id', teamMemberId);
                        break;

                    case 'non_member':
                        // Pour les non-membres, inclure à la fois le nom et les notes
                        const nonMemberDescription = `${data.description} (Payé à: ${data.paid_to})`;
                        formData.set('description', nonMemberDescription);

                        // Ajouter les notes comme un champ séparé si votre API le prend en charge
                        if (data.paid_to_notes) {
                            formData.append('recipient_notes', data.paid_to_notes);
                        }
                        break;

                    default:
                        // Pour les autres types de destinataires (CNSS, vendeurs, etc.)
                        const recipientDescription = `${data.description} (Payé à ${data.recipient_type}: ${data.paid_to})`;
                        formData.set('description', recipientDescription);
                }

                // Vous pourriez également stocker le type de destinataire dans un champ personnalisé
                formData.append('recipient_type', data.recipient_type);
                formData.append('paid_to', data.paid_to);

                // Indiquer si c'est une dépense à l'échelle du projet
                formData.append('is_project_wide', data.is_project_wide ? '1' : '0');
            }

            if (data.reference_number) {
                formData.append('reference_number', data.reference_number);
            }

            // Ajouter le fichier s'il est sélectionné
            if (selectedFile) {
                formData.append('document', selectedFile);
            }

            // Journaliser les entrées FormData pour le débogage
            console.log("Soumission de la transaction avec les données:");
            for (let [key, value] of formData.entries()) {
                console.log(key, value);
            }

            // Soumettre le formulaire
            const response = await AxiosInstance.post('/finances/transactions/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log("Transaction enregistrée avec succès:", response.data);

            // Appeler le callback de succès
            onSuccess();
        } catch (error) {
            console.error('Erreur lors de la soumission de la transaction:', error);
            setSubmitError(
                error.response?.data?.detail ||
                'Une erreur s\'est produite lors de l\'enregistrement de la transaction. Veuillez réessayer.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Rendre le champ de destinataire en fonction du type de transaction
    const renderRecipientField = () => {
        if (watchTransactionType === 'income') {
            // Pour les transactions de revenus, afficher la sélection de donateur avec filtres de type de donateur
            // Mais UNIQUEMENT si ce n'est pas un membership_fee
            if (watchCategory === 'membership_fee') {
                // Pour les cotisations, ne pas afficher de champ donateur
                return (
                    <Typography variant="body2" color="text.secondary">
                        Les cotisations ne nécessitent pas d'association de donateur
                    </Typography>
                );
            }

            return (
                <>
                    {/* Afficher le filtre de type de donateur uniquement pour la catégorie donation */}
                    {watchCategory === 'donation' && (
                        <Grid item xs={12} sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Type de Donateur
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <Button
                                    variant={donorTypeFilter === 'all' ? "contained" : "outlined"}
                                    startIcon={<PersonOutline />}
                                    size="small"
                                    onClick={() => setDonorTypeFilter('all')}
                                >
                                    Tous les Donateurs
                                </Button>
                                <Button
                                    variant={donorTypeFilter === 'member' ? "contained" : "outlined"}
                                    startIcon={<People />}
                                    size="small"
                                    color="primary"
                                    onClick={() => setDonorTypeFilter('member')}
                                >
                                    Membres
                                </Button>
                                <Button
                                    variant={donorTypeFilter === 'internal' ? "contained" : "outlined"}
                                    startIcon={<Business />}
                                    size="small"
                                    color="secondary"
                                    onClick={() => setDonorTypeFilter('internal')}
                                >
                                    Internes
                                </Button>
                                <Button
                                    variant={donorTypeFilter === 'external' ? "contained" : "outlined"}
                                    startIcon={<Person />}
                                    size="small"
                                    onClick={() => setDonorTypeFilter('external')}
                                >
                                    Externes
                                </Button>
                            </Box>
                        </Grid>
                    )}

                    <Controller
                        name="donor"
                        control={control}
                        render={({ field: { onChange, value } }) => (
                            <Autocomplete
                                options={filterDonorsByType(donors, donorTypeFilter)}
                                getOptionLabel={(option) => getDonorLabel(option)}
                                value={donors.find(donor => donor.id === value) || null}
                                onChange={(_, newValue) => {
                                    onChange(newValue ? newValue.id : null);
                                    console.log("Donateur sélectionné:", newValue ? newValue.id : null);
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={isDonorRequired ? "Donateur (Requis)" : "Donateur"}
                                        error={!!errors.donor}
                                        helperText={errors.donor?.message}
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (
                                                <>
                                                    <InputAdornment position="start">
                                                        <Person />
                                                    </InputAdornment>
                                                    {params.InputProps.startAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        )}
                    />

                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            size="small"
                            startIcon={<Add />}
                            onClick={handleAddDonor}
                        >
                            Ajouter un Nouveau Donateur
                        </Button>
                    </Box>
                </>
            );
        } else {
            // Pour les transactions de dépenses, afficher la sélection de type de destinataire et les champs conditionnels
            return (
                <>
                    <Controller
                        name="recipient_type"
                        control={control}
                        render={({ field }) => (
                            <FormControl fullWidth error={!!errors.recipient_type}>
                                <InputLabel>Type de Destinataire</InputLabel>
                                <Select
                                    {...field}
                                    label="Type de Destinataire"
                                    onChange={(e) => handleRecipientTypeChange(e)}
                                >
                                    <MenuItem value="">
                                        <em>Sélectionner le type de destinataire</em>
                                    </MenuItem>
                                    {commonExpenseRecipients.map((recipient) => (
                                        <MenuItem key={recipient.id} value={recipient.id}>
                                            {recipient.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.recipient_type && (
                                    <FormHelperText>{errors.recipient_type.message}</FormHelperText>
                                )}
                            </FormControl>
                        )}
                    />

                    {watchRecipientType === 'team_member' && (
                        <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>Membre de l'Équipe</InputLabel>
                            <Select
                                value={watch('paid_to') || ''}
                                onChange={handleTeamMemberChange}
                                label="Membre de l'Équipe"
                                error={!!errors.paid_to}
                            >
                                <MenuItem value="">
                                    <em>Sélectionner un membre de l'équipe</em>
                                </MenuItem>
                                {teamMembers.map((member) => (
                                    <MenuItem key={member.id} value={member.name}>
                                        {member.name}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.paid_to && (
                                <FormHelperText error>{errors.paid_to.message}</FormHelperText>
                            )}
                            {teamMembers.length === 0 && (
                                <FormHelperText>Aucun membre d'équipe trouvé. Veuillez vérifier la connexion API.</FormHelperText>
                            )}
                        </FormControl>
                    )}

                    {watchRecipientType === 'non_member' && (
                        <>
                            <TextField
                                fullWidth
                                label="Nom du Destinataire"
                                value={watch('paid_to') || ''}
                                onChange={handleCustomRecipientChange}
                                error={!!errors.paid_to}
                                helperText={errors.paid_to?.message}
                                sx={{ mt: 2 }}
                            />
                            <TextField
                                fullWidth
                                label="Notes sur le Destinataire (Requis)"
                                value={recipientNotes}
                                onChange={handleRecipientNotesChange}
                                error={!!errors.paid_to_notes}
                                helperText={errors.paid_to_notes?.message || "Veuillez fournir des détails sur ce destinataire non-membre"}
                                multiline
                                rows={2}
                                sx={{ mt: 2 }}
                            />
                        </>
                    )}

                    {watchRecipientType === 'other' && (
                        <TextField
                            fullWidth
                            label="Nom du Destinataire"
                            value={customRecipient}
                            onChange={handleCustomRecipientChange}
                            error={!!errors.paid_to}
                            helperText={errors.paid_to?.message}
                            sx={{ mt: 2 }}
                        />
                    )}


                </>
            );
        }
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={loading ? undefined : onClose}
                maxWidth="md"
                fullWidth
            >
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogTitle>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Typography variant="h6">
                                {watchTransactionType === 'income' ? 'Ajouter un Revenu' : 'Ajouter une Dépense'}
                            </Typography>
                            <IconButton onClick={onClose} disabled={loading}>
                                <Close />
                            </IconButton>
                        </Box>
                    </DialogTitle>

                    <DialogContent dividers>
                        {submitError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {submitError}
                            </Alert>
                        )}

                        <Grid container spacing={2}>
                            {/* Type de Transaction */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="transaction_type"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl fullWidth error={!!errors.transaction_type}>
                                            <InputLabel>Type de Transaction</InputLabel>
                                            <Select
                                                {...field}
                                                label="Type de Transaction"
                                            >
                                                <MenuItem value="income">Revenu</MenuItem>
                                                <MenuItem value="expense">Dépense</MenuItem>
                                            </Select>
                                            {errors.transaction_type && (
                                                <FormHelperText>{errors.transaction_type.message}</FormHelperText>
                                            )}
                                        </FormControl>
                                    )}
                                />
                            </Grid>

                            {/* Catégorie */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="category"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl fullWidth error={!!errors.category}>
                                            <InputLabel>Catégorie</InputLabel>
                                            <Select
                                                {...field}
                                                label="Catégorie"
                                            >
                                                <MenuItem value="">
                                                    <em>Sélectionner une catégorie</em>
                                                </MenuItem>
                                                {watchTransactionType === 'income'
                                                    ? incomeCategories.map((cat) => (
                                                        <MenuItem key={cat.value} value={cat.value}>
                                                            {cat.label}
                                                        </MenuItem>
                                                    ))
                                                    : expenseCategories.map((cat) => (
                                                        <MenuItem key={cat.value} value={cat.value}>
                                                            {cat.label}
                                                        </MenuItem>
                                                    ))
                                                }
                                            </Select>
                                            {errors.category && (
                                                <FormHelperText>{errors.category.message}</FormHelperText>
                                            )}
                                        </FormControl>
                                    )}
                                />
                            </Grid>

                            {/* Montant */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="amount"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Montant"
                                            fullWidth
                                            error={!!errors.amount}
                                            helperText={errors.amount?.message}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <AttachMoney />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            type="number"
                                            step="0.01"
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Date */}
                            <Grid item xs={12} sm={6}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <Controller
                                        name="date"
                                        control={control}
                                        render={({ field }) => (
                                            <DatePicker
                                                label="Date"
                                                value={field.value}
                                                onChange={field.onChange}
                                                slotProps={{
                                                    textField: {
                                                        fullWidth: true,
                                                        error: !!errors.date,
                                                        helperText: errors.date?.message,
                                                    },
                                                }}
                                            />
                                        )}
                                    />
                                </LocalizationProvider>
                            </Grid>

                            {/* Description */}
                            <Grid item xs={12}>
                                <Controller
                                    name="description"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Description"
                                            fullWidth
                                            multiline
                                            rows={2}
                                            error={!!errors.description}
                                            helperText={errors.description?.message}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Description />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                            {/* Case à cocher pour dépense à l'échelle du projet - afficher uniquement pour les transactions de dépenses */}
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={isProjectWide}
                                        onChange={handleProjectWideChange}
                                        name="is_project_wide"
                                    />
                                }
                                label="Cette dépense s'applique à l'ensemble du projet"
                                sx={{ mt: 2, display: 'block' }}
                            />
                            {/* Sélection de projet - conditionnelle basée sur le type de transaction et la catégorie */}
                            {(isProjectRequired || (!nonProjectIncomeCategories.includes(watchCategory) && watchTransactionType === 'income') || watchIsProjectWide) && (
                                <Grid item xs={12}>
                                    <Controller
                                        name="project"
                                        control={control}
                                        render={({ field: { onChange, value } }) => (
                                            <Autocomplete
                                                options={projects}
                                                getOptionLabel={(option) => option.name || ''}
                                                value={projects.find(p => p.id === value) || null}
                                                onChange={(_, newValue) => {
                                                    onChange(newValue ? newValue.id : null);
                                                }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label={isProjectRequired ? "Projet (Requis)" : "Projet"}
                                                        error={!!errors.project}
                                                        helperText={errors.project?.message}
                                                        InputProps={{
                                                            ...params.InputProps,
                                                            startAdornment: (
                                                                <>
                                                                    <InputAdornment position="start">
                                                                        <Business />
                                                                    </InputAdornment>
                                                                    {params.InputProps.startAdornment}
                                                                </>
                                                            ),
                                                        }}
                                                    />
                                                )}
                                            />
                                        )}
                                    />
                                </Grid>
                            )}

                            <Grid item xs={12}>
                                {renderRecipientField()}
                            </Grid>

                            {/* Numéro de Référence */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="reference_number"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Numéro de Référence"
                                            fullWidth
                                            error={!!errors.reference_number}
                                            helperText={errors.reference_number?.message || "Optionnel: Facture, reçu ou autre numéro de référence"}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Receipt />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Pièce jointe */}
                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle1" gutterBottom>
                                    Joindre Documentation
                                </Typography>

                                {selectedFile ? (
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        p: 2,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 1
                                    }}>
                                        <AttachFile sx={{ mr: 1 }} />
                                        <Typography variant="body2" sx={{ flexGrow: 1 }}>
                                            {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                                        </Typography>
                                        <IconButton size="small" onClick={handleRemoveFile}>
                                            <Delete />
                                        </IconButton>
                                    </Box>
                                ) : (
                                    <>
                                        <Button
                                            component="label"
                                            variant="outlined"
                                            startIcon={<UploadFile />}
                                            sx={{ mb: 1 }}
                                        >
                                            Télécharger un Document
                                            <input
                                                type="file"
                                                hidden
                                                accept=".pdf,.png,.jpg,.jpeg"
                                                onChange={handleFileChange}
                                            />
                                        </Button>
                                        <Typography variant="caption" display="block" color="text.secondary">
                                            Formats acceptés: PDF, PNG, JPEG (max 10MB)
                                        </Typography>
                                    </>
                                )}

                                {fileError && (
                                    <Typography variant="caption" color="error">
                                        {fileError}
                                    </Typography>
                                )}
                            </Grid>
                        </Grid>
                    </DialogContent>

                    <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
                        <Button onClick={onClose} disabled={loading}>
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : null}
                        >
                            {loading ? 'Enregistrement...' : 'Enregistrer la Transaction'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Dialogue de Formulaire de Donateur */}
            <DonorForm
                open={donorFormOpen}
                onClose={() => setDonorFormOpen(false)}
                onSuccess={handleDonorFormSuccess}
            />
        </>
    );
};

export default TransactionForm;