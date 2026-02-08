import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Tabs,
    Tab,
    CircularProgress,
    Button,
    Alert,
    useTheme
} from '@mui/material';
import {
    Add,
    Refresh,
    AccountBalance,
    ReceiptLong,
    BarChart,
    AssignmentTurnedIn,
    People
} from '@mui/icons-material';
import AxiosInstance from './Axios';

// Import permission components
import { PermissionRequired } from '../contexts/ConditionalUI.jsx';
import { usePermissions } from '../contexts/PermissionsContext.jsx';
import { useLocation } from 'react-router-dom';
// Import child components
import TransactionList from './finance/TransactionList.jsx';
import TransactionForm from './finance/TransactionForm';
import BudgetDashboard from './finance/BudgetDashboard';
import FinancialReports from './finance/FinancialReports';
import DashboardWidgets from './finance/DashboardWidgets';
import DonorForm from './finance/DonorForm.jsx';
import DonorList from './finance/DonorList';
import DateRangeFilter from './finance/DateRangeFilter';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

// Tab panel component
function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`finance-tabpanel-${index}`}
            aria-labelledby={`finance-tab-${index}`}
            {...other}
            style={{ paddingTop: '16px' }}
        >
            {value === index && <Box>{children}</Box>}
        </div>
    );
}

