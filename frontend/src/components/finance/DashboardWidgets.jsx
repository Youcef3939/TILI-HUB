import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import AxiosInstance from '../Axios';

// Composants de style avec une approche inspirée de Tailwind
import {
    Box,
    Card,
    CardContent,
    Chip,
    Button,
    Grid,
    LinearProgress,
    List,
    ListItem,
    ListItemText,
    Typography,
    useTheme,
    Paper,
    CircularProgress
} from '@mui/material';

// Icônes
import {
    AccountBalance,
    Assignment,
    Paid,
    Person,
    PieChart,
    ShowChart,
    TrendingDown,
    TrendingUp,
    Warning
} from '@mui/icons-material';

// Recharts pour les visualisations
import {
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart as RechartsPieChart,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    Legend,
    XAxis,
    YAxis
} from 'recharts';

import ForeignDonationsWidget from '/src/components/ForeignDonationsWidget.jsx';

// =============== FONCTIONS UTILITAIRES ===============

// Formater la devise avec le formatage TND approprié
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-TN', {
        style: 'currency',
        currency: 'TND',
        minimumFractionDigits: 2
    }).format(amount);
};

// Formater la devise compact pour les axes
const formatCompactCurrency = (amount) => {
    return new Intl.NumberFormat('fr-TN', {
        style: 'currency',
        currency: 'TND',
        notation: 'compact',
        maximumFractionDigits: 1
    }).format(amount);
};

// Générer une belle palette de couleurs pour les graphiques
const generateColorPalette = (count) => {
    // Palette de couleurs moderne et vibrante
    const baseColors = [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
        '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#06B6D4'
    ];

    // Retourner les couleurs nécessaires
    if (count <= baseColors.length) {
        return baseColors.slice(0, count);
    }

    // Générer des couleurs supplémentaires si nécessaire
    const extendedColors = [...baseColors];
    while (extendedColors.length < count) {
        const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
        extendedColors.push(randomColor);
    }

    return extendedColors;
};

// Formater les noms de catégorie pour un meilleur affichage
const formatCategoryName = (name) => {
    return name
        .replace(/_/g, ' ')
        .replace(/\b\w/g, letter => letter.toUpperCase());
};

// Carte de Tableau de Bord - Composant de base pour afficher des données récapitulatives
const DashboardCard = ({ title, icon, children, height = 'auto' }) => {
    const Icon = icon;

    return (
        <Card
            elevation={0}
            sx={{
                height: height,
                borderRadius: 4,
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.05)'
                }
            }}
        >
            <CardContent sx={{ height: '100%', p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="600" fontSize="1.1rem">
                        {title}
                    </Typography>
                    {icon && (
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            backgroundColor: 'primary.light',
                            color: 'primary.main'
                        }}>
                            <Icon fontSize="small" />
                        </Box>
                    )}
                </Box>
                {children}
            </CardContent>
        </Card>
    );
};

// Carte de Statistiques - Pour afficher les métriques financières
const StatCard = ({ title, amount, icon, color = 'primary', trend, subtitle }) => {
    const theme = useTheme();
    const colorMap = {
        primary: theme.palette.primary,
        success: theme.palette.success,
        error: theme.palette.error,
        warning: theme.palette.warning,
        info: theme.palette.info
    };

    const cardColor = colorMap[color] || colorMap.primary;

    return (
        <DashboardCard title={title} icon={icon}>
            <Typography
                variant="h4"
                component="div"
                fontWeight="700"
                sx={{
                    mb: 1,
                    color: cardColor.main,
                    fontSize: { xs: '1.5rem', sm: '1.75rem' }
                }}
            >
                {amount}
            </Typography>

            {subtitle && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {subtitle}
                </Typography>
            )}

            {trend !== null && trend !== undefined && (
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mt: 'auto',
                    pt: 1,
                    borderTop: '1px solid',
                    borderColor: 'divider'
                }}>
                    {trend > 0 ? (
                        <TrendingUp fontSize="small" color="success" sx={{ mr: 0.5 }} />
                    ) : (
                        <TrendingDown fontSize="small" color="error" sx={{ mr: 0.5 }} />
                    )}
                    <Typography
                        variant="body2"
                        color={trend > 0 ? 'success.main' : 'error.main'}
                        fontWeight="medium"
                    >
                        {trend > 0 ? '+' : ''}{trend}% {trend > 0 ? 'augmentation' : 'diminution'}
                    </Typography>
                </Box>
            )}
        </DashboardCard>
    );
};

