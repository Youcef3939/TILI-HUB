import { useEffect, useState } from 'react';
import AxiosInstance from './Axios.jsx';
import Dayjs from 'dayjs';
import {
    Box, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions,
    DialogContent, DialogTitle, Divider, Grid, IconButton, LinearProgress,
    Snackbar, Stack, Tooltip, Typography, useMediaQuery, useTheme, alpha, Alert, Button
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { usePermissions } from '../contexts/PermissionsContext.jsx';

// Icons
import AddIcon from '@mui/icons-material/Add';
import BusinessIcon from '@mui/icons-material/Business';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const PageContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(3),
    [theme.breakpoints.down('md')]: { padding: theme.spacing(2) },
    [theme.breakpoints.down('sm')]: { padding: theme.spacing(1.5) },
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

const ProjectCard = styled(Card)(({ theme }) => ({
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

const StatusChip = styled(Chip)(({ theme, status }) => {
    const config = {
        'En cours': { color: theme.palette.success.main, bgcolor: alpha(theme.palette.success.main, 0.1) },
        'Terminé': { color: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.1) },
        'En pause': { color: theme.palette.warning.main, bgcolor: alpha(theme.palette.warning.main, 0.1) },
        'Annulé': { color: theme.palette.error.main, bgcolor: alpha(theme.palette.error.main, 0.1) },
        'Non commencé': { color: theme.palette.info.main, bgcolor: alpha(theme.palette.info.main, 0.1) }
    }[status] || { color: theme.palette.grey[600], bgcolor: alpha(theme.palette.grey[600], 0.1) };
    return { fontWeight: 600, color: config.color, backgroundColor: config.bgcolor, border: `1px solid ${alpha(config.color, 0.3)}` };
});

const PriorityChip = styled(Chip)(({ theme, priority }) => {
    const config = {
        low: { color: theme.palette.info.main, bgcolor: alpha(theme.palette.info.main, 0.1) },
        medium: { color: theme.palette.warning.main, bgcolor: alpha(theme.palette.warning.main, 0.1) },
        high: { color: theme.palette.error.main, bgcolor: alpha(theme.palette.error.main, 0.1) },
        urgent: { color: theme.palette.error.dark, bgcolor: alpha(theme.palette.error.main, 0.2) }
    }[priority] || { color: theme.palette.grey[600], bgcolor: alpha(theme.palette.grey[600], 0.1) };
    return { fontWeight: 600, color: config.color, backgroundColor: config.bgcolor, border: `1px solid ${alpha(config.color, 0.3)}` };
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-TN', {
        style: 'currency',
        currency: 'TND',
    }).format(amount);
};

const getPriorityLabel = (priority) => ({
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute',
    urgent: 'Urgente'
}[priority] || priority);

const getProgressColor = (progress) => {
    if (progress >= 75) return 'success';
    if (progress >= 50) return 'warning';
    if (progress >= 25) return 'info';
    return 'error';
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Projects = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const { userRole } = usePermissions();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
    const [openViewDialog, setOpenViewDialog] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);

    const fetchProjects = async () => {
        setRefreshing(true);
        try {
            const response = await AxiosInstance.get('/api/project/');
            setProjects(response.data);
        } catch (error) {
            console.error('Error fetching projects:', error);
            setNotification({
                open: true,
                message: 'Impossible de charger les projets',
                severity: 'error'
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        fetchProjects();
        if (location.state?.success) {
            setNotification({
                open: true,
                message: location.state.message || 'Opération réussie',
                severity: 'success'
            });
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, []);

    const handleOpenDeleteDialog = (project) => {
        setProjectToDelete(project);
        setOpenDeleteDialog(true);
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
        setProjectToDelete(null);
    };

    const handleDeleteProject = async () => {
        if (!projectToDelete) return;
        try {
            await AxiosInstance.delete(`/api/project/${projectToDelete.id}/`);
            setNotification({
                open: true,
                message: `Projet "${projectToDelete.name}" supprimé`,
                severity: 'success'
            });
            fetchProjects();
        } catch (error) {
            setNotification({
                open: true,
                message: error.response?.data?.detail || 'Erreur lors de la suppression',
                severity: 'error'
            });
        }
        handleCloseDeleteDialog();
    };

    const handleViewProject = (project) => {
        setSelectedProject(project);
        setOpenViewDialog(true);
    };

    const stats = {
        total: projects.length,
        active: projects.filter(p => p.status === 'En cours').length,
        completed: projects.filter(p => p.status === 'Terminé').length,
        avgProgress: projects.length > 0
            ? Math.round(projects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / projects.length)
            : 0
    };

    return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <SectionTitle>
                        <BusinessIcon />
                        Gestion de Projets
                    </SectionTitle>
                    <Typography variant="body2" color="text.secondary">
                        Suivez la progression de vos {projects.length} projet{projects.length !== 1 ? 's' : ''}
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        component={Link}
                        to="/CreateProject"
                        sx={{
                            minHeight: 44,
                            fontWeight: 600,
                            borderRadius: 1,
                        }}
                    >
                        {isMobile ? 'Créer' : 'Créer un projet'}
                    </Button>
                    <Tooltip title="Actualiser">
                        <IconButton
                            onClick={fetchProjects}
                            disabled={refreshing}
                            sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}
                        >
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Box>

            {loading ? (
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    {[1, 2, 3, 4].map((i) => (
                        <Grid item xs={6} sm={3} key={i}>
                            <Card>
                                <CardContent>
                                    <div style={{ height: 40, backgroundColor: alpha(theme.palette.primary.main, 0.1), borderRadius: 4 }} />
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={6} sm={3}>
                        <Card sx={{ textAlign: 'center', p: 2 }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                {stats.total}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">Total</Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Card sx={{ textAlign: 'center', p: 2 }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                                {stats.active}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">Actifs</Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Card sx={{ textAlign: 'center', p: 2 }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>
                                {stats.completed}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">Terminés</Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Card sx={{ textAlign: 'center', p: 2 }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.main' }}>
                                {stats.avgProgress}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">Progression moy</Typography>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : projects.length === 0 ? (
                <Alert severity="info" sx={{ mb: 3 }}>
                    Aucun projet trouvé.
                    {userRole === 'president' && (
                        <Button component={Link} to="/CreateProject" size="small" sx={{ ml: 2 }}>
                            Créer un projet
                        </Button>
                    )}
                </Alert>
            ) : (
                <Grid container spacing={3}>
                    {projects.map((project) => (
                        <Grid item xs={12} sm={6} md={4} key={project.id}>
                            <ProjectCard>
                                <CardContent sx={{ pb: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1.5 }}>
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                                                {project.name}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                <StatusChip label={project.status} status={project.status} size="small" />
                                                {project.priority && (
                                                    <PriorityChip label={getPriorityLabel(project.priority)} priority={project.priority} size="small" />
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Divider sx={{ my: 1.5 }} />

                                    <Stack spacing={1} sx={{ mb: 1.5 }}>
                                        {project.responsible_name && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <PersonIcon fontSize="small" color="action" />
                                                <Typography variant="caption" color="text.secondary">
                                                    {project.responsible_name}
                                                </Typography>
                                            </Box>
                                        )}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CalendarTodayIcon fontSize="small" color="action" />
                                            <Typography variant="caption" color="text.secondary">
                                                {Dayjs(project.start_date).format('DD/MM/YYYY')}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="caption" fontWeight={600} sx={{ color: 'primary.main' }}>
                                                Budget: {formatCurrency(project.budget)}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Box sx={{ mb: 1.5 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Typography variant="caption" fontWeight={600}>
                                                Progression
                                            </Typography>
                                            <Typography variant="caption" fontWeight={700} sx={{ color: `${getProgressColor(project.progress_percentage)}.main` }}>
                                                {project.progress_percentage || 0}%
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={project.progress_percentage || 0}
                                            sx={{
                                                height: 8,
                                                borderRadius: 4,
                                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                '& .MuiLinearProgress-bar': {
                                                    backgroundColor: theme.palette[getProgressColor(project.progress_percentage)].main,
                                                    borderRadius: 4,
                                                }
                                            }}
                                        />
                                    </Box>

                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                                        {project.description}
                                    </Typography>
                                </CardContent>

                                <Divider />
                                <CardContent sx={{ pt: 1 }}>
                                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                                        <Tooltip title="Voir détails">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleViewProject(project)}
                                                sx={{ color: 'info.main' }}
                                            >
                                                <VisibilityIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Modifier">
                                            <IconButton
                                                size="small"
                                                component={Link}
                                                to={`/projects/edit/${project.id}`}
                                                sx={{ color: 'primary.main' }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        {userRole === 'president' && (
                                            <Tooltip title="Supprimer">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenDeleteDialog(project)}
                                                    sx={{ color: 'error.main' }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Stack>
                                </CardContent>
                            </ProjectCard>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {selectedProject?.name}
                </DialogTitle>
                <DialogContent dividers>
                    {selectedProject && (
                        <Stack spacing={2}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Statut</Typography>
                                <StatusChip label={selectedProject.status} status={selectedProject.status} />
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Description</Typography>
                                <Typography variant="body2">{selectedProject.description}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Dates</Typography>
                                <Typography variant="body2">
                                    {Dayjs(selectedProject.start_date).format('DD/MM/YYYY')} - {Dayjs(selectedProject.end_date).format('DD/MM/YYYY')}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Budget</Typography>
                                <Typography variant="body2">{formatCurrency(selectedProject.budget)}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>Progression: {selectedProject.progress_percentage || 0}%</Typography>
                                <LinearProgress variant="determinate" value={selectedProject.progress_percentage || 0} />
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenViewDialog(false)}>Fermer</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogContent>
                    <Typography>
                        Êtes-vous sûr de vouloir supprimer le projet &quot;{projectToDelete?.name}&quot; ?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog}>Annuler</Button>
                    <Button onClick={handleDeleteProject} color="error" variant="contained">
                        Supprimer
                    </Button>
                </DialogActions>
            </Dialog>

            {userRole === 'president' && !isMobile && (
                <Box
                    component={Link}
                    to="/CreateProject"
                    sx={{
                        position: 'fixed',
                        bottom: 32,
                        right: 24,
                        zIndex: 1000,
                    }}
                >
                    <Button
                        variant="contained"
                        color="primary"
                        sx={{
                            borderRadius: '50%',
                            width: 56,
                            height: 56,
                            minWidth: 56,
                            boxShadow: theme.shadows[6],
                            '&:hover': {
                                transform: 'scale(1.1)',
                            }
                        }}
                    >
                        <AddIcon />
                    </Button>
                </Box>
            )}

            <Snackbar
                open={notification.open}
                autoHideDuration={4000}
                onClose={() => setNotification({ ...notification, open: false })}
            >
                <Alert severity={notification.severity} sx={{ width: '100%' }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </PageContainer>
    );
};

export default Projects;

