import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    CardActionArea,
    Divider,
    Button,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    IconButton,
    Chip,
    CircularProgress,
    Alert,
    LinearProgress,
    Tooltip,
    Skeleton,
} from '@mui/material';
import { styled, useTheme, alpha } from '@mui/material/styles';
import {
    Dashboard,
    Business,
    Group,
    AccountBalance,
    VolunteerActivism,
    TrendingUp,
    TrendingDown,
    Paid,
    Receipt,
    Assignment,
    Add,
    CheckCircle,
    Warning,
    ArrowForward,
    Refresh,
    Visibility,
    HourglassEmpty,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import AxiosInstance from './Axios';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import UpcomingMeetingsCalendar from './UpcomingMeetingsCalendar';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ForeignDonationsWidget from './ForeignDonationsWidget';
import { usePermissions } from "../contexts/PermissionsContext.jsx";

// ============================================================================
// STYLED COMPONENTS
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
    marginTop: theme.spacing(3),
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

    '&:first-of-type': {
        marginTop: 0,
    },
}));

const StatsCard = styled(Card)(({ theme }) => ({
    height: '100%',
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

const DashboardCard = styled(Card)(({ theme }) => ({
    borderRadius: theme.shape.borderRadius * 2,
    height: '100%',
    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
    transition: `all 300ms cubic-bezier(0.4, 0, 0.2, 1)`,

    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[8],
        borderColor: theme.palette.primary.main,
    },
}));

const StatValue = styled(Typography)(({ theme }) => ({
    fontSize: '2rem',
    fontWeight: 800,
    color: theme.palette.primary.main,
    lineHeight: 1.2,
    letterSpacing: '-1px',
}));

const StatLabel = styled(Typography)(({ theme }) => ({
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
    fontWeight: 500,
    marginTop: theme.spacing(1),
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
}));

const AIAssistantButton = styled(Paper)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1.5, 2.5),
    borderRadius: 30,
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
    color: 'white',
    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
    transition: `all 300ms cubic-bezier(0.4, 0, 0.2, 1)`,
    cursor: 'pointer',
    textDecoration: 'none',
    border: 'none',

    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.5)}`,
    },
}));

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const StatusChip = ({ status }) => {
    const theme = useTheme();
    const statusConfig = {
        verified: { color: 'success', icon: <CheckCircle fontSize="small" /> },
        failed: { color: 'error', icon: <Warning fontSize="small" /> },
        pending: { color: 'warning', icon: <HourglassEmpty fontSize="small" /> },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
        <Chip
            size="small"
            icon={config.icon}
            label={
                status === 'verified' ? 'Vérifié' :
                    status === 'failed' ? 'Échec' :
                        'En attente'
            }
            sx={{
                bgcolor: alpha(theme.palette[config.color].main, 0.12),
                color: theme.palette[config.color].main,
                fontWeight: 600,
                border: `1px solid ${alpha(theme.palette[config.color].main, 0.3)}`,
            }}
        />
    );
};

const StatBox = ({ icon: Icon, label, value, color = 'primary' }) => (
    <StatsCard>
        <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                    <StatValue>{value}</StatValue>
                    <StatLabel>{label}</StatLabel>
                </Box>
                <Avatar
                    sx={{
                        bgcolor: alpha(useTheme().palette[color].main, 0.12),
                        color: `${color}.main`,
                        width: 48,
                        height: 48,
                    }}
                >
                    <Icon />
                </Avatar>
            </Box>
        </CardContent>
    </StatsCard>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Home = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userRole, userName } = usePermissions();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const [dashboardData, setDashboardData] = useState({
        association: null,
        members: [],
        projects: [],
        recentTransactions: [],
        financialStats: { totalIncome: 0, totalExpenses: 0, netBalance: 0, budgetUtilization: [] },
        verificationStatus: null,
        pendingUsersCount: 0,
    });

    // Fetch dashboard data
    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [
                profileResponse,
                membersResponse,
                projectsResponse,
                financialResponse,
                transactionsResponse,
                pendingUsersResponse,
            ] = await Promise.all([
                AxiosInstance.get('/users/profile/'),
                AxiosInstance.get('/api/member/'),
                AxiosInstance.get('/api/project/'),
                AxiosInstance.get('/finances/dashboard/'),
                AxiosInstance.get('/finances/transactions/?limit=5'),
                userRole === 'president' ? AxiosInstance.get('/api/member/?status=pending') : Promise.resolve({ data: [] }),
            ]);

            const profileData = profileResponse.data;
            const financialData = financialResponse.data;

            // ✅ FIXED: Extract verification_status from nested association object
            const verificationStatus = profileData.association?.verification_status || null;

            setDashboardData({
                association: profileData.association,
                members: membersResponse.data.slice(0, 6),
                projects: projectsResponse.data.slice(0, 3),
                recentTransactions: transactionsResponse.data,
                financialStats: {
                    totalIncome: financialData.total_income || 0,
                    totalExpenses: financialData.total_expenses || 0,
                    netBalance: financialData.net_balance || 0,
                    budgetUtilization: financialData.budget_utilization || [],
                },
                verificationStatus: verificationStatus,  // ✅ CORRECT KEY & VALUE
                pendingUsersCount: Array.isArray(pendingUsersResponse.data) ? pendingUsersResponse.data.length : 0,
            });
        } catch (err) {
            console.error('Error fetching dashboard:', err);
            setError('Impossible de charger les données du tableau de bord');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchDashboardData();
        setRefreshing(false);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-TN', {
            style: 'currency',
            currency: 'TND',
        }).format(amount);
    };

    const getVerificationLabel = (status) => {
        if (!status) return 'Statut indisponible';  // ✅ IMPROVED
        const normalized = String(status).toLowerCase().trim();
        const labels = {
            verified: 'Vérifié ✓',
            pending: 'En attente',
            rejected: 'Refusé',
            failed: 'Échec de vérification',
            in_review: 'En cours de vérification',
        };
        return labels[normalized] || normalized.replace(/_/g, ' ');
    };

    // ============================================================================
    // RENDER
    // ============================================================================

    return (
        <PageContainer>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-1px' }}>
                        Bienvenue, {userName?.split(' ')[0]}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {dayjs().locale('fr').format('dddd D MMMM YYYY').charAt(0).toUpperCase() + dayjs().locale('fr').format('dddd D MMMM YYYY').slice(1)}
                    </Typography>
                </Box>
                <Tooltip title="Actualiser">
                    <IconButton
                        onClick={handleRefresh}
                        disabled={refreshing}
                        sx={{
                            transition: 'transform 0.3s',
                            transform: refreshing ? 'rotate(360deg)' : 'rotate(0deg)',
                        }}
                    >
                        <Refresh />
                    </IconButton>
                </Tooltip>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* Verification Status Alert - ✅ IMPROVED */}
            {dashboardData.verificationStatus === null ? (
                // Status not loaded or unavailable
                <Alert severity="error" sx={{ mb: 3 }}>
                    ⚠️ Impossible de charger le statut de vérification de votre association.
                </Alert>
            ) : dashboardData.verificationStatus === 'verified' ? (
                // Verified - show success
                <Alert severity="success" sx={{ mb: 3 }}>
                    ✓ Votre association est vérifée et opérationnelle.
                </Alert>
            ) : (
                // Pending or Failed - show warning
                <Alert
                    severity="warning"
                    sx={{ mb: 3 }}
                    action={
                        userRole === 'president' ? (
                            <Button
                                color="inherit"
                                size="small"
                                component={Link}
                                to="/association-settings"
                            >
                                Détails
                            </Button>
                        ) : undefined
                    }
                >
                    Votre association est en attente de vérification.
                    <strong> Statut : {getVerificationLabel(dashboardData.verificationStatus)}</strong>
                </Alert>
            )}

            {/* Stats Grid */}
            {loading ? (
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    {[1, 2, 3, 4].map((i) => (
                        <Grid item xs={12} sm={6} md={3} key={i}>
                            <StatsCard>
                                <CardContent sx={{ p: 3 }}>
                                    <Skeleton variant="text" width="60%" height={40} sx={{ mb: 1 }} />
                                    <Skeleton variant="text" width="40%" />
                                </CardContent>
                            </StatsCard>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatBox icon={Group} label="Membres" value={dashboardData.members.length} color="primary" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatBox icon={Business} label="Projets" value={dashboardData.projects.length} color="success" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatBox
                            icon={Paid}
                            label="Revenus"
                            value={formatCurrency(dashboardData.financialStats.totalIncome)}
                            color="info"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatBox
                            icon={AccountBalance}
                            label="Solde"
                            value={formatCurrency(dashboardData.financialStats.netBalance)}
                            color="warning"
                        />
                    </Grid>
                </Grid>
            )}

            {/* Pending Users Alert */}
            {userRole === 'president' && dashboardData.pendingUsersCount > 0 && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    {dashboardData.pendingUsersCount} utilisateur(s) en attente de validation.
                    <Button size="small" component={Link} to="/pending-users" sx={{ ml: 2 }}>
                        Voir
                    </Button>
                </Alert>
            )}

            {/* Main Content Grid */}
            <Grid container spacing={3}>
                {/* Recent Transactions */}
                {dashboardData.recentTransactions.length > 0 && (
                    <Grid item xs={12} md={6}>
                        <DashboardCard>
                            <CardContent sx={{ p: 3 }}>
                                <SectionTitle>
                                    <Receipt />
                                    Dernières Transactions
                                </SectionTitle>

                                <List sx={{ '& .MuiListItem-root': { px: 0 } }}>
                                    {dashboardData.recentTransactions.map((transaction, idx) => (
                                        <React.Fragment key={transaction.id || idx}>
                                            <ListItem disablePadding sx={{ py: 1.5 }}>
                                                <ListItemAvatar sx={{ minWidth: 40 }}>
                                                    <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(theme.palette.primary.main, 0.12) }}>
                                                        {transaction.type === 'income' ? <TrendingUp /> : <TrendingDown />}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={transaction.description || 'Transaction'}
                                                    secondary={dayjs(transaction.date).format('DD/MM/YYYY')}
                                                    primaryTypographyProps={{ fontWeight: 600 }}
                                                />
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: transaction.type === 'income' ? 'success.main' : 'error.main',
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                                </Typography>
                                            </ListItem>
                                            {idx < dashboardData.recentTransactions.length - 1 && <Divider />}
                                        </React.Fragment>
                                    ))}
                                </List>

                                <Button
                                    fullWidth
                                    endIcon={<ArrowForward />}
                                    component={Link}
                                    to="/finance"
                                    sx={{ mt: 2 }}
                                >
                                    Voir Tout
                                </Button>
                            </CardContent>
                        </DashboardCard>
                    </Grid>
                )}

                {/* Members Section */}
                {dashboardData.members.length > 0 && (
                    <Grid item xs={12} md={dashboardData.recentTransactions.length > 0 ? 6 : 12}>
                        <DashboardCard>
                            <CardContent sx={{ p: 3 }}>
                                <SectionTitle>
                                    <Group />
                                    Derniers Membres
                                </SectionTitle>

                                <Grid container spacing={1.5}>
                                    {dashboardData.members.map((member) => (
                                        <Grid item xs={12} sm={6} md={12} key={member.id}>
                                            <Card
                                                variant="outlined"
                                                sx={{
                                                    transition: 'all 200ms ease',
                                                    '&:hover': { borderColor: 'primary.main' },
                                                }}
                                            >
                                                <CardContent sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar
                                                        sx={{
                                                            width: 40,
                                                            height: 40,
                                                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                                                            color: 'primary.main',
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {member.name?.charAt(0).toUpperCase() || '?'}
                                                    </Avatar>
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography variant="subtitle2" fontWeight={600} noWrap>
                                                            {member.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" noWrap>
                                                            {member.email}
                                                        </Typography>
                                                    </Box>
                                                    <Tooltip title="Voir détails">
                                                        <IconButton
                                                            size="small"
                                                            component={Link}
                                                            to={`/member/editmember/${member.id}`}
                                                            sx={{ color: 'primary.main' }}
                                                        >
                                                            <Visibility fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>

                                <Button
                                    fullWidth
                                    endIcon={<ArrowForward />}
                                    component={Link}
                                    to="/members"
                                    sx={{ mt: 2 }}
                                >
                                    Voir Tous les Membres
                                </Button>
                            </CardContent>
                        </DashboardCard>
                    </Grid>
                )}
            </Grid>

            {/* Foreign Donations Widget */}
            {dashboardData.financialStats.budgetUtilization.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <ForeignDonationsWidget />
                </Box>
            )}

            {/* Meetings Calendar */}
            <Box sx={{ mt: 4 }}>
                <UpcomingMeetingsCalendar />
            </Box>

            {/* AI Assistant Floating Button */}
            <Tooltip title="Ouvrir l'Assistant IA">
                <Box
                    component={Link}
                    to="/chatbot"
                    sx={{
                        position: 'fixed',
                        bottom: { xs: 24, sm: 32 },
                        right: { xs: 16, sm: 24 },
                        zIndex: 1000,
                        textDecoration: 'none',
                    }}
                >
                    <AIAssistantButton elevation={6}>
                        <SmartToyIcon sx={{ fontSize: 24, mr: 1 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, display: { xs: 'none', sm: 'block' } }}>
                            Assistant IA
                        </Typography>
                    </AIAssistantButton>
                </Box>
            </Tooltip>
        </PageContainer>
    );
};

export default Home;