// Élément de Transaction - Transaction individuelle dans la liste
const TransactionItem = ({ transaction }) => {
    const formattedDate = dayjs(transaction.date).format('DD MMM, YYYY');
    const isIncome = transaction.transaction_type === 'income';

    return (
        <ListItem
            divider
            sx={{
                px: 2,
                py: 1.5,
                transition: 'background-color 0.2s',
                '&:hover': {
                    backgroundColor: 'action.hover'
                }
            }}
        >
            <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                {/* Indicateur de transaction */}
                <Box
                    sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: isIncome ? 'success.main' : 'error.main',
                        mr: 2
                    }}
                />

                {/* Détails de la transaction */}
                <ListItemText
                    primary={
                        <Typography variant="body2" fontWeight="500">
                            {transaction.description?.length > 40
                                ? transaction.description.substring(0, 40) + '...'
                                : transaction.description}
                        </Typography>
                    }
                    secondary={formattedDate}
                    sx={{ flex: 2 }}
                />

                {/* Montant et type de transaction */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Typography
                        variant="body2"
                        fontWeight="600"
                        sx={{
                            color: isIncome ? 'success.main' : 'error.main',
                            mr: 1
                        }}
                    >
                        {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </Typography>
                    <Chip
                        label={isIncome ? 'Revenu' : 'Dépense'}
                        size="small"
                        sx={{
                            backgroundColor: isIncome ? 'success.light' : 'error.light',
                            color: isIncome ? 'success.dark' : 'error.dark',
                            fontWeight: 500,
                            fontSize: '0.7rem',
                            borderRadius: '4px'
                        }}
                    />
                </Box>
            </Box>
        </ListItem>
    );
};

// Barre de Progression du Budget - Pour la visualisation du budget de projet
const BudgetProgress = ({ project, utilization, allocated, used }) => {
    const theme = useTheme();

    // Déterminer la couleur en fonction du pourcentage d'utilisation
    const getColor = (percent) => {
        if (percent < 50) return theme.palette.success.main;
        if (percent < 75) return theme.palette.warning.main;
        return theme.palette.error.main;
    };

    return (
        <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" fontWeight="500">
                    {project}
                </Typography>
                <Typography variant="body2" fontWeight="medium" color={getColor(utilization)}>
                    {Math.round(utilization)}%
                </Typography>
            </Box>
            <LinearProgress
                variant="determinate"
                value={Math.min(utilization, 100)}
                sx={{
                    height: 8,
                    borderRadius: 5,
                    backgroundColor: theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                        backgroundColor: getColor(utilization)
                    }
                }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                    Utilisé: {formatCurrency(used)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Budget: {formatCurrency(allocated)}
                </Typography>
            </Box>
        </Box>
    );
};

// Composants de Graphiques
const DonutChart = ({ data, title, emptyMessage }) => {
    const colors = generateColorPalette(data.length);

    // Rendu personnalisé d'étiquette de graphique en secteurs pour une meilleure lisibilité
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        // Afficher l'étiquette uniquement si le pourcentage est suffisamment significatif
        if (percent < 0.05) return null;

        return (
            <text
                x={x}
                y={y}
                fill="#fff"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                fontSize={12}
                fontWeight="bold"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <DashboardCard title={title} icon={PieChart} height="100%">
            {data.length > 0 ? (
                <Box sx={{ height: 240, mt: 1 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                innerRadius={40}
                                dataKey="value"
                                label={renderCustomizedLabel}
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={colors[index % colors.length]}
                                        stroke="none"
                                    />
                                ))}
                            </Pie>
                            <RechartsTooltip
                                formatter={(value, name) => [formatCurrency(value), name]}
                                contentStyle={{
                                    borderRadius: 8,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    border: 'none'
                                }}
                            />
                            <Legend
                                formatter={(value) => value}
                                layout="horizontal"
                                verticalAlign="bottom"
                                align="center"
                            />
                        </RechartsPieChart>
                    </ResponsiveContainer>
                </Box>
            ) : (
                <Box sx={{
                    height: 240,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'action.hover',
                    borderRadius: 2,
                    flexDirection: 'column'
                }}>
                    <Typography variant="body1" color="text.secondary" textAlign="center">
                        {emptyMessage || 'Aucune donnée disponible'}
                    </Typography>
                </Box>
            )}
        </DashboardCard>
    );
};