const Finance = () => {
    // Get permission context
    const { can, RESOURCES, ACTIONS, userRole } = usePermissions();
    const location = useLocation(); // Get location object from React Router

    // Get tab from URL query parameter
    const queryParams = new URLSearchParams(location.search);
    const tabParam = queryParams.get('tab');

    const theme = useTheme();
    // Initialize activeTab from either query parameter, location state, or default to 0
    const [activeTab, setActiveTab] = useState(() => {
        if (tabParam !== null) {
            return parseInt(tabParam, 10);
        } else if (location.state?.activeTab !== undefined) {
            return location.state.activeTab;
        }
        return 0;
    });


    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [donors, setDonors] = useState([]);
    const [statistics, setStatistics] = useState({
        total_income: 0,
        total_expenses: 0,
        net_balance: 0,
        total_donations: 0,
        total_membership_fees: 0,
        total_project_expenses: 0,
        income_by_category: {},
        expenses_by_category: {},
        project_budget_utilization: [],
        recent_transactions: []
    });

    // State for date filter
    const [dateFilter, setDateFilter] = useState({
        startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
        endDate: dayjs().format('YYYY-MM-DD'),
        filterType: 'month',
        displayLabel: '30 derniers jours'
    });

    // State for transaction form modal
    const [formOpen, setFormOpen] = useState(false);
    const [formType, setFormType] = useState('income'); // 'income' or 'expense'
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // State for donor form modal
    const [donorFormOpen, setDonorFormOpen] = useState(false);

    // State for notifications
    const [notification, setNotification] = useState({
        show: false,
        message: '',
        severity: 'success'
    });

    // Handle date filter change
    const handleDateFilterChange = (newFilter) => {
        setDateFilter(newFilter);
        // Trigger a refresh with the new date filter
        setRefreshTrigger(prev => prev + 1);
    };

    // Fetch financial statistics - FIXED to avoid infinite loops
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Add date filter parameters to the API calls
                const params = new URLSearchParams({
                    start_date: dateFilter.startDate,
                    end_date: dateFilter.endDate
                });

                // Use regular Axios instance with date parameters
                const statsResponse = await AxiosInstance.get(`/finances/dashboard/?${params}`);
                setStatistics(statsResponse.data);

                // Only fetch transactions if user has permission to view them
                if (can(ACTIONS.VIEW, RESOURCES.FINANCE) && userRole !== 'member') {
                    const transactionsResponse = await AxiosInstance.get(`/finances/transactions/?${params}`);
                    setTransactions(transactionsResponse.data);

                    const donorsResponse = await AxiosInstance.get('/finances/donors/');
                    setDonors(donorsResponse.data);
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching financial data:', err);
                setError('Échec du chargement des données financières. Veuillez réessayer plus tard.');
                setLoading(false);
            }
        };

        fetchData();
        // Include dateFilter in dependencies to refetch when it changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshTrigger, can, ACTIONS, RESOURCES, userRole, dateFilter]);


    const handleTabChange = (event, newValue) => {

        const tabPermissionMap = {
            0: true,
            1: userRole !== 'member',
            2: userRole !== 'member',
            3: userRole !== 'member',
            4: userRole !== 'member',
        };

        // Only change tab if user has permission
        if (tabPermissionMap[newValue]) {
            setActiveTab(newValue);
        } else {
            setNotification({
                show: true,
                message: 'Vous n\'avez pas la permission de voir cet onglet.',
                severity: 'error'
            });

            // Hide notification after 3 seconds
            setTimeout(() => {
                setNotification(prev => ({ ...prev, show: false }));
            }, 3000);
        }
    };

    // Open transaction form
    const handleAddTransaction = (type) => {
        // Check if user has create permission
        if (!can(ACTIONS.CREATE, RESOURCES.FINANCE)) {
            setNotification({
                show: true,
                message: 'Vous n\'avez pas la permission d\'ajouter des transactions.',
                severity: 'error'
            });

            setTimeout(() => {
                setNotification(prev => ({ ...prev, show: false }));
            }, 3000);
            return;
        }

        setFormType(type);
        setFormOpen(true);
    };

    // Open donor form
    const handleAddDonor = () => {
        // Check if user has create permission
        if (!can(ACTIONS.CREATE, RESOURCES.FINANCE)) {
            setNotification({
                show: true,
                message: 'Vous n\'avez pas la permission d\'ajouter des donateurs.',
                severity: 'error'
            });

            setTimeout(() => {
                setNotification(prev => ({ ...prev, show: false }));
            }, 3000);
            return;
        }

        setDonorFormOpen(true);
    };

    // Handle form submission success
    const handleFormSuccess = () => {
        setFormOpen(false);
        setRefreshTrigger(prev => prev + 1);
        setNotification({
            show: true,
            message: 'Transaction enregistrée avec succès !',
            severity: 'success'
        });

        // Hide notification after 3 seconds
        setTimeout(() => {
            setNotification(prev => ({ ...prev, show: false }));
        }, 3000);
    };

    // Handle donor form submission success
    const handleDonorFormSuccess = () => {
        setDonorFormOpen(false);
        setRefreshTrigger(prev => prev + 1);
        setNotification({
            show: true,
            message: 'Donateur ajouté avec succès !',
            severity: 'success'
        });

        // Hide notification after 3 seconds
        setTimeout(() => {
            setNotification(prev => ({ ...prev, show: false }));
        }, 3000);
    };

    // Manually refresh data
    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    // Calculate visible tabs based on permissions
    // Moved outside of render to avoid rerenders and recalculations
    const visibleTabs = [
        { label: 'Tableau de Bord', icon: <BarChart fontSize="small" /> }, // Dashboard is always visible
    ];

    // Add other tabs only if user has proper permissions
    if (can(ACTIONS.VIEW, RESOURCES.FINANCE) && userRole !== 'member') {
        visibleTabs.push(
            { label: 'Transactions', icon: <ReceiptLong fontSize="small" /> },
            { label: 'Budgets', icon: <AccountBalance fontSize="small" /> },
            { label: 'Donateurs', icon: <People fontSize="small" /> },
            { label: 'Rapports', icon: <AssignmentTurnedIn fontSize="small" /> }
        );
    }

    return (
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
            {/* Page Header - ✅ FIXED FOR MOBILE */}
            <Box sx={{ mb: 3 }}>
                {/* Title Section */}
                <Box sx={{ mb: 3 }}>
                    <Typography
                        variant="h4"
                        component="h1"
                        fontWeight="bold"
                        sx={{
                            fontSize: { xs: '1.5rem', sm: '2rem' },
                            mb: 0.5
                        }}
                    >
                        Gestion Financière
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                    >
                        Suivez les dons, les dépenses et générez des rapports
                    </Typography>
                </Box>

                {/* Action Buttons Section - ✅ FULLY RESPONSIVE */}
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5
                }}>
                    {/* Date Range Filter - Full width on mobile */}
                    <Box sx={{ width: '100%' }}>
                        <DateRangeFilter onFilterChange={handleDateFilterChange} />
                    </Box>

                    {/* Refresh Button */}
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleRefresh}
                        startIcon={<Refresh />}
                        fullWidth
                        sx={{
                            height: 44,
                            fontWeight: 600
                        }}
                    >
                        Actualiser
                    </Button>

                    {/* Add Revenue & Expense Buttons */}
                    {can(ACTIONS.CREATE, RESOURCES.FINANCE) && (
                        <Box sx={{
                            display: 'flex',
                            gap: 1.5,
                            width: '100%'
                        }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => handleAddTransaction('income')}
                                startIcon={<Add />}
                                fullWidth
                                sx={{
                                    height: 44,
                                    fontWeight: 600
                                }}
                            >
                                Ajouter un Revenu
                            </Button>
                            <Button
                                variant="contained"
                                color="secondary"
                                onClick={() => handleAddTransaction('expense')}
                                startIcon={<Add />}
                                fullWidth
                                sx={{
                                    height: 44,
                                    fontWeight: 600
                                }}
                            >
                                Ajouter une Dépense
                            </Button>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Success Notification */}
            {notification.show && (
                <Alert severity={notification.severity} sx={{ mb: 3, borderRadius: 2 }}>
                    {notification.message}
                </Alert>
            )}

            {/* Main Content */}
            <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                {/* Tabs Bar - ✅ SCROLLABLE ON MOBILE */}
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    indicatorColor="primary"
                    textColor="primary"
                    sx={{
                        bgcolor: theme.palette.background.paper,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        '& .MuiTab-root': {
                            minWidth: { xs: 'auto', sm: 120 },
                            px: { xs: 2, sm: 3 }
                        }
                    }}
                >
                    {visibleTabs.map((tab, index) => (
                        <Tab
                            key={index}
                            label={tab.label}
                            icon={tab.icon}
                            iconPosition="start"
                            sx={{
                                textTransform: 'none',
                                fontWeight: 500,
                                minHeight: { xs: 52, sm: 60 },
                                fontSize: { xs: '0.85rem', sm: '0.95rem' },
                            }}
                        />
                    ))}
                </Tabs>

                {/* Loading Indicator */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {/* Dashboard Tab - Always visible */}
                        <TabPanel value={activeTab} index={0}>
                            <DashboardWidgets
                                statistics={statistics}
                                recentTransactions={statistics.recent_transactions}
                                dateFilter={dateFilter}
                            />
                        </TabPanel>

                        {/* Only render these tabs if user has permission */}
                        {can(ACTIONS.VIEW, RESOURCES.FINANCE) && userRole !== 'member' && (
                            <>
                                {/* Transactions Tab */}
                                <TabPanel value={activeTab} index={1}>
                                    <TransactionList
                                        transactions={transactions}
                                        onRefresh={handleRefresh}
                                        onAddTransaction={handleAddTransaction}
                                        dateFilter={dateFilter}
                                    />
                                </TabPanel>

                                {/* Budget Tab */}
                                <TabPanel value={activeTab} index={2}>
                                    <BudgetDashboard
                                        projectBudgets={statistics.project_budget_utilization}
                                        onRefresh={handleRefresh}
                                        dateFilter={dateFilter}
                                    />
                                </TabPanel>

                                {/* Donors Tab */}
                                <TabPanel value={activeTab} index={3}>
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        mb: 2,
                                        px: { xs: 1, sm: 0 }
                                    }}>
                                        {can(ACTIONS.CREATE, RESOURCES.FINANCE) && (
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={handleAddDonor}
                                                startIcon={<Add />}
                                                fullWidth={false}
                                                sx={{
                                                    minWidth: { xs: '100%', sm: 180 }
                                                }}
                                            >
                                                Ajouter un Donateur
                                            </Button>
                                        )}
                                    </Box>
                                    <DonorList
                                        donors={donors}
                                        onRefresh={handleRefresh}
                                        dateFilter={dateFilter}
                                    />
                                </TabPanel>

                                {/* Reports Tab */}
                                <TabPanel value={activeTab} index={4}>
                                    <Box sx={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 2,
                                        mb: 3,
                                        px: { xs: 1, sm: 0 }
                                    }}>
                                        <Button
                                            component={Link}
                                            to="/finances/foreign-donation-reports"
                                            variant="outlined"
                                            startIcon={<AssignmentTurnedIn />}
                                            fullWidth={false}
                                            sx={{
                                                minWidth: { xs: '100%', sm: 'auto' }
                                            }}
                                        >
                                            Rapports de Dons Étrangers
                                        </Button>
                                        {/* Other report buttons */}
                                    </Box>
                                    <FinancialReports
                                        onRefresh={handleRefresh}
                                        dateFilter={dateFilter}
                                    />
                                </TabPanel>
                            </>
                        )}
                    </>
                )}
            </Paper>

            {/* Transaction Form Modal - Only render if user has permission */}
            {can(ACTIONS.CREATE, RESOURCES.FINANCE) && (
                <>
                    <TransactionForm
                        open={formOpen}
                        onClose={() => setFormOpen(false)}
                        type={formType}
                        onSuccess={handleFormSuccess}
                    />

                    <DonorForm
                        open={donorFormOpen}
                        onClose={() => setDonorFormOpen(false)}
                        onSuccess={handleDonorFormSuccess}
                    />
                </>
            )}
        </Box>
    );
};

export default Finance;