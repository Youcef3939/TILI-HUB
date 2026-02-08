import { useState, useEffect } from 'react';
import {
    Box, Typography, Button, CircularProgress, Snackbar, Alert,
    Chip, Stack, Card, CardContent
} from "@mui/material";
import { useForm } from 'react-hook-form';
import AxiosInstance from './Axios.jsx';
import Dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { styled, useTheme, alpha } from '@mui/material/styles';

// Form Fields
import MyDatePickerField from "./forms/MyDatePickerField.jsx";
import MyTextField from "./forms/MyTextField.jsx";
import MyMultilineField from "./forms/MyMultilineField.jsx";
import MySelectField from "./forms/MySelectField.jsx";

// Icons
import BusinessIcon from '@mui/icons-material/Business';
import DescriptionIcon from '@mui/icons-material/Description';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventIcon from '@mui/icons-material/Event';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// ============================================================================
// STYLED COMPONENTS (Matching Home.jsx style)
// ============================================================================

const PageContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(3),
    [theme.breakpoints.down('md')]: {
        padding: theme.spacing(2),
    },
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(1.5),
    },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
    fontWeight: 700,
    marginBottom: theme.spacing(2.5),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    color: theme.palette.text.primary,
    fontSize: '1.25rem',
    letterSpacing: '-0.5px',

    '& svg': {
        color: theme.palette.primary.main,
        width: 28,
        height: 28,
    },
}));

const FormCard = styled(Card)(({ theme }) => ({
    borderRadius: theme.shape.borderRadius * 2,
    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
    transition: `all 300ms cubic-bezier(0.4, 0, 0.2, 1)`,
    overflow: 'hidden',

    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[8],
        borderColor: theme.palette.primary.main,
    },
}));