// Graphique de Tendance Financière - Pour les tendances des revenus/dépenses
const TrendChart = ({ data, title, dateFilter }) => {
    const theme = useTheme();
    const [showCumulative, setShowCumulative] = useState(false);

    return (
        <DashboardCard title={title} icon={ShowChart}>
            <Box sx={{ height: 300, mt: 1 }}>
                {data && data.length > 0 ? (
                    <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                {dateFilter?.displayLabel}
                            </Typography>
                            <Button
                                size="small"
                                onClick={() => setShowCumulative(!showCumulative)}
                                sx={{ textTransform: 'none' }}
                            >
                                {showCumulative ? 'Afficher les valeurs journalières' : 'Afficher les valeurs cumulatives'}
                            </Button>
                        </Box>
                        <ResponsiveContainer width="100%" height="90%">
                            <LineChart
                                data={data}
                                margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12 }}
                                    stroke={theme.palette.text.secondary}
                                />
                                <YAxis
                                    tickFormatter={formatCompactCurrency}
                                    stroke={theme.palette.text.secondary}
                                />
                                <RechartsTooltip
                                    formatter={(value) => formatCurrency(value)}
                                    labelFormatter={(label) => `Date: ${label}`}
                                    contentStyle={{
                                        backgroundColor: theme.palette.background.paper,
                                        borderRadius: 8,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        border: 'none'
                                    }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey={showCumulative ? "cumulativeIncome" : "income"}
                                    stroke={theme.palette.success.main}
                                    strokeWidth={2}
                                    activeDot={{ r: 6 }}
                                    name={showCumulative ? "Revenu Cumulatif" : "Revenu Journalier"}
                                    dot={{ strokeWidth: 0, r: 3 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey={showCumulative ? "cumulativeExpense" : "expense"}
                                    stroke={theme.palette.error.main}
                                    strokeWidth={2}
                                    name={showCumulative ? "Dépense Cumulative" : "Dépense Journalière"}
                                    dot={{ strokeWidth: 0, r: 3 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey={showCumulative ? "cumulativeBalance" : "balance"}
                                    stroke={theme.palette.primary.main}
                                    strokeWidth={2}
                                    name={showCumulative ? "Solde Cumulatif" : "Solde Journalier"}
                                    dot={{ strokeWidth: 0, r: 3 }}
                                    strokeDasharray="4 4"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </>
                ) : (
                    <Box sx={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'action.hover',
                        borderRadius: 2,
                        flexDirection: 'column'
                    }}>
                        <Typography variant="body1" color="text.secondary" textAlign="center">
                            Aucune donnée de tendance disponible
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Commencez à enregistrer des transactions pour voir les tendances financières
                        </Typography>
                    </Box>
                )}
            </Box>
        </DashboardCard>
    );
};

const EnhancedDashboard = ({ statistics, recentTransactions, dateFilter, setActiveTab }) => {
    const navigate = useNavigate();
    const theme = useTheme();

    // DEBUG: Add detailed logging to diagnose the issue
    console.log("Statistics received:", statistics);

    // The issue appears to be with serialization of the Decimal object from Django
    // We'll apply multiple strategies to extract the membership fee value

    // Create state for corrected membership fees value
    const [correctedMembershipFees, setCorrectedMembershipFees] = useState(0);

    const [incomeChartData, setIncomeChartData] = useState([]);
    const [expenseChartData, setExpenseChartData] = useState([]);
    const [monthlyTrendData, setMonthlyTrendData] = useState([]);
    const [incomeTrend, setIncomeTrend] = useState(null);
    const [expenseTrend, setExpenseTrend] = useState(null);

    // Dedicated effect to properly extract the membership fees value
    useEffect(() => {
        if (!statistics) return;

        // Extract the membership fees using multiple approaches
        let membershipValue = 0;

        // 1. Try direct extraction from total_membership_fees with type handling
        if (statistics.total_membership_fees !== undefined && statistics.total_membership_fees !== null) {
            const rawValue = statistics.total_membership_fees;
            console.log("Raw membership fees:", rawValue, typeof rawValue);

            try {
                // Handle different possible types
                if (typeof rawValue === 'string') {
                    membershipValue = parseFloat(rawValue.replace(/[^\d.-]/g, ''));
                } else if (typeof rawValue === 'number') {
                    membershipValue = rawValue;
                } else {
                    // Handle potential serialized objects
                    membershipValue = Number(rawValue);
                }

                console.log("Parsed membership value:", membershipValue);
            } catch (error) {
                console.error("Error parsing membership fees:", error);
            }
        }

        // 2. If that didn't work, check income_by_category
        if ((membershipValue === 0 || isNaN(membershipValue)) && statistics.income_by_category) {
            console.log("Checking income categories:", statistics.income_by_category);

            // Look for keys that might represent membership fees
            const membershipKeys = ['membership_fee', 'membership', 'cotisation', 'cotisations'];

            for (const key of membershipKeys) {
                if (statistics.income_by_category[key]) {
                    try {
                        let categoryValue = statistics.income_by_category[key];
                        console.log(`Found category ${key} with value:`, categoryValue, typeof categoryValue);

                        // Parse the value based on its type
                        if (typeof categoryValue === 'string') {
                            categoryValue = parseFloat(categoryValue.replace(/[^\d.-]/g, ''));
                        } else if (typeof categoryValue !== 'number') {
                            categoryValue = Number(categoryValue);
                        }

                        if (categoryValue > 0 && !isNaN(categoryValue)) {
                            membershipValue = categoryValue;
                            console.log(`Using membership fees from category '${key}':`, membershipValue);
                            break;
                        }
                    } catch (error) {
                        console.error(`Error processing category ${key}:`, error);
                    }
                }
            }
        }

        // 3. Final fallback: manually extract from income data
        if ((membershipValue === 0 || isNaN(membershipValue)) && statistics.recent_transactions) {
            console.log("Searching recent transactions for membership fees");

            // Look for membership fee transactions
            const membershipTransactions = statistics.recent_transactions.filter(t =>
                t.transaction_type === 'income' &&
                (t.category === 'membership_fee' ||
                    t.category === 'membership' ||
                    t.category === 'cotisation' ||
                    t.category === 'cotisations')
            );

            if (membershipTransactions.length > 0) {
                membershipValue = membershipTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
                console.log("Calculated membership fees from transactions:", membershipValue);
            }
        }

        // Set the corrected value
        console.log("Final membership value to use:", membershipValue);
        setCorrectedMembershipFees(membershipValue);

    }, [statistics]);

    // Effect to handle chart data processing
    useEffect(() => {
        if (!statistics) return;

        try {
            // Process income data for pie chart
            const incomeByCategory = { ...statistics?.income_by_category } || {};

            // Make sure the membership fees are represented in the chart
            if (correctedMembershipFees > 0) {
                // Only add if not already present
                const hasMembershipCategory = Object.keys(incomeByCategory).some(
                    key => key.includes('membership') || key.includes('cotisation')
                );

                if (!hasMembershipCategory) {
                    incomeByCategory['cotisations'] = correctedMembershipFees;
                    console.log("Added cotisations category with value:", correctedMembershipFees);
                }
            }

            // Format income data for chart
            const incomeData = Object.entries(incomeByCategory)
                .filter(([name, value]) => {
                    const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
                    return numValue > 0 && !isNaN(numValue);
                })
                .map(([name, value]) => ({
                    name: formatCategoryName(name),
                    value: typeof value === 'string' ? parseFloat(value) : Number(value)
                }));
            setIncomeChartData(incomeData);
            console.log("Income chart data:", incomeData);

            // Traiter les données de dépenses par catégorie pour le graphique circulaire
            const expenseData = Object.entries(statistics?.expenses_by_category || {})
                .filter(([name, value]) => {
                    const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
                    return numValue > 0 && !isNaN(numValue);
                })
                .map(([name, value]) => ({
                    name: formatCategoryName(name),
                    value: typeof value === 'string' ? parseFloat(value) : Number(value)
                }));
            setExpenseChartData(expenseData);

            // Process trend data
            const trendData = generateTrendDataFromDateRange();
            if (trendData && trendData.length > 0) {
                setMonthlyTrendData(trendData);
                const { incomeTrend, expenseTrend } = calculateTrends(trendData);
                setIncomeTrend(incomeTrend);
                setExpenseTrend(expenseTrend);
            } else {
                setMonthlyTrendData([]);
                setIncomeTrend(null);
                setExpenseTrend(null);
            }
        } catch (error) {
            console.error("Error processing chart data:", error);
        }
    }, [statistics, recentTransactions, dateFilter, correctedMembershipFees]);

    // Génère les données de tendance en fonction de la plage de dates filtrée
    const generateTrendDataFromDateRange = () => {
        if (!dateFilter || !recentTransactions) return [];

        // Convertir les dates du filtre en objets dayjs
        const startDate = dayjs(dateFilter.startDate);
        const endDate = dayjs(dateFilter.endDate);

        // Calculer la différence en jours
        const diffDays = endDate.diff(startDate, 'day') + 1;

        // Déterminer l'intervalle d'échantillonnage approprié
        let interval = 1; // Par défaut, données journalières
        let intervalUnit = 'day';

        // Pour les périodes plus longues, regrouper les données
        if (diffDays > 60) {
            interval = 7; // Hebdomadaire
            intervalUnit = 'week';
        } else if (diffDays > 30) {
            interval = 3; // Tous les 3 jours
            intervalUnit = 'day';
        }

        // Créer un tableau pour les données de tendance
        const trendData = [];

        // Générer des points de données pour chaque intervalle dans la plage de dates
        let currentDate = startDate;
        while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
            // Format pour l'affichage
            const name = currentDate.format('DD MMM');

            // Filtrer les transactions pour cette date ou intervalle
            const periodTrans = recentTransactions.filter(t => {
                if (!t.date) return false;
                const transDate = dayjs(t.date);

                if (intervalUnit === 'day') {
                    return transDate.isSame(currentDate, 'day');
                } else if (intervalUnit === 'week') {
                    return transDate.isAfter(currentDate.subtract(interval, 'day')) &&
                        transDate.isBefore(currentDate.add(1, 'day'));
                }
                return false;
            });

            // Calculer les revenus et dépenses pour cette période
            const periodIncome = periodTrans
                .filter(t => t.transaction_type === 'income')
                .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

            const periodExpense = periodTrans
                .filter(t => t.transaction_type === 'expense')
                .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

            // Ajouter le point de données au tableau
            trendData.push({
                name,
                date: currentDate.format('YYYY-MM-DD'),
                income: periodIncome,
                expense: periodExpense,
                balance: periodIncome - periodExpense
            });

            // Avancer à la prochaine date/période
            currentDate = currentDate.add(interval, intervalUnit);
        }

        // Calculer les totaux cumulatifs
        let cumulativeIncome = 0;
        let cumulativeExpense = 0;

        return trendData.map(day => {
            cumulativeIncome += day.income;
            cumulativeExpense += day.expense;

            return {
                ...day,
                cumulativeIncome,
                cumulativeExpense,
                cumulativeBalance: cumulativeIncome - cumulativeExpense
            };
        });
    };

    // Calcule les tendances en pourcentage en comparant les périodes récentes aux précédentes
    const calculateTrends = (trendData) => {
        if (!trendData || trendData.length < 4) return { incomeTrend: null, expenseTrend: null };

        // Diviser les données en deux moitiés pour la comparaison
        const midPoint = Math.floor(trendData.length / 2);
        const recentPeriod = trendData.slice(midPoint);
        const previousPeriod = trendData.slice(0, midPoint);

        // Calculer les totaux pour chaque période
        const recentIncome = recentPeriod.reduce((sum, day) => sum + day.income, 0);
        const previousIncome = previousPeriod.reduce((sum, day) => sum + day.income, 0);
        const recentExpense = recentPeriod.reduce((sum, day) => sum + day.expense, 0);
        const previousExpense = previousPeriod.reduce((sum, day) => sum + day.expense, 0);

        // Calculer les changements en pourcentage
        const incomeTrend = previousIncome !== 0
            ? Math.round(((recentIncome - previousIncome) / previousIncome) * 100)
            : null;

        const expenseTrend = previousExpense !== 0
            ? Math.round(((recentExpense - previousExpense) / previousExpense) * 100)
            : null;

        return { incomeTrend, expenseTrend };
    };

    // Récupère le libellé approprié pour les cartes de statistiques
    const getStatCardSubtitle = () => {
        return dateFilter?.displayLabel || '30 derniers jours';
    };

    return (
        <Box sx={{ pb: 6 }}>
            {/* En-tête du tableau de bord */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="700" sx={{ mb: 1 }}>
                    Tableau de Bord Financier
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Suivez la santé financière et la performance de votre organisation
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Première ligne - Cartes de synthèse financière */}
                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                    <StatCard
                        title="Revenu Total"
                        amount={formatCurrency(statistics?.total_income || 0)}
                        icon={TrendingUp}
                        color="success"
                        trend={incomeTrend}
                        subtitle={getStatCardSubtitle()}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                    <StatCard
                        title="Dépenses Totales"
                        amount={formatCurrency(statistics?.total_expenses || 0)}
                        icon={TrendingDown}
                        color="error"
                        trend={expenseTrend}
                        subtitle={getStatCardSubtitle()}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                    <StatCard
                        title="Solde Net"
                        amount={formatCurrency(statistics?.net_balance || 0)}
                        icon={AccountBalance}
                        color="primary"
                        subtitle="Pour la période sélectionnée"
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                    <StatCard
                        title="Dons"
                        amount={formatCurrency(statistics?.total_donations || 0)}
                        icon={Paid}
                        color="warning"
                        subtitle={getStatCardSubtitle()}
                    />
                </Grid>

                {/* Use correctedMembershipFees instead of membershipFees */}
                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                    <StatCard
                        title="Cotisations"
                        amount={formatCurrency(correctedMembershipFees)}
                        icon={Person}
                        color="info"
                        subtitle={getStatCardSubtitle()}
                    />
                </Grid>

                {/* Section médiane - Graphiques */}
                <Grid item xs={12} md={8}>
                    <TrendChart
                        data={monthlyTrendData}
                        title="Tendances Financières"
                        dateFilter={dateFilter}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <ForeignDonationsWidget onViewReports={() => setActiveTab && setActiveTab(2)} />
                </Grid>

                {/* Colonne droite - Transactions récentes */}
                <Grid item xs={12} md={4}>
                    <DashboardCard
                        title="Transactions Récentes"
                        height="100%"
                    >
                        <List sx={{
                            width: '100%',
                            bgcolor: 'background.paper',
                            maxHeight: 320,
                            overflow: 'auto',
                            '&::-webkit-scrollbar': {
                                width: '0.4em'
                            },
                            '&::-webkit-scrollbar-track': {
                                background: 'transparent'
                            },
                            '&::-webkit-scrollbar-thumb': {
                                backgroundColor: theme.palette.divider,
                                borderRadius: 8
                            }
                        }}>
                            {recentTransactions && recentTransactions.length > 0 ? (
                                recentTransactions.map((transaction) => (
                                    <TransactionItem key={transaction.id} transaction={transaction} />
                                ))
                            ) : (
                                <ListItem>
                                    <ListItemText
                                        primary="Aucune transaction récente"
                                        primaryTypographyProps={{
                                            align: 'center',
                                            color: 'text.secondary',
                                            sx: { py: 4 }
                                        }}
                                    />
                                </ListItem>
                            )}
                        </List>
                    </DashboardCard>
                </Grid>

                {/* Ligne inférieure - Graphiques circulaires et budgets de projet */}
                <Grid item xs={12} md={4}>
                    <DonutChart
                        data={incomeChartData}
                        title="Revenus par Catégorie"
                        emptyMessage="Aucune donnée de revenu disponible"
                    />
                </Grid>

                <Grid item xs={12} md={4}>
                    <DonutChart
                        data={expenseChartData}
                        title="Dépenses par Catégorie"
                        emptyMessage="Aucune donnée de dépense disponible"
                    />
                </Grid>

                <Grid item xs={12} md={4}>
                    <DashboardCard
                        title="Budgets des Projets"
                        icon={Assignment}
                        height="100%"
                    >
                        {statistics?.project_budget_utilization && statistics.project_budget_utilization.length > 0 ? (
                            <Box sx={{ mt: 1 }}>
                                {statistics.project_budget_utilization.map((project, index) => (
                                    <BudgetProgress
                                        key={index}
                                        project={project.project}
                                        utilization={project.utilization}
                                        allocated={project.allocated}
                                        used={project.used}
                                    />
                                ))}
                            </Box>
                        ) : (
                            <Box sx={{
                                height: 150,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'action.hover',
                                borderRadius: 2,
                                flexDirection: 'column'
                            }}>
                                <Typography variant="body1" color="text.secondary">
                                    Aucun budget de projet disponible
                                </Typography>
                            </Box>
                        )}
                    </DashboardCard>
                </Grid>
            </Grid>
        </Box>
    );
};

export default EnhancedDashboard;