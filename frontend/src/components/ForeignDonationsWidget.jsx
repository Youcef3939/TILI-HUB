import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    CircularProgress,
    Divider,
    Tooltip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Badge,
    IconButton
} from '@mui/material';
import {
    Warning,
    AccessTime,
    PublicOutlined,
    HourglassEmpty,
    SendRounded,
    Article,
    CheckCircle,
    ReceiptLong,
    ArrowForward
} from '@mui/icons-material';
import dayjs from 'dayjs';
import AxiosInstance from './Axios';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../contexts/PermissionsContext.jsx';
// Format currency function
const formatCurrency = (amount) => (
    new Intl.NumberFormat('fr-TN', {
        style: 'currency',
        currency: 'TND',
        minimumFractionDigits: 2
    }).format(amount)
);

// Check if transaction is a foreign donation
const isForeignDonation = (transaction) => (
    transaction?.transaction_type === 'income' &&
    transaction?.donor_details &&
    !transaction.donor_details.is_member &&
    !transaction.donor_details.is_internal
);

const ForeignDonationsWidget = ({ onViewReports, userRole }) => {
    const navigate = useNavigate();
    const [pendingReports, setPendingReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalCount: 0,
        pendingCount: 0,
        overdueCount: 0,
        totalAmount: 0
    });

    // Check if user has permission to access transaction features
    // Member role users don't have access to transaction management
    const hasTransactionAccess = userRole !== 'member';

    // Handler to navigate to transactions tab
    const handleViewTransactions = () => {
        navigate('/finance?tab=1');
    };

    useEffect(() => {
        const fetchPendingReports = async () => {
            try {
                // Fetch all transactions without pagination limit
                // If your API supports it, add a parameter to get all transactions
                const transactionsResponse = await AxiosInstance.get('/finances/transactions/', {
                    params: {
                        limit: 1000, // Use a very high limit to get all transactions
                        transaction_type: 'income' // Optionally filter to income only to improve performance
                    }
                });

                // Fetch all foreign donation reports
                const reportsResponse = await AxiosInstance.get('/finances/foreign-donation-reports/', {
                    params: {
                        limit: 1000 // Use a very high limit to get all reports
                    }
                });

                const allTransactions = transactionsResponse.data;
                const allReports = reportsResponse.data;

                // Create reports lookup map
                const reportsByTransaction = Object.fromEntries(
                    allReports.map(report => [report.transaction, report])
                );

                // Identify foreign donations
                const foreignDonations = allTransactions.filter(isForeignDonation);

                console.log(`Found ${foreignDonations.length} foreign donations out of ${allTransactions.length} total transactions`);

                // Process and categorize reports
                const pending = foreignDonations
                    .filter(transaction => {
                        const report = reportsByTransaction[transaction.id];
                        return !report || report.report_status !== 'completed';
                    })
                    .map(transaction => {
                        const report = reportsByTransaction[transaction.id] || {
                            id: null,
                            days_until_deadline: 30,
                            report_status: 'pending',
                        };

                        return {
                            ...report,
                            id: report.id || `temp-${transaction.id}`,
                            transaction: transaction.id,
                            transaction_details: {
                                amount: transaction.amount,
                                date: transaction.date,
                                donor_details: transaction.donor_details
                            }
                        };
                    });

                const overdue = pending.filter(report => report.days_until_deadline < 0);

                // Calculate total amount
                const totalAmount = pending.reduce(
                    (sum, report) => sum + (report.transaction_details?.amount || 0),
                    0
                );

                // Sort all reports but only display top 3
                const sortedReports = [
                    ...overdue.sort((a, b) => a.days_until_deadline - b.days_until_deadline),
                    ...pending
                        .filter(r => r.days_until_deadline >= 0)
                        .sort((a, b) => a.days_until_deadline - b.days_until_deadline)
                ].slice(0, 3); // Only take top 3 for display

                // Update state with ALL counts (not just the displayed ones)
                setPendingReports(sortedReports);
                setStats({
                    totalCount: foreignDonations.length, // This is the total count of ALL foreign donations
                    pendingCount: pending.length,        // This is the count of ALL pending foreign donations
                    overdueCount: overdue.length,        // This is the count of ALL overdue foreign donations
                    totalAmount
                });

                console.log(`Stats updated: total=${foreignDonations.length}, pending=${pending.length}, overdue=${overdue.length}`);
            } catch (error) {
                console.error('Error fetching pending foreign donation reports:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPendingReports();
    }, []);

    // Get status icon based on report status and deadline
    const getStatusIcon = (report) => {
        if (report.days_until_deadline < 0) return <Warning fontSize="small" color="error" />;
        if (report.days_until_deadline <= 5) return <AccessTime fontSize="small" color="warning" />;

        switch(report.report_status) {
            case 'pending': return <HourglassEmpty fontSize="small" color="action" />;
            case 'sent': return <SendRounded fontSize="small" color="info" />;
            case 'acknowledged': return <Article fontSize="small" color="primary" />;
            case 'completed': return <CheckCircle fontSize="small" color="success" />;
            default: return <PublicOutlined fontSize="small" color="action" />;
        }
    };

    // Get status text based on days until deadline
    const getStatusText = (report) => {
        if (report.days_until_deadline < 0) return `En retard de ${Math.abs(report.days_until_deadline)} jours`;
        if (report.days_until_deadline <= 5) return `${report.days_until_deadline} jours restants`;

        switch(report.report_status) {
            case 'pending': return 'En attente';
            case 'sent': return 'Lettre envoyée';
            case 'acknowledged': return 'Accusé de réception';
            case 'completed': return 'Processus terminé';
            default: return 'À traiter';
        }
    };

    // Determine status colors
    const hasOverdue = stats.overdueCount > 0;
    const hasPending = stats.pendingCount > 0;
    const statusColor = hasOverdue ? "error" : hasPending ? "warning" : "success";

    return (
        <Paper
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                overflow: 'hidden',
                borderLeft: '4px solid',
                borderColor: `${statusColor}.main`,
                boxShadow: hasPending ?
                    `0 0 15px ${hasOverdue ? 'rgba(211, 47, 47, 0.2)' : 'rgba(237, 108, 2, 0.15)'}` :
                    'none',
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    p: 2.5,
                    bgcolor: `${statusColor}.lighter`,
                    borderBottom: '1px solid',
                    borderColor: `${statusColor}.light`,
                }}
            >
                <Box>
                    <Typography variant="h6" component="h3" fontWeight="bold">
                        Dons Étrangers
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Suivi des déclarations obligatoires
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {/* Show transaction button only for non-member roles */}
                    {hasTransactionAccess && (
                        <Tooltip title="Voir toutes les transactions" arrow>
                            <IconButton
                                size="small"
                                color="primary"
                                onClick={handleViewTransactions}
                                sx={{ mr: 1 }}
                            >
                                <ReceiptLong />
                            </IconButton>
                        </Tooltip>
                    )}
                    <Badge
                        badgeContent={stats.pendingCount}
                        color={statusColor}
                        invisible={!hasPending}
                        max={99}
                        sx={{ '& .MuiBadge-badge': { fontSize: '0.8rem', fontWeight: 'bold' } }}
                    >
                        <PublicOutlined fontSize="large" color={statusColor} />
                    </Badge>
                </Box>
            </Box>

            {/* Content */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4, flexGrow: 1 }}>
                    <CircularProgress size={32} />
                </Box>
            ) : (
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Stats Summary */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, pt: 2.5 }}>
                        <Box sx={{ textAlign: 'center', flex: 1 }}>
                            <Typography variant="h4" fontWeight="bold" color={hasOverdue ? "error.main" : "text.primary"}>
                                {stats.overdueCount}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                En retard
                            </Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem />
                        <Box sx={{ textAlign: 'center', flex: 1, position: 'relative' }}>
                            <Typography variant="h4" fontWeight="bold">
                                {stats.totalCount}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography variant="caption" color="text.secondary">
                                    Total
                                </Typography>
                                {/* Show arrow button only for non-member roles */}
                                {hasTransactionAccess && (
                                    <Tooltip title="Voir toutes les transactions" arrow>
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={handleViewTransactions}
                                            sx={{ ml: 0.5, p: 0.3 }}
                                        >
                                            <ArrowForward fontSize="inherit" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Box>
                        </Box>
                    </Box>
                    <Divider />

                    {/* Pending Reports List */}
                    {hasPending ? (
                        <List sx={{ py: 0 }}>
                            {pendingReports.map((report, index) => (
                                <React.Fragment key={report.id}>
                                    <ListItem sx={{ py: 1.5 }}>
                                        <ListItemIcon sx={{ minWidth: 40 }}>
                                            <Tooltip title={getStatusText(report)}>
                                                {getStatusIcon(report)}
                                            </Tooltip>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body2" noWrap>
                                                    {report.transaction_details?.donor_details?.name || "Donateur inconnu"}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography variant="caption" color="text.secondary" noWrap>
                                                    {formatCurrency(report.transaction_details?.amount || 0)} •
                                                    {report.transaction_details?.date ?
                                                        dayjs(report.transaction_details.date).format(' DD/MM/YYYY') :
                                                        ' Date inconnue'}
                                                </Typography>
                                            }
                                        />
                                        <Typography
                                            variant="caption"
                                            color={
                                                report.days_until_deadline < 0 ? "error.main" :
                                                    report.days_until_deadline <= 5 ? "warning.main" :
                                                        "text.secondary"
                                            }
                                            sx={{
                                                fontWeight: report.days_until_deadline <= 5 ? 'bold' : 'normal'
                                            }}
                                        >
                                            {getStatusText(report)}
                                        </Typography>
                                    </ListItem>
                                    {index < pendingReports.length - 1 && <Divider component="li" />}
                                </React.Fragment>
                            ))}

                            {/* Show indicator if there are more reports than what's displayed */}
                            {stats.pendingCount > pendingReports.length && hasTransactionAccess && (
                                <ListItem
                                    button
                                    onClick={onViewReports}
                                    sx={{
                                        py: 1,
                                        justifyContent: 'center',
                                        color: 'primary.main',
                                        '&:hover': { bgcolor: 'primary.lighter' }
                                    }}
                                >
                                    <Typography variant="body2" color="primary">
                                        {stats.pendingCount - pendingReports.length} rapport(s) supplémentaire(s) →
                                    </Typography>
                                </ListItem>
                            )}
                        </List>
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4, flexGrow: 1 }}>
                            <Typography variant="body1" color="success.main" fontWeight="medium" sx={{ display: 'flex', alignItems: 'center' }}>
                                <CheckCircle sx={{ mr: 1 }} /> Toutes les déclarations sont à jour
                            </Typography>
                        </Box>
                    )}
                </Box>
            )}
        </Paper>
    );
};

export default ForeignDonationsWidget;