const FormBox = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(3),
    '& .MuiFormControl-root': {
        width: '100%',
    },
    [theme.breakpoints.down('sm')]: {
        marginBottom: theme.spacing(2.5),
    },
}));

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CreateProject = () => {
    const navigate = useNavigate();
    const theme = useTheme();

    // State
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(true);

    // Fetch members
    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const response = await AxiosInstance.get('api/member/');
                setMembers(response.data);
            } catch (err) {
                console.error('Error fetching members:', err);
            } finally {
                setLoadingMembers(false);
            }
        };
        fetchMembers();
    }, []);

    // Validation schema
    const schema = yup.object({
        name: yup.string().required('Le nom du projet est requis').min(3, 'Au moins 3 caractères'),
        description: yup.string().required('La description est requise').min(10, 'Au moins 10 caractères'),
        budget: yup.number()
            .typeError('Le budget doit être un nombre')
            .positive('Le budget doit être positif')
            .required('Le budget est requis'),
        start_date: yup.date().required('La date de début est requise'),
        end_date: yup.date()
            .required('La date de fin est requise')
            .min(yup.ref('start_date'), 'La date de fin doit être après la date de début'),
        status: yup.string().required('Le statut est requis'),
        priority: yup.string().required('La priorité est requise'),
        responsible: yup.string().nullable(),
    });

    const { handleSubmit, control, formState: { errors, isValid } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: '',
            description: '',
            budget: '',
            start_date: null,
            end_date: null,
            status: 'Non commencé',
            priority: 'medium',
            responsible: '',
        },
        mode: 'onChange'
    });

    // Form submission
    const onSubmit = async (data) => {
        setCreating(true);
        setError(null);

        try {
            await AxiosInstance.post('api/project/', {
                name: data.name,
                description: data.description,
                budget: parseFloat(data.budget),
                start_date: data.start_date ? Dayjs(data.start_date).format('YYYY-MM-DD') : null,
                end_date: data.end_date ? Dayjs(data.end_date).format('YYYY-MM-DD') : null,
                status: data.status,
                priority: data.priority,
                responsible: data.responsible || null,
            });

            setSuccess(true);
            setTimeout(() => {
                navigate('/projects', {
                    state: {
                        success: true,
                        message: `Projet "${data.name}" créé avec succès`
                    }
                });
            }, 1500);
        } catch (err) {
            console.error('Error creating project:', err);
            setError(err.response?.data?.message || 'Erreur lors de la création du projet');
        } finally {
            setCreating(false);
        }
    };

    const statusOptions = [
        { value: "Non commencé", label: "Non commencé" },
        { value: "En cours", label: "En cours" },
        { value: "Terminé", label: "Terminé" },
        { value: "En pause", label: "En pause" },
        { value: "Annulé", label: "Annulé" },
    ];

    const priorityOptions = [
        { value: "low", label: "Basse" },
        { value: "medium", label: "Moyenne" },
        { value: "high", label: "Haute" },
        { value: "urgent", label: "Urgente" },
    ];

    const memberOptions = members.map(member => ({
        value: member.id.toString(),
        label: member.name
    }));

    return (
        <PageContainer>
            <Box sx={{ maxWidth: 900, margin: '0 auto' }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Box>
                        <SectionTitle>
                            <AddIcon />
                            Créer un nouveau projet
                        </SectionTitle>
                        <Typography variant="body2" color="text.secondary">
                            Complétez le formulaire pour démarrer un nouveau projet
                        </Typography>
                    </Box>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/projects')}
                        sx={{
                            color: theme.palette.text.secondary,
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                            }
                        }}
                    >
                        Retour
                    </Button>
                </Box>

                {error ? (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                        {error}
                    </Alert>
                ) : null}

                {/* Main Form Card */}
                <FormCard>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Stack spacing={3}>
                                {/* Section 1: Basic Info */}
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <BusinessIcon color="primary" />
                                        Informations générales
                                    </Typography>

                                    <Stack spacing={2}>
                                        <FormBox>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <BusinessIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
                                                <Typography variant="subtitle2" fontWeight={600}>Nom du projet</Typography>
                                            </Box>
                                            <MyTextField
                                                name="name"
                                                control={control}
                                                placeholder="Entrez le nom du projet"
                                                error={!!errors.name}
                                                helperText={errors.name?.message}
                                            />
                                        </FormBox>

                                        <FormBox>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <DescriptionIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
                                                <Typography variant="subtitle2" fontWeight={600}>Description</Typography>
                                            </Box>
                                            <MyMultilineField
                                                name="description"
                                                control={control}
                                                placeholder="Décrivez votre projet..."
                                                rows={4}
                                                error={!!errors.description}
                                                helperText={errors.description?.message}
                                            />
                                        </FormBox>
                                    </Stack>
                                </Box>

                                <Box sx={{ height: 1, backgroundColor: alpha(theme.palette.divider, 0.3) }} />

                                {/* Section 2: Dates & Budget */}
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CalendarTodayIcon color="primary" />
                                        Dates et Budget
                                    </Typography>

                                    <Stack spacing={2}>
                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                            <FormBox sx={{ flex: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <CalendarTodayIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
                                                    <Typography variant="subtitle2" fontWeight={600}>Date de début</Typography>
                                                </Box>
                                                <MyDatePickerField
                                                    name="start_date"
                                                    control={control}
                                                    error={!!errors.start_date}
                                                    helperText={errors.start_date?.message}
                                                />
                                            </FormBox>

                                            <FormBox sx={{ flex: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <EventIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
                                                    <Typography variant="subtitle2" fontWeight={600}>Date de fin</Typography>
                                                </Box>
                                                <MyDatePickerField
                                                    name="end_date"
                                                    control={control}
                                                    error={!!errors.end_date}
                                                    helperText={errors.end_date?.message}
                                                />
                                            </FormBox>
                                        </Stack>

                                        <FormBox>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <AttachMoneyIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
                                                <Typography variant="subtitle2" fontWeight={600}>Budget (TND)</Typography>
                                            </Box>
                                            <MyTextField
                                                name="budget"
                                                control={control}
                                                placeholder="0.00"
                                                type="number"
                                                error={!!errors.budget}
                                                helperText={errors.budget?.message}
                                            />
                                        </FormBox>
                                    </Stack>
                                </Box>

                                <Box sx={{ height: 1, backgroundColor: alpha(theme.palette.divider, 0.3) }} />

                                {/* Section 3: Status & Priority */}
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <PriorityHighIcon color="primary" />
                                        Statut et Priorité
                                    </Typography>

                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                        <FormBox sx={{ flex: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <InfoOutlinedIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
                                                <Typography variant="subtitle2" fontWeight={600}>Statut initial</Typography>
                                            </Box>
                                            <MySelectField
                                                name="status"
                                                control={control}
                                                options={statusOptions}
                                                error={!!errors.status}
                                                helperText={errors.status?.message}
                                            />
                                        </FormBox>

                                        <FormBox sx={{ flex: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <PriorityHighIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
                                                <Typography variant="subtitle2" fontWeight={600}>Priorité</Typography>
                                            </Box>
                                            <MySelectField
                                                name="priority"
                                                control={control}
                                                options={priorityOptions}
                                                error={!!errors.priority}
                                                helperText={errors.priority?.message}
                                            />
                                        </FormBox>
                                    </Stack>
                                </Box>

                                <Box sx={{ height: 1, backgroundColor: alpha(theme.palette.divider, 0.3) }} />

                                {/* Section 4: Responsible */}
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <PersonIcon color="primary" />
                                        Responsable (Optionnel)
                                    </Typography>

                                    <FormBox>
                                        {loadingMembers ? (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                                <CircularProgress size={24} />
                                            </Box>
                                        ) : (
                                            <>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <PersonIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
                                                    <Typography variant="subtitle2" fontWeight={600}>Sélectionnez un responsable</Typography>
                                                </Box>
                                                <MySelectField
                                                    name="responsible"
                                                    control={control}
                                                    options={memberOptions}
                                                    error={!!errors.responsible}
                                                    helperText={errors.responsible?.message}
                                                />
                                            </>
                                        )}
                                    </FormBox>

                                    <Chip
                                        icon={<InfoOutlinedIcon />}
                                        label="Le responsable sera notifié et aura accès au projet"
                                        color="info"
                                        variant="outlined"
                                        sx={{ width: '100%', height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal', p: 1 } }}
                                    />
                                </Box>

                                {/* Action Buttons */}
                                <Stack
                                    direction={{ xs: 'column', sm: 'row' }}
                                    spacing={2}
                                    sx={{ justifyContent: 'flex-end', pt: 2 }}
                                >
                                    <Button
                                        variant="outlined"
                                        onClick={() => navigate('/projects')}
                                        sx={{ minWidth: { sm: 120 } }}
                                    >
                                        Annuler
                                    </Button>

                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        disabled={!isValid || creating}
                                        startIcon={creating ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                                        sx={{
                                            minWidth: { sm: 150 },
                                            minHeight: 44,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {creating ? 'Création...' : 'Créer le projet'}
                                    </Button>
                                </Stack>
                            </Stack>
                        </form>
                    </CardContent>
                </FormCard>

                {/* Info Alert */}
                <Alert
                    icon={<InfoOutlinedIcon />}
                    severity="info"
                    sx={{ mt: 3, borderRadius: 2 }}
                >
                    <Typography variant="subtitle2" fontWeight={600}>
                        Conseil: Remplissez tous les champs obligatoires pour créer votre projet
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Vous pourrez modifier tous les détails après la création du projet
                    </Typography>
                </Alert>
            </Box>

            {/* Notifications */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="error" onClose={() => setError(null)} sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar
                open={success}
                autoHideDuration={3000}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity="success"
                    icon={<CheckCircleIcon />}
                    sx={{ width: '100%' }}
                >
                    Projet créé avec succès!
                </Alert>
            </Snackbar>
        </PageContainer>
    );
};

export default CreateProject;

