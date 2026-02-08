import { useState, useEffect } from 'react';
import {
    Box, Typography, Button, CircularProgress, Snackbar, Alert, Container,
    Chip, useMediaQuery, Tabs, Tab, Fade, Stack, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, LinearProgress, Slider, Paper
} from "@mui/material";
import { useForm } from 'react-hook-form';
import AxiosInstance from './Axios.jsx';
import Dayjs from "dayjs";
import { useNavigate, useParams } from "react-router-dom";
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
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import PersonIcon from '@mui/icons-material/Person';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AssignmentIcon from '@mui/icons-material/Assignment';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const FormContainer = styled(Paper)(({ theme }) => ({
    borderRadius: theme.shape.borderRadius * 2,
    padding: theme.spacing(3),
    boxShadow: theme.shadows[2],
    backgroundColor: theme.palette.background.paper,
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(2),
    },
}));

const HeaderContainer = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    padding: theme.spacing(2, 3),
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(3),
    display: 'flex',
    alignItems: 'center',
    boxShadow: theme.shadows[3],
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(2),
        marginBottom: theme.spacing(2),
    },
}));

const SaveButton = styled(Button)(({ theme }) => ({
    minHeight: 44,
    minWidth: 120,
    borderRadius: theme.shape.borderRadius,
    fontWeight: 600,
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows[4],
    },
    [theme.breakpoints.down('sm')]: {
        minHeight: 48,
        width: '100%',
    },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
    textTransform: 'none',
    fontWeight: 500,
    fontSize: '0.9rem',
    minHeight: 48,
    borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
    '&.Mui-selected': {
        color: theme.palette.primary.main,
        fontWeight: 600,
    },
    [theme.breakpoints.down('sm')]: {
        fontSize: '0.85rem',
        minHeight: 52,
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

const ProgressCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2.5),
    borderRadius: theme.shape.borderRadius * 2,
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.success.main, 0.05)})`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
    marginBottom: theme.spacing(2.5),
}));

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const EditProject = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('Opération réussie!');
    const [tabValue, setTabValue] = useState(0);
    const [projectData, setProjectData] = useState(null);
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(true);

    // Progress and Report state
    const [openProgressDialog, setOpenProgressDialog] = useState(false);
    const [newProgress, setNewProgress] = useState(0);
    const [progressNotes, setProgressNotes] = useState('');
    const [updatingProgress, setUpdatingProgress] = useState(false);
    const [openReportDialog, setOpenReportDialog] = useState(false);
    const [reportNotes, setReportNotes] = useState('');
    const [generatingReport, setGeneratingReport] = useState(false);

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
        name: yup.string().required('Le nom est requis'),
        budget: yup.number()
            .typeError('Le budget doit être un nombre')
            .positive('Le budget doit être un nombre positif')
            .required('Le budget est requis'),
        start_date: yup.date().required('La date de début est requise'),
        end_date: yup.date()
            .required('La date de fin est requise')
            .min(yup.ref('start_date'), 'La date de fin doit être postérieure à la date de début'),
        status: yup.string().required('Le statut est requis'),
        description: yup.string().required('La description est requise'),
        priority: yup.string().required('La priorité est requise'),
        responsible: yup.string().nullable(),
    });

    const { handleSubmit, control, setValue, formState: { errors, isValid, isDirty } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: '',
            description: '',
            budget: '',
            status: '',
            start_date: null,
            end_date: null,
            priority: 'medium',
            responsible: '',
        },
        mode: 'onChange'
    });

    // Fetch project data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await AxiosInstance.get(`/api/project/${id}/`);
                const data = response.data;

                setValue("name", data.name);
                setValue("description", data.description);
                setValue("budget", data.budget);
                setValue("status", data.status);
                setValue("start_date", data.start_date ? Dayjs(data.start_date) : null);
                setValue("end_date", data.end_date ? Dayjs(data.end_date) : null);
                setValue("priority", data.priority || 'medium');
                setValue("responsible", data.responsible ? data.responsible.toString() : '');

                setProjectData(data);
                setNewProgress(data.progress_percentage || 0);
            } catch (err) {
                console.error('Error fetching project:', err);
                setError('Échec du chargement des données du projet. Veuillez réessayer.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, setValue]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Form submission
    const onSubmit = async (data) => {
        setSaving(true);
        setError(null);

        try {
            await AxiosInstance.put(`/api/project/${id}/`, {
                name: data.name,
                start_date: data.start_date ? Dayjs(data.start_date).format('YYYY-MM-DD') : null,
                end_date: data.end_date ? Dayjs(data.end_date).format('YYYY-MM-DD') : null,
                description: data.description,
                status: data.status,
                budget: parseFloat(data.budget),
                priority: data.priority,
                responsible: data.responsible || null,
            });

            setSuccessMessage(`Projet "${data.name}" mis à jour avec succès!`);
            setSuccess(true);
            setTimeout(() => {
                navigate('/projects', {
                    state: {
                        success: true,
                        message: `Projet "${data.name}" a été mis à jour avec succès`
                    }
                });
            }, 1500);
        } catch (err) {
            console.error('Error updating project:', err);
            setError(err.response?.data?.message || 'Échec de la mise à jour du projet. Veuillez réessayer.');
        } finally {
            setSaving(false);
        }
    };

    // Update progress
    const handleUpdateProgress = async () => {
        setUpdatingProgress(true);
        try {
            await AxiosInstance.patch(`/api/project/${id}/`, {
                progress_percentage: newProgress,
            });
            setProjectData(prev => ({ ...prev, progress_percentage: newProgress }));
            setOpenProgressDialog(false);
            setProgressNotes('');
            setSuccessMessage('Progression mise à jour avec succès!');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Error updating progress:', err);
            setError('Erreur lors de la mise à jour de la progression');
        } finally {
            setUpdatingProgress(false);
        }
    };

    // ✅ UPDATED: Generate report with proper download
// ✅ FIXED: Generate report with proper backend URL
    const handleGenerateReport = async () => {
        setGeneratingReport(true);
        try {
            const response = await AxiosInstance.post(`/api/project/${id}/generate-report/`, {
                meeting_notes: reportNotes,
            });

            if (response.data && response.data.pdf_file) {
                // ✅ FIX: Prepend backend base URL if the path is relative
                let pdfUrl = response.data.pdf_file;

                // If the URL doesn't start with http, prepend the backend base URL
                if (!pdfUrl.startsWith('http')) {
                    // Get the base URL from AxiosInstance
                    const backendUrl = AxiosInstance.defaults.baseURL || 'http://127.0.0.1:8000';
                    pdfUrl = `${backendUrl}${pdfUrl}`;
                }

                // Open in new tab for immediate viewing
                window.open(pdfUrl, '_blank');

                // Also trigger download
                const link = document.createElement('a');
                link.href = pdfUrl;
                link.setAttribute('download', pdfUrl.split('/').pop());
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                setSuccessMessage('Rapport PDF généré et téléchargé avec succès!');
            } else {
                setSuccessMessage('Rapport créé avec succès!');
            }

            setOpenReportDialog(false);
            setReportNotes('');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Error generating report:', err);
            setError(err.response?.data?.error || 'Erreur lors de la génération du rapport');
        } finally {
            setGeneratingReport(false);
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

    const getProgressColor = (progress) => {
        if (progress >= 75) return 'success';
        if (progress >= 50) return 'warning';
        if (progress >= 25) return 'info';
        return 'error';
    };

    return (
        <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 }, py: 3 }}>
            <Box sx={{ maxWidth: 1000, margin: '0 auto' }}>
                <Button
                    onClick={() => navigate('/projects')}
                    startIcon={<ArrowBackIcon />}
                    sx={{
                        mb: 2,
                        color: theme.palette.text.secondary,
                        '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        }
                    }}
                >
                    Retour aux Projets
                </Button>

                <HeaderContainer>
                    <BusinessIcon sx={{ mr: 2, fontSize: 28 }} />
                    <Box>
                        <Typography variant="h5" component="h1" fontWeight="bold">
                            Modifier le projet
                        </Typography>
                        <Typography variant="subtitle2">
                            {projectData?.name ? `Modification: ${projectData.name}` : 'Mettre à jour les détails'}
                        </Typography>
                    </Box>
                </HeaderContainer>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress size={50} />
                    </Box>
                ) : error && !success ? (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                        {error}
                    </Alert>
                ) : (
                    <FormContainer elevation={0}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                            <Tabs
                                value={tabValue}
                                onChange={handleTabChange}
                                variant={isMobile ? "scrollable" : "standard"}
                                indicatorColor="primary"
                                textColor="primary"
                            >
                                <StyledTab label="Détails" icon={<BusinessIcon />} iconPosition="start" />
                                <StyledTab label="Dates & Budget" icon={<AttachMoneyIcon />} iconPosition="start" />
                                <StyledTab label="Gestion" icon={<PersonIcon />} iconPosition="start" />
                                <StyledTab label="Progression" icon={<TrendingUpIcon />} iconPosition="start" />
                            </Tabs>
                        </Box>

                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Box sx={{ mb: 3 }}>
                                {/* Tab 0: Project Details */}
                                <Fade in={tabValue === 0} unmountOnExit>
                                    <Box hidden={tabValue !== 0}>
                                        <Stack spacing={3}>
                                            <FormBox>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <BusinessIcon color="primary" sx={{ mr: 1 }} />
                                                    <Typography variant="subtitle2">Nom du projet</Typography>
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
                                                    <TaskAltIcon color="primary" sx={{ mr: 1 }} />
                                                    <Typography variant="subtitle2">Statut</Typography>
                                                </Box>
                                                <MySelectField
                                                    name="status"
                                                    control={control}
                                                    options={statusOptions}
                                                    error={!!errors.status}
                                                    helperText={errors.status?.message}
                                                />
                                            </FormBox>

                                            <FormBox>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <DescriptionIcon color="primary" sx={{ mr: 1 }} />
                                                    <Typography variant="subtitle2">Description</Typography>
                                                </Box>
                                                <MyMultilineField
                                                    name="description"
                                                    control={control}
                                                    placeholder="Entrez la description du projet"
                                                    rows={4}
                                                    error={!!errors.description}
                                                    helperText={errors.description?.message}
                                                />
                                            </FormBox>
                                        </Stack>
                                    </Box>
                                </Fade>

                                {/* Tab 1: Dates & Budget */}
                                <Fade in={tabValue === 1} unmountOnExit>
                                    <Box hidden={tabValue !== 1}>
                                        <Stack spacing={3}>
                                            <FormBox>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <CalendarTodayIcon color="primary" sx={{ mr: 1 }} />
                                                    <Typography variant="subtitle2">Date de début</Typography>
                                                </Box>
                                                <MyDatePickerField
                                                    name="start_date"
                                                    control={control}
                                                    error={!!errors.start_date}
                                                    helperText={errors.start_date?.message}
                                                />
                                            </FormBox>

                                            <FormBox>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <EventIcon color="primary" sx={{ mr: 1 }} />
                                                    <Typography variant="subtitle2">Date de fin</Typography>
                                                </Box>
                                                <MyDatePickerField
                                                    name="end_date"
                                                    control={control}
                                                    error={!!errors.end_date}
                                                    helperText={errors.end_date?.message}
                                                />
                                            </FormBox>

                                            <FormBox>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <AttachMoneyIcon color="primary" sx={{ mr: 1 }} />
                                                    <Typography variant="subtitle2">Budget</Typography>
                                                </Box>
                                                <MyTextField
                                                    name="budget"
                                                    control={control}
                                                    placeholder="Entrez le montant du budget"
                                                    error={!!errors.budget}
                                                    helperText={errors.budget?.message}
                                                />
                                            </FormBox>
                                        </Stack>
                                    </Box>
                                </Fade>

                                {/* Tab 2: Management */}
                                <Fade in={tabValue === 2} unmountOnExit>
                                    <Box hidden={tabValue !== 2}>
                                        <Stack spacing={3}>
                                            <FormBox>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <PriorityHighIcon color="primary" sx={{ mr: 1 }} />
                                                    <Typography variant="subtitle2">Priorité</Typography>
                                                </Box>
                                                <MySelectField
                                                    name="priority"
                                                    control={control}
                                                    options={priorityOptions}
                                                    error={!!errors.priority}
                                                    helperText={errors.priority?.message}
                                                />
                                            </FormBox>

                                            <FormBox>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <PersonIcon color="primary" sx={{ mr: 1 }} />
                                                    <Typography variant="subtitle2">Responsable du projet</Typography>
                                                </Box>
                                                {loadingMembers ? (
                                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                                        <CircularProgress size={24} />
                                                    </Box>
                                                ) : (
                                                    <MySelectField
                                                        name="responsible"
                                                        control={control}
                                                        options={memberOptions}
                                                        error={!!errors.responsible}
                                                        helperText={errors.responsible?.message}
                                                    />
                                                )}
                                            </FormBox>

                                            <Chip
                                                icon={<InfoOutlinedIcon />}
                                                label="Le responsable sera notifié des mises à jour du projet"
                                                color="info"
                                                variant="outlined"
                                            />
                                        </Stack>
                                    </Box>
                                </Fade>

                                {/* Tab 3: Progress & Reports */}
                                <Fade in={tabValue === 3} unmountOnExit>
                                    <Box hidden={tabValue !== 3}>
                                        <Stack spacing={3}>
                                            <ProgressCard>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <TrendingUpIcon color="primary" sx={{ mr: 1.5 }} />
                                                        <Typography variant="subtitle1" fontWeight={700}>
                                                            Progression du projet
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="h6" sx={{ color: `${getProgressColor(projectData?.progress_percentage || 0)}.main`, fontWeight: 700 }}>
                                                        {projectData?.progress_percentage || 0}%
                                                    </Typography>
                                                </Box>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={projectData?.progress_percentage || 0}
                                                    sx={{
                                                        height: 12,
                                                        borderRadius: 6,
                                                        mb: 2,
                                                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                        '& .MuiLinearProgress-bar': {
                                                            backgroundColor: theme.palette[getProgressColor(projectData?.progress_percentage || 0)].main,
                                                            borderRadius: 6,
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    variant="outlined"
                                                    color="primary"
                                                    fullWidth
                                                    onClick={() => setOpenProgressDialog(true)}
                                                >
                                                    Mettre à jour la progression
                                                </Button>
                                            </ProgressCard>

                                            <Paper sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${alpha(theme.palette.info.main, 0.2)}` }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                    <AssignmentIcon color="info" sx={{ mr: 1.5 }} />
                                                    <Typography variant="subtitle1" fontWeight={700}>
                                                        Générer un rapport
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                    Créez un rapport PDF de l&apos;état actuel du projet
                                                </Typography>
                                                <Button
                                                    variant="contained"
                                                    color="info"
                                                    fullWidth
                                                    startIcon={<FileDownloadIcon />}
                                                    onClick={() => setOpenReportDialog(true)}
                                                >
                                                    Générer rapport PDF
                                                </Button>
                                            </Paper>
                                        </Stack>
                                    </Box>
                                </Fade>
                            </Box>

                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                spacing={2}
                                sx={{ justifyContent: 'flex-end' }}
                            >
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate('/projects')}
                                    sx={{ minWidth: { sm: 120 } }}
                                >
                                    Annuler
                                </Button>

                                <SaveButton
                                    type="submit"
                                    variant="contained"
                                    disabled={saving || !isValid || !isDirty}
                                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                >
                                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                                </SaveButton>
                            </Stack>
                        </form>
                    </FormContainer>
                )}
            </Box>

            {/* Progress Update Dialog */}
            <Dialog open={openProgressDialog} onClose={() => setOpenProgressDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Mettre à jour la progression
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="subtitle2" fontWeight={600}>
                                    Pourcentage de progression
                                </Typography>
                                <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                                    {newProgress}%
                                </Typography>
                            </Box>
                            <Slider
                                value={newProgress}
                                onChange={(e, value) => setNewProgress(value)}
                                min={0}
                                max={100}
                                step={5}
                                marks={[
                                    { value: 0, label: '0%' },
                                    { value: 50, label: '50%' },
                                    { value: 100, label: '100%' }
                                ]}
                            />
                        </Box>
                        <LinearProgress variant="determinate" value={newProgress} />
                        <TextField
                            label="Notes de progression"
                            multiline
                            rows={3}
                            value={progressNotes}
                            onChange={(e) => setProgressNotes(e.target.value)}
                            placeholder="Décrivez les mises à jour..."
                            variant="outlined"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenProgressDialog(false)}>Annuler</Button>
                    <Button
                        onClick={handleUpdateProgress}
                        variant="contained"
                        disabled={updatingProgress}
                    >
                        {updatingProgress ? 'Mise à jour...' : 'Mettre à jour'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Report Generation Dialog */}
            <Dialog open={openReportDialog} onClose={() => setOpenReportDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Générer un rapport de projet
                </DialogTitle>
                <DialogContent dividers>
                    <TextField
                        label="Notes de réunion"
                        multiline
                        rows={4}
                        value={reportNotes}
                        onChange={(e) => setReportNotes(e.target.value)}
                        placeholder="Entrez vos notes de réunion..."
                        variant="outlined"
                        fullWidth
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenReportDialog(false)}>Annuler</Button>
                    <Button
                        onClick={handleGenerateReport}
                        variant="contained"
                        disabled={generatingReport}
                        startIcon={generatingReport ? <CircularProgress size={20} /> : <FileDownloadIcon />}
                    >
                        {generatingReport ? 'Génération...' : 'Générer PDF'}
                    </Button>
                </DialogActions>
            </Dialog>

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
                <Alert severity="success" sx={{ width: '100%' }}>
                    {successMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default EditProject;