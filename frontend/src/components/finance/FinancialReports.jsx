import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    IconButton,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    Tooltip,
    useTheme,
    useMediaQuery,
    Divider,
    Stack
} from '@mui/material';
import {
    Add,
    Refresh,
    Delete,
    Download,
    FileCopy,
    Description,
    InsertDriveFile,
    CloudDownload,
    CalendarToday,
    Assignment,
    AssignmentTurnedIn,
    AssignmentLate,
    Info
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import AxiosInstance from '../Axios';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatDate = (dateString) => {
    return dayjs(dateString).format('DD/MM/YYYY');
};

// ============================================================================
// GENERATE REPORT DIALOG
// ============================================================================

const GenerateReportDialog = ({ open, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        report_type: 'monthly',
        title: '',
        start_date: null,
        end_date: null,
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatingReport, setGeneratingReport] = useState(false);

    useEffect(() => {
        if (open) {
            setFormData({
                report_type: 'monthly',
                title: '',
                start_date: null,
                end_date: null,
                notes: ''
            });
            setError('');
            setGeneratingReport(false);
        }
    }, [open]);

    useEffect(() => {
        if (formData.report_type && (!formData.title || formData.title.startsWith('Rapport Mensuel') ||
            formData.title.startsWith('Rapport Trimestriel') || formData.title.startsWith('Rapport Annuel') ||
            formData.title.startsWith('Rapport Personnalisé'))) {

            let newTitle = '';
            const currentDate = dayjs();

            switch (formData.report_type) {
                case 'monthly':
                    newTitle = `Rapport Mensuel - ${currentDate.subtract(1, 'month').format('MMMM YYYY')}`;
                    break;
                case 'quarterly':
                    const currentQuarter = Math.floor((currentDate.month()) / 3);
                    newTitle = `Rapport Trimestriel - T${currentQuarter} ${currentDate.year()}`;
                    break;
                case 'annual':
                    newTitle = `Rapport Annuel - ${currentDate.subtract(1, 'year').year()}`;
                    break;
                case 'custom':
                    newTitle = 'Rapport Personnalisé';
                    if (formData.start_date && formData.end_date) {
                        newTitle = `Rapport Personnalisé - ${formatDate(formData.start_date)} à ${formatDate(formData.end_date)}`;
                    }
                    break;
                default:
                    newTitle = 'Rapport Financier';
            }

            setFormData(prev => ({ ...prev, title: newTitle }));
        }
    }, [formData.report_type, formData.start_date, formData.end_date]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        setError('');
    };

    const handleDateChange = (name, date) => {
        setFormData({
            ...formData,
            [name]: date
        });
    };

    const validateForm = () => {
        if (!formData.title.trim()) {
            setError('Le titre du rapport est requis');
            return false;
        }

        if (formData.report_type === 'custom') {
            if (!formData.start_date || !formData.end_date) {
                setError('Les dates de début et de fin sont requises pour les rapports personnalisés');
                return false;
            }

            if (dayjs(formData.start_date).isAfter(formData.end_date)) {
                setError('La date de début ne peut pas être postérieure à la date de fin');
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        setGeneratingReport(true);
        setError('');

        try {
            const payload = {
                report_type: formData.report_type,
                title: formData.title,
                notes: formData.notes
            };

            if (formData.report_type === 'custom') {
                payload.start_date = dayjs(formData.start_date).format('YYYY-MM-DD');
                payload.end_date = dayjs(formData.end_date).format('YYYY-MM-DD');
            }

            const response = await AxiosInstance.post('/finances/financial-reports/generate_report/', payload);
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Erreur lors de la génération du rapport:', err);
            let errorMessage = 'Échec de la génération du rapport';

            if (err.response) {
                if (err.response.data && err.response.data.error) {
                    errorMessage = err.response.data.error;
                } else if (err.response.status === 500) {
                    errorMessage = 'Erreur serveur lors de la génération du rapport. Veuillez réessayer plus tard.';
                }
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
            setGeneratingReport(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : onClose}
            maxWidth="md"
            fullWidth
            disableEscapeKeyDown={loading}
        >
            <DialogTitle>
                <Box display="flex" alignItems="center">
                    <Description sx={{ mr: 1 }} />
                    <Typography variant="h6">
                        Générer un Rapport Financier
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {generatingReport && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            <Typography>
                                Génération du rapport en cours... Cela peut prendre un moment.
                            </Typography>
                        </Box>
                    </Alert>
                )}

                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Type de Rapport</InputLabel>
                            <Select
                                name="report_type"
                                value={formData.report_type}
                                onChange={handleChange}
                                label="Type de Rapport"
                                disabled={loading}
                            >
                                <MenuItem value="monthly">Rapport Mensuel</MenuItem>
                                <MenuItem value="quarterly">Rapport Trimestriel</MenuItem>
                                <MenuItem value="annual">Rapport Annuel</MenuItem>
                                <MenuItem value="custom">Période Personnalisée</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            name="title"
                            label="Titre du Rapport"
                            fullWidth
                            margin="normal"
                            value={formData.title}
                            onChange={handleChange}
                            disabled={loading}
                            required
                        />
                    </Grid>

                    {formData.report_type === 'custom' && (
                        <>
                            <Grid item xs={12} sm={6}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="Date de Début"
                                        value={formData.start_date}
                                        onChange={(date) => handleDateChange('start_date', date)}
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                margin: 'normal',
                                                required: true,
                                                disabled: loading
                                            }
                                        }}
                                    />
                                </LocalizationProvider>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="Date de Fin"
                                        value={formData.end_date}
                                        onChange={(date) => handleDateChange('end_date', date)}
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                margin: 'normal',
                                                required: true,
                                                disabled: loading
                                            }
                                        }}
                                    />
                                </LocalizationProvider>
                            </Grid>
                        </>
                    )}

                    <Grid item xs={12}>
                        <TextField
                            name="notes"
                            label="Notes"
                            fullWidth
                            multiline
                            rows={3}
                            margin="normal"
                            value={formData.notes}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </Grid>
                </Grid>

                <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        <Info fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Informations sur le Rapport
                    </Typography>
                    <Typography variant="body2">
                        {formData.report_type === 'monthly' &&
                            "Les rapports mensuels incluent les données financières du mois complet précédent."}
                        {formData.report_type === 'quarterly' &&
                            "Les rapports trimestriels incluent les données financières du trimestre complet précédent."}
                        {formData.report_type === 'annual' &&
                            "Les rapports annuels incluent les données financières de l'exercice fiscal complet précédent."}
                        {formData.report_type === 'custom' &&
                            "Les rapports personnalisés vous permettent de spécifier votre propre période pour les données financières."}
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Annuler
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {loading ? 'Génération...' : 'Générer le Rapport'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ============================================================================
// STATUS & TYPE CHIPS
// ============================================================================

const ReportStatusChip = ({ status }) => {
    if (status === 'finalized') {
        return (
            <Chip
                size="small"
                color="success"
                icon={<AssignmentTurnedIn fontSize="small" />}
                label="Finalisé"
                sx={{ fontWeight: 500 }}
            />
        );
    }
    return (
        <Chip
            size="small"
            color="warning"
            icon={<AssignmentLate fontSize="small" />}
            label="Brouillon"
            sx={{ fontWeight: 500 }}
        />
    );
};

const ReportTypeChip = ({ type }) => {
    const getTypeConfig = (type) => {
        switch (type) {
            case 'monthly':
                return { label: 'Mensuel', color: 'primary.light', textColor: 'primary.dark' };
            case 'quarterly':
                return { label: 'Trimestriel', color: 'success.light', textColor: 'success.dark' };
            case 'annual':
                return { label: 'Annuel', color: 'secondary.light', textColor: 'secondary.dark' };
            case 'custom':
                return { label: 'Personnalisé', color: 'info.light', textColor: 'info.dark' };
            default:
                return { label: type, color: 'grey.300', textColor: 'text.primary' };
        }
    };

    const config = getTypeConfig(type);

    return (
        <Chip
            size="small"
            label={config.label}
            sx={{
                bgcolor: config.color,
                color: config.textColor,
                fontWeight: 500,
                fontSize: '0.75rem'
            }}
        />
    );
};

// ============================================================================
// MOBILE REPORT CARD COMPONENT
// ============================================================================

const MobileReportCard = ({ report, onDownload, onFinalize, onDelete }) => {
    const theme = useTheme();

    return (
        <Card sx={{ mb: 2, borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Typography variant="subtitle1" fontWeight="600" sx={{ flex: 1, pr: 1 }}>
                        {report.title}
                    </Typography>
                    <ReportStatusChip status={report.status} />
                </Box>

                <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>
                            Type:
                        </Typography>
                        <ReportTypeChip type={report.report_type} />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>
                            Période:
                        </Typography>
                        <Typography variant="body2">
                            {formatDate(report.start_date)} - {formatDate(report.end_date)}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>
                            Créé:
                        </Typography>
                        <Typography variant="body2">
                            {formatDate(report.created_at)}
                        </Typography>
                    </Box>
                </Stack>

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    {report.report_file && (
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<CloudDownload fontSize="small" />}
                            onClick={() => onDownload(report)}
                        >
                            Télécharger
                        </Button>
                    )}

                    {report.status === 'draft' && (
                        <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            startIcon={<AssignmentTurnedIn fontSize="small" />}
                            onClick={() => onFinalize(report)}
                        >
                            Finaliser
                        </Button>
                    )}

                    <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDelete(report)}
                    >
                        <Delete fontSize="small" />
                    </IconButton>
                </Box>
            </CardContent>
        </Card>
    );
};

// ============================================================================
// MAIN FINANCIAL REPORTS COMPONENT
// ============================================================================

const FinancialReports = ({ onRefresh }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchReports = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await AxiosInstance.get('/finances/financial-reports/');
            setReports(response.data);
        } catch (err) {
            console.error('Erreur lors de la récupération des rapports:', err);
            setError('Échec du chargement des rapports financiers. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleDeleteReport = (report) => {
        setSelectedReport(report);
        setDeleteDialogOpen(true);
    };

    const confirmDeleteReport = async () => {
        if (!selectedReport) return;

        setActionLoading(true);
        try {
            await AxiosInstance.delete(`/finances/financial-reports/${selectedReport.id}/`);
            setDeleteDialogOpen(false);
            setSelectedReport(null);
            fetchReports();
            if (onRefresh) {
                onRefresh();
            }
        } catch (err) {
            console.error('Erreur lors de la suppression du rapport:', err);
            setError('Échec de la suppression du rapport');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDownloadReport = (report) => {
        if (report.id) {
            AxiosInstance.get(`/finances/financial-reports/${report.id}/download/`, {
                responseType: 'blob'
            })
                .then(response => {
                    let filename;
                    const contentDisposition = response.headers['content-disposition'];
                    if (contentDisposition) {
                        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
                        if (fileNameMatch.length === 2) {
                            filename = fileNameMatch[1];
                        }
                    }

                    if (!filename) {
                        filename = `rapport_${report.id}.xlsx`;
                    }

                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', filename);
                    document.body.appendChild(link);
                    link.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(link);
                })
                .catch(error => {
                    console.error('Erreur lors du téléchargement du rapport:', error);
                });
        }
    };

    const handleReportGenerationSuccess = () => {
        fetchReports();
        if (onRefresh) {
            onRefresh();
        }
    };

    const handleFinalizeReport = async (report) => {
        try {
            try {
                await AxiosInstance.patch(`/finances/financial-reports/${report.id}/`, {
                    status: 'finalized'
                });
                fetchReports();
            } catch (err) {
                if (err.response && err.response.status === 405) {
                    await AxiosInstance.post(`/finances/financial-reports/${report.id}/finalize/`);
                    fetchReports();
                } else {
                    throw err;
                }
            }
        } catch (err) {
            console.error('Erreur lors de la finalisation du rapport:', err);
            setError('Échec de la finalisation du rapport');
        }
    };

    return (
        <Box sx={{ px: { xs: 1, sm: 2 }, py: 2 }}>
            {/* Header - ✅ FIXED FOR MOBILE */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 2, sm: 0 },
                mb: 3
            }}>
                <Typography
                    variant="h5"
                    component="h2"
                    fontWeight="bold"
                    sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
                >
                    Rapports Financiers
                </Typography>

                <Box sx={{
                    display: 'flex',
                    gap: 1.5,
                    width: { xs: '100%', sm: 'auto' },
                    flexDirection: { xs: 'column', sm: 'row' }
                }}>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={fetchReports}
                        disabled={loading}
                        fullWidth
                        sx={{ height: 44, fontWeight: 600 }}
                    >
                        Actualiser
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setGenerateDialogOpen(true)}
                        disabled={loading}
                        fullWidth
                        sx={{ height: 44, fontWeight: 600 }}
                    >
                        Générer un Rapport
                    </Button>
                </Box>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Loading */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Reports List */}
            {!loading && (
                <>
                    {reports.length === 0 ? (
                        <Paper sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center', borderRadius: 2 }}>
                            <Assignment color="info" sx={{ fontSize: 48, mb: 2, opacity: 0.7 }} />
                            <Typography variant="h6" gutterBottom>
                                Aucun Rapport Financier
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Aucun rapport financier n'a encore été généré. Générez votre premier rapport pour commencer.
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => setGenerateDialogOpen(true)}
                                fullWidth={isMobile}
                                sx={{ minWidth: { sm: 200 } }}
                            >
                                Générer le Premier Rapport
                            </Button>
                        </Paper>
                    ) : (
                        <>
                            {/* Mobile View - Cards */}
                            {isMobile ? (
                                <Box>
                                    {reports
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((report) => (
                                            <MobileReportCard
                                                key={report.id}
                                                report={report}
                                                onDownload={handleDownloadReport}
                                                onFinalize={handleFinalizeReport}
                                                onDelete={handleDeleteReport}
                                            />
                                        ))}
                                </Box>
                            ) : (
                                /* Desktop View - Table */
                                <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto', borderRadius: 2 }}>
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Titre</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Période</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Créé</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {reports
                                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                .map((report) => (
                                                    <TableRow key={report.id} hover>
                                                        <TableCell>
                                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                {report.title}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <ReportTypeChip type={report.report_type} />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2">
                                                                {formatDate(report.start_date)} - {formatDate(report.end_date)}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <ReportStatusChip status={report.status} />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2">
                                                                {formatDate(report.created_at)}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex' }}>
                                                                {report.report_file && (
                                                                    <Tooltip title="Télécharger le Rapport">
                                                                        <IconButton
                                                                            size="small"
                                                                            color="primary"
                                                                            onClick={() => handleDownloadReport(report)}
                                                                        >
                                                                            <CloudDownload fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}

                                                                {report.status === 'draft' && (
                                                                    <Tooltip title="Finaliser le Rapport">
                                                                        <IconButton
                                                                            size="small"
                                                                            color="success"
                                                                            onClick={() => handleFinalizeReport(report)}
                                                                        >
                                                                            <AssignmentTurnedIn fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}

                                                                <Tooltip title="Supprimer le Rapport">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="error"
                                                                        onClick={() => handleDeleteReport(report)}
                                                                    >
                                                                        <Delete fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}

                            {/* Pagination */}
                            <TablePagination
                                rowsPerPageOptions={[5, 10, 25, 50]}
                                component="div"
                                count={reports.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                sx={{
                                    borderTop: 'none',
                                    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                    }
                                }}
                                labelRowsPerPage="Lignes par page :"
                                labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
                            />
                        </>
                    )}
                </>
            )}

            {/* Dialogs */}
            <GenerateReportDialog
                open={generateDialogOpen}
                onClose={() => setGenerateDialogOpen(false)}
                onSuccess={handleReportGenerationSuccess}
            />

            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirmer la Suppression</DialogTitle>
                <DialogContent>
                    <Typography>
                        Êtes-vous sûr de vouloir supprimer ce rapport ? Cette action ne peut pas être annulée.
                    </Typography>
                    {selectedReport && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: theme.palette.grey[100], borderRadius: 1 }}>
                            <Typography variant="subtitle2">
                                {selectedReport.title}
                            </Typography>
                            <Typography variant="body2">
                                {formatDate(selectedReport.start_date)} au {formatDate(selectedReport.end_date)}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} disabled={actionLoading}>
                        Annuler
                    </Button>
                    <Button
                        onClick={confirmDeleteReport}
                        color="error"
                        variant="contained"
                        disabled={actionLoading}
                    >
                        {actionLoading ? <CircularProgress size={24} /> : 'Supprimer'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default FinancialReports;