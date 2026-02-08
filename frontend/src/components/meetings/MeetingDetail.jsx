import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Container, Typography, Paper, Button, Tabs, Tab, CircularProgress,
    Alert, Divider, Chip, Dialog, DialogTitle, DialogContent, DialogContentText,
    DialogActions, TextField, List, ListItem, ListItemText, ListItemAvatar,
    Avatar, ListItemSecondaryAction, IconButton, Badge, Tooltip, Grid,
    FormControlLabel, Switch, FormControl, InputLabel, Select, MenuItem, Checkbox
} from '@mui/material';
import { styled, useTheme, alpha } from '@mui/material/styles';
import {
    ArrowBack, Event, LocationOn, AccessTime, Groups, Description,
    PersonAdd, EditNote, Cancel, Assignment, PictureAsPdf, Check, Close,
    VideoCall, Add, CheckCircle, Visibility, Download, ListAlt, AttachFile,
    Search
} from '@mui/icons-material';
import moment from 'moment';
import AxiosInstance from '../Axios.jsx';
import { usePermissions } from '/src/contexts/PermissionsContext.jsx';

// Styled components - IMPORTANT: Define all styled components outside the component function
const StyledPaper = styled(Paper)(({ theme }) => ({
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    overflow: 'hidden',
}));

const HeaderPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #3252B2, #1a237e)', // Darker gradient for better contrast
    color: 'white',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    '& .MuiTypography-root': {
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)', // Text shadow for better readability
    },
    '& .MuiChip-root': {
        fontWeight: 'bold',
    },
    '&::after': { // Add subtle texture for better contrast
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
        backgroundImage: `radial-gradient(circle at 100% 150%, rgba(255, 255, 255, 0.1) 6px, transparent 8px),
        radial-gradient(circle at 0% 150%, rgba(255, 255, 255, 0.1) 6px, transparent 8px)`,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
    }
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
    borderBottom: `1px solid ${theme.palette.divider}`,
    '& .MuiTab-root': {
        minWidth: 100,
        fontWeight: 500,
        textTransform: 'none',
    },
}));

// Header components - must be defined OUTSIDE component
const HeaderIconWrapper = styled(Box)(({ theme }) => ({
    backgroundColor: alpha(theme.palette.common.white, 0.1),
    borderRadius: '50%',
    padding: theme.spacing(1.5),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing(1.5),
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    width: 42,
    height: 42,
}));

const HeaderButton = styled(Button)(({ theme }) => ({
    fontWeight: 600,
    padding: theme.spacing(1, 2),
    textTransform: 'none',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    textShadow: '0 1px 1px rgba(0,0,0,0.2)',
    '&.MuiButton-outlined': {
        borderColor: 'rgba(255,255,255,0.5)',
        color: theme.palette.common.white,
        '&:hover': {
            backgroundColor: alpha(theme.palette.common.white, 0.1),
            borderColor: theme.palette.common.white
        }
    }
}));

const HeaderTypeChip = styled(Chip)(({ theme }) => ({
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    color: theme.palette.common.white,
    fontWeight: 600,
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(4px)',
    textShadow: '0 1px 1px rgba(0,0,0,0.2)',
    '&:hover': {
        backgroundColor: alpha(theme.palette.common.white, 0.25),
    }
}));

// Badge status components
const EnhancedBadgeStatut = props => {
    const { status, ...other } = props;
    const theme = useTheme();
    let color, backgroundColor, label;

    switch (status) {
        case 'scheduled':
            color = theme.palette.common.white;
            backgroundColor = alpha(theme.palette.success.main, 0.8);
            label = 'Planifiée';
            break;
        case 'cancelled':
            color = theme.palette.common.white;
            backgroundColor = alpha(theme.palette.error.main, 0.8);
            label = 'Annulée';
            break;
        case 'completed':
            color = theme.palette.common.white;
            backgroundColor = alpha(theme.palette.grey[600], 0.8);
            label = 'Terminée';
            break;
        case 'postponed':
            color = theme.palette.common.white;
            backgroundColor = alpha(theme.palette.warning.main, 0.8);
            label = 'Reportée';
            break;
        case 'in_progress':
            color = theme.palette.common.white;
            backgroundColor = alpha(theme.palette.info.main, 0.8);
            label = 'En cours';
            break;
        default:
            color = theme.palette.common.white;
            backgroundColor = alpha(theme.palette.primary.main, 0.8);
            label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Inconnu';
    }

    return (
        <Chip
            size="medium"
            label={label}
            sx={{
                color: color,
                bgcolor: backgroundColor,
                fontWeight: 600,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }}
            {...other}
        />
    );
};

const BadgeStatut = ({ status }) => {
    const theme = useTheme();
    let color, label;

    switch (status) {
        case 'scheduled':
            color = theme.palette.success.main;
            label = 'Planifiée';
            break;
        case 'cancelled':
            color = theme.palette.error.main;
            label = 'Annulée';
            break;
        case 'completed':
            color = theme.palette.text.secondary;
            label = 'Terminée';
            break;
        case 'postponed':
            color = theme.palette.warning.main;
            label = 'Reportée';
            break;
        case 'in_progress':
            color = theme.palette.info.main;
            label = 'En cours';
            break;
        default:
            color = theme.palette.primary.main;
            label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Inconnu';
    }

    return (
        <Chip
            size="medium"
            label={label}
            sx={{
                color: color,
                bgcolor: alpha(color, 0.1),
                fontWeight: 500
            }}
        />
    );
};

const BadgeStatutPresence = ({ status }) => {
    const theme = useTheme();
    let color, label;

    switch (status) {
        case 'present':
            color = theme.palette.success.main;
            label = 'Présent';
            break;
        case 'absent':
            color = theme.palette.error.main;
            label = 'Absent';
            break;
        case 'excused':
            color = theme.palette.warning.main;
            label = 'Excusé';
            break;
        case 'late':
            color = theme.palette.info.main;
            label = 'En retard';
            break;
        case 'pending':
            color = theme.palette.info.light;
            label = 'En attente';
            break;
        default:
            color = theme.palette.grey[600];
            label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Inconnu';
    }

    return (
        <Chip
            size="small"
            label={label}
            sx={{
                color: color,
                bgcolor: alpha(color, 0.1),
                fontWeight: 500,
            }}
        />
    );
};

// Composant d'affichage de l'ordre du jour
const AffichageOrdreJour = ({ agenda }) => {
    if (!agenda) return <Typography>Aucun ordre du jour fourni.</Typography>;

    // Vérifier si l'ordre du jour est une liste en texte brut ou en style markdown
    const lines = agenda.split('\n');
    const formattedLines = lines.map((line, index) => {
        // Vérifier les listes numérotées (1. Item)
        const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
        if (numberedMatch) {
            return (
                <Box key={index} sx={{ display: 'flex', mb: 1 }}>
                    <Typography variant="body1" fontWeight="medium" sx={{ minWidth: '30px' }}>
                        {numberedMatch[1]}.
                    </Typography>
                    <Typography variant="body1">{numberedMatch[2]}</Typography>
                </Box>
            );
        }

        // Vérifier les listes à puces (- Item ou • Item)
        const bulletMatch = line.match(/^[-•]\s+(.+)$/);
        if (bulletMatch) {
            return (
                <Box key={index} sx={{ display: 'flex', mb: 1, alignItems: 'center' }}>
                    <Box sx={{ width: '6px', height: '6px', borderRadius: '50%', bgcolor: 'text.primary', mr: 1.5, ml: 1 }} />
                    <Typography variant="body1">{bulletMatch[1]}</Typography>
                </Box>
            );
        }

        // Ligne de texte régulière
        return <Typography key={index} variant="body1" paragraph={line.trim() !== ''}>{line}</Typography>;
    });

    return <Box>{formattedLines}</Box>;
};

// Composant auxiliaire pour les panneaux d'onglets
function PanneauOnglet(props) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`meeting-tabpanel-${index}`}
            aria-labelledby={`meeting-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const DetailReunion = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const { can, RESOURCES, ACTIONS } = usePermissions();

    // Vérifier si l'utilisateur a des autorisations de modification
    const canEditMeetings = can(ACTIONS.EDIT, RESOURCES.MEETINGS);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [meeting, setMeeting] = useState(null);
    const [attendees, setAttendees] = useState([]);
    const [reports, setReports] = useState([]);
    const [tabValue, setTabValue] = useState(0);

    // État de la boîte de dialogue Ajouter un participant
    const [openAddAttendeeDialog, setOpenAddAttendeeDialog] = useState(false);
    const [availableMembers, setAvailableMembers] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [addingAttendees, setAddingAttendees] = useState(false);

    // États des boîtes de dialogue
    const [openCancelDialog, setOpenCancelDialog] = useState(false);
    const [openMarkCompleteDialog, setOpenMarkCompleteDialog] = useState(false);
    const [success, setSuccess] = useState({ show: false, message: '', severity: 'success' });

    // État de traitement
    const [markingComplete, setMarkingComplete] = useState(false);

    // État de la boîte de dialogue du procès-verbal
    const [openPVDialog, setOpenPVDialog] = useState(false);
    const [pvTitle, setPvTitle] = useState('');
    const [pvContent, setPvContent] = useState('');
    const [generatingPV, setGeneratingPV] = useState(false);
    const [includeAttendance, setIncludeAttendance] = useState(true);

    // Récupérer les données de la réunion
    useEffect(() => {
        const fetchMeetingData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Récupérer les détails de la réunion
                const meetingResponse = await AxiosInstance.get(`/meetings/meetings/${id}/`);

                // Vérifier si la réunion a été récupérée avec succès
                if (!meetingResponse.data) {
                    throw new Error('Données de réunion introuvables');
                }

                setMeeting(meetingResponse.data);

                // Récupérer les participants avec le point d'accès et le paramètre de requête corrects
                const attendeesResponse = await AxiosInstance.get(`/meetings/attendees/`, {
                    params: { meeting: id }
                });

                // S'assurer que les participants ont été récupérés avec succès
                if (attendeesResponse.data) {
                    setAttendees(attendeesResponse.data);
                }

                // Récupérer les rapports - S'ASSURER que nous ne récupérons que les rapports pour cette réunion
                const reportsResponse = await AxiosInstance.get(`/meetings/reports/`, {
                    params: { meeting: id }
                });

                if (reportsResponse.data) {
                    setReports(reportsResponse.data);
                    console.log(`${reportsResponse.data.length} rapports récupérés pour la réunion ${id}`);
                }

                // Définir le titre PV par défaut
                if (meetingResponse.data) {
                    setPvTitle(`Procès-Verbal: ${meetingResponse.data.title}`);
                }

                setLoading(false);
            } catch (err) {
                console.error('Erreur lors de la récupération des données de réunion:', err);
                setError(`Échec du chargement des détails de la réunion: ${err.message || 'Veuillez réessayer.'}`);
                setLoading(false);
            }
        };

        if (id) {
            fetchMeetingData();
        }
    }, [id]);



    // Récupérer les membres disponibles qui peuvent être ajoutés comme participants
    const fetchAvailableMembers = async () => {
        if (!meeting || !meeting.association) {
            console.error("Impossible de récupérer les membres: ID de réunion ou d'association manquant");
            setError("Informations de réunion manquantes. Veuillez actualiser la page.");
            return;
        }

        try {
            setLoadingMembers(true);
            setError(null); // Effacer les erreurs précédentes

            // Utiliser le point d'accès API correct pour récupérer les membres
            const response = await AxiosInstance.get('/api/member/', {
                params: { association: meeting.association }
            });

            // Obtenir les ID des membres participants actuels
            const currentAttendeeIds = attendees.map(a =>
                typeof a.member === 'number' ? a.member :
                    (a.member_details?.id || a.member)
            );

            // Filtrer les membres qui sont déjà participants
            const filteredMembers = Array.isArray(response.data)
                ? response.data.filter(member => !currentAttendeeIds.includes(member.id))
                : [];

            if (filteredMembers.length === 0) {
                setError("Tous les membres ont déjà été ajoutés à cette réunion");
            }

            setAvailableMembers(filteredMembers);
            setLoadingMembers(false);
        } catch (err) {
            console.error('Erreur lors de la récupération des membres:', err);
            setError('Échec du chargement des membres disponibles: ' +
                (err.response?.data?.error || err.message || 'Erreur inconnue'));
            setLoadingMembers(false);
        }
    };

    // Ouvrir la boîte de dialogue Ajouter un participant
    const handleOpenAddAttendeeDialog = () => {
        setSelectedMembers([]);
        setSearchTerm('');
        setError(null);
        setOpenAddAttendeeDialog(true);
        fetchAvailableMembers();
    };

    // Gérer l'ajout des membres sélectionnés comme participants
    const handleAddAttendees = async () => {
        if (selectedMembers.length === 0) {
            setError("Veuillez sélectionner au moins un membre à ajouter");
            return;
        }

        try {
            setAddingAttendees(true);

            // Formater les données correctement pour l'API - en utilisant le point d'accès approprié
            const attendeesData = selectedMembers.map(memberId => ({
                member: memberId,
                status: 'pending', // Définir comme en attente par défaut
                attendance_mode: 'undecided' // Par défaut à indécis
            }));

            // Appeler le point d'accès correct avec le format de données approprié
            const response = await AxiosInstance.post(`/meetings/meetings/${id}/add_attendees/`, {
                attendees: attendeesData
            });

            // Actualiser la liste des participants
            const attendeesResponse = await AxiosInstance.get(`/meetings/attendees/`, {
                params: { meeting: id }
            });

            // Mettre à jour l'état avec les nouveaux participants
            setAttendees(attendeesResponse.data);
            setOpenAddAttendeeDialog(false);
            setAddingAttendees(false);

            // Afficher un message de succès
            setSuccess({
                show: true,
                message: `${response.data.created?.length || 0} nouveaux participants ajoutés avec succès`,
                severity: "success"
            });

            // Masquer le message de succès après 3 secondes
            setTimeout(() => {
                setSuccess(prev => ({ ...prev, show: false }));
            }, 3000);
        } catch (err) {
            console.error('Erreur lors de l\'ajout des participants:', err);
            setError('Échec de l\'ajout des participants: ' +
                (err.response?.data?.error || err.message || 'Veuillez réessayer.'));
            setAddingAttendees(false);
        }
    };

    // Basculer la sélection des membres
    const handleToggleMember = (memberId) => {
        setSelectedMembers(prev => {
            if (prev.includes(memberId)) {
                return prev.filter(id => id !== memberId);
            } else {
                return [...prev, memberId];
            }
        });
    };

    // Filtrer les membres en fonction du terme de recherche
    const filteredMembers = availableMembers.filter(member =>
        member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Gérer le changement d'onglet
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Formater la date pour l'affichage
    const formatDate = (date) => {
        return moment(date).format('dddd D MMMM YYYY');
    };

    // Formater l'heure pour l'affichage
    const formatTime = (date) => {
        return moment(date).format('HH:mm');
    };

    // Nouvelle fonction directe marquer comme terminée et afficher la boîte de dialogue PV
    const handleMarkComplete = async () => {
        try {
            setMarkingComplete(true);
            setOpenMarkCompleteDialog(false);

            // Marquer la réunion comme terminée
            await AxiosInstance.post(`/meetings/meetings/${id}/mark_complete/`, {
                summary: ""  // Résumé vide initialement
            });

            // Mettre à jour les données de la réunion
            const updatedMeeting = { ...meeting, status: 'completed' };
            setMeeting(updatedMeeting);

            // Afficher un message de succès
            setSuccess({
                show: true,
                message: "La réunion a été marquée comme terminée",
                severity: "success"
            });

            // Masquer le message de succès après 3 secondes et ouvrir la boîte de dialogue PV
            setTimeout(() => {
                setSuccess(prev => ({ ...prev, show: false }));
                // Ouvrir la boîte de dialogue PV directement après avoir terminé la réunion
                setOpenPVDialog(true);
            }, 1500);

            setMarkingComplete(false);
        } catch (err) {
            console.error('Erreur lors du marquage de la réunion comme terminée:', err);
            setError('Échec du marquage de la réunion comme terminée. Veuillez réessayer.');
            setMarkingComplete(false);
        }
    };

    // Gérer l'annulation de la réunion
    const handleCancelMeeting = async () => {
        try {
            await AxiosInstance.patch(`/meetings/meetings/${id}/`, {
                status: 'cancelled'
            });

            // Mettre à jour les données de la réunion
            const updatedMeeting = { ...meeting, status: 'cancelled' };
            setMeeting(updatedMeeting);
            setOpenCancelDialog(false);

            // Afficher un message de succès
            setSuccess({
                show: true,
                message: "La réunion a été annulée",
                severity: "info"
            });

            // Masquer le message de succès après 3 secondes
            setTimeout(() => {
                setSuccess(prev => ({ ...prev, show: false }));
            }, 3000);
        } catch (err) {
            console.error('Erreur lors de l\'annulation de la réunion:', err);
            setError('Échec de l\'annulation de la réunion. Veuillez réessayer.');
        }
    };

    // Gérer la mise à jour du statut de présence
    const handleUpdateAttendanceStatus = async (attendeeId, newStatus) => {
        try {
            await AxiosInstance.patch(`/meetings/attendees/${attendeeId}/`, {
                status: newStatus
            });

            // Mettre à jour l'état local au lieu de recharger
            const updatedAttendees = attendees.map(a =>
                a.id === attendeeId ? { ...a, status: newStatus } : a
            );
            setAttendees(updatedAttendees);
        } catch (err) {
            console.error('Erreur lors de la mise à jour du statut de présence:', err);
            setError('Échec de la mise à jour du statut de présence. Veuillez réessayer.');
        }
    };
// Handle report approval
    const handleApproveReport = async (reportId) => {
        try {
            await AxiosInstance.patch(`/meetings/reports/${reportId}/`, {
                is_approved: true
            });

            // Update the reports list
            const updatedReports = reports.map(report =>
                report.id === reportId ? { ...report, is_approved: true } : report
            );
            setReports(updatedReports);

            // Show success message
            setSuccess({
                show: true,
                message: "Le rapport a été approuvé avec succès",
                severity: "success"
            });

            // Hide success message after 3 seconds
            setTimeout(() => {
                setSuccess(prev => ({ ...prev, show: false }));
            }, 3000);
        } catch (err) {
            console.error('Erreur lors de l\'approbation du rapport:', err);
            setError('Échec de l\'approbation du rapport. Veuillez réessayer.');
        }
    };
    // Gérer la création du PDF PV
    const handleCreatePV = async () => {
        try {
            setGeneratingPV(true);

            // Préparer les données PV
            const pvData = {
                meeting_id: id,
                report_title: pvTitle,
                summary: pvContent,
                include_attendance: includeAttendance
            };

            // Appeler l'API pour générer le PV
            const response = await AxiosInstance.post(`/meetings/meetings/${id}/generate_report/`, pvData);

            // Récupérer la liste des rapports mise à jour
            const reportsResponse = await AxiosInstance.get(`/meetings/reports/`, {
                params: { meeting: id }
            });

            if (reportsResponse.data) {
                setReports(reportsResponse.data);
            }

            setGeneratingPV(false);
            setOpenPVDialog(false);

            // Fix the URL to use the backend server URL instead of frontend URL
            // but DO NOT automatically open it
            let pdfUrl = "";
            if (response.data && response.data.report_file) {
                // Get the path part of the URL (everything after the domain)
                const urlPath = response.data.report_file.split('/').slice(3).join('/');

                // Reconstruct with the correct domain
                pdfUrl = `http://127.0.0.1:8000/media/${urlPath}`;
            }

            // Afficher un message de succès avec option de téléchargement
            setSuccess({
                show: true,
                message: `Le procès-verbal a été généré avec succès. ${pdfUrl ?
                    "Vous pouvez le télécharger depuis l'onglet Rapports." :
                    ""}`,
                severity: "success"
            });

            // Masquer le message de succès après 5 secondes (extended time)
            setTimeout(() => {
                setSuccess(prev => ({ ...prev, show: false }));
            }, 5000);
        } catch (err) {
            console.error('Erreur lors de la création du PV:', err);
            setError('Échec de la création du procès-verbal. Veuillez réessayer.');
            setGeneratingPV(false);
        }
    };
    // Rendu de la boîte de dialogue Ajouter des participants
    const renderAddAttendeesDialog = () => {
        return (
            <Dialog
                open={openAddAttendeeDialog}
                onClose={() => setOpenAddAttendeeDialog(false)}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>
                    Ajouter des participants
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body1" paragraph>
                            Sélectionnez les membres à ajouter comme participants à cette réunion.
                        </Typography>

                        {/* Barre de recherche */}
                        <TextField
                            fullWidth
                            variant="outlined"
                            label="Rechercher des membres"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: <Search color="action" sx={{ mr: 1 }} />,
                            }}
                            sx={{ mb: 2 }}
                        />

                        {/* Affichage des membres sélectionnés */}
                        {selectedMembers.length > 0 && (
                            <Box sx={{ mt: 2, mb: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Sélectionnés ({selectedMembers.length}):
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {selectedMembers.map(memberId => {
                                        const member = availableMembers.find(m => m.id === memberId);
                                        return (
                                            <Chip
                                                key={memberId}
                                                label={member ? (member.name || member.email) : `ID: ${memberId}`}
                                                onDelete={() => handleToggleMember(memberId)}
                                                color="primary"
                                                variant="outlined"
                                                size="small"
                                            />
                                        );
                                    })}
                                </Box>
                            </Box>
                        )}

                        {/* Message d'erreur */}
                        {error && (
                            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        {/* Liste des membres */}
                        <Box sx={{
                            maxHeight: 400,
                            overflow: 'auto',
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 1
                        }}>
                            {loadingMembers ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                    <CircularProgress size={40} />
                                </Box>
                            ) : filteredMembers.length === 0 ? (
                                <Box sx={{ p: 4, textAlign: 'center' }}>
                                    <Typography variant="body1" color="text.secondary">
                                        {searchTerm ? 'Aucun membre trouvé correspondant à votre recherche.' : 'Aucun membre disponible à ajouter.'}
                                    </Typography>
                                    {availableMembers.length === 0 && !loadingMembers && (
                                        <Button
                                            variant="text"
                                            color="primary"
                                            sx={{ mt: 2 }}
                                            onClick={fetchAvailableMembers}
                                        >
                                            Réessayer de charger les membres
                                        </Button>
                                    )}
                                </Box>
                            ) : (
                                <List>
                                    {filteredMembers.map((member) => (
                                        <ListItem
                                            key={member.id}
                                            divider
                                            button
                                            onClick={() => handleToggleMember(member.id)}
                                            sx={{
                                                bgcolor: selectedMembers.includes(member.id)
                                                    ? alpha(theme.palette.primary.main, 0.1)
                                                    : 'transparent'
                                            }}
                                        >
                                            <ListItemAvatar>
                                                <Avatar>
                                                    {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={member.name || 'Membre sans nom'}
                                                secondary={
                                                    <>
                                                        <Typography component="span" variant="body2" color="text.primary">
                                                            {member.email || 'Pas d\'email'}
                                                        </Typography>
                                                        {member.role && (
                                                            <Typography component="span" variant="body2" display="block">
                                                                {member.role}
                                                            </Typography>
                                                        )}
                                                    </>
                                                }
                                            />
                                            <Checkbox
                                                edge="end"
                                                checked={selectedMembers.includes(member.id)}
                                                onChange={() => handleToggleMember(member.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setOpenAddAttendeeDialog(false)}
                        color="inherit"
                        disabled={addingAttendees}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleAddAttendees}
                        color="primary"
                        variant="contained"
                        disabled={selectedMembers.length === 0 || addingAttendees}
                        startIcon={addingAttendees ? <CircularProgress size={20} /> : <PersonAdd />}
                    >
                        {addingAttendees ? 'Ajout en cours...' : `Ajouter les sélectionnés (${selectedMembers.length})`}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    // Boîte de dialogue de confirmation Marquer comme terminée
    const renderMarkCompleteDialog = () => {
        return (
            <Dialog
                open={openMarkCompleteDialog}
                onClose={() => setOpenMarkCompleteDialog(false)}
            >
                <DialogTitle>Marquer la réunion comme terminée</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Êtes-vous sûr de vouloir marquer cette réunion comme terminée ? Après l'avoir marquée comme terminée, vous pourrez générer un rapport.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenMarkCompleteDialog(false)} color="inherit">
                        Annuler
                    </Button>
                    <Button
                        onClick={handleMarkComplete}
                        color="primary"
                        variant="contained"
                        disabled={markingComplete}
                        startIcon={markingComplete ? <CircularProgress size={20} /> : <Check />}
                    >
                        {markingComplete ? 'Marquage en cours...' : 'Marquer comme terminée'}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    // Boîte de dialogue PV
    const renderPVDialog = () => {
        return (
            <Dialog
                open={openPVDialog}
                onClose={() => setOpenPVDialog(false)}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>Générer un Procès-Verbal (PV)</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Titre du Procès-Verbal"
                        value={pvTitle}
                        onChange={(e) => setPvTitle(e.target.value)}
                        placeholder={`Procès-Verbal: ${meeting?.title || ''}`}
                        margin="normal"
                    />

                    <TextField
                        fullWidth
                        multiline
                        rows={10}
                        label="Contenu du Procès-Verbal"
                        placeholder="Entrez le contenu du procès-verbal..."
                        value={pvContent}
                        onChange={(e) => setPvContent(e.target.value)}
                        margin="normal"
                    />

                    {/* Cases à cocher pour les sections optionnelles */}
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>Sections à inclure</Typography>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={includeAttendance}
                                    onChange={(e) => setIncludeAttendance(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label="Liste de présence"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPVDialog(false)} color="inherit">
                        Annuler
                    </Button>
                    <Button
                        onClick={handleCreatePV}
                        color="primary"
                        variant="contained"
                        disabled={generatingPV || !pvTitle.trim()}
                        startIcon={generatingPV ? <CircularProgress size={20} /> : <PictureAsPdf />}
                    >
                        {generatingPV ? 'Génération en cours...' : 'Générer le PDF'}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    // Boîte de dialogue Annuler la réunion
    const renderCancelMeetingDialog = () => {
        return (
            <Dialog
                open={openCancelDialog}
                onClose={() => setOpenCancelDialog(false)}
            >
                <DialogTitle>Annuler la réunion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Êtes-vous sûr de vouloir annuler cette réunion ? Tous les participants seront notifiés.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCancelDialog(false)} color="inherit">
                        Non, conserver la réunion
                    </Button>
                    <Button onClick={handleCancelMeeting} color="error" variant="contained">
                        Oui, annuler la réunion
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    if (loading) {
        return (
            <Container>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
                    <CircularProgress size={60} thickness={4} />
                    <Typography variant="h6" sx={{ mt: 2 }}>
                        Chargement des détails de la réunion...
                    </Typography>
                </Box>
            </Container>
        );
    }

    if (error && !meeting) {
        return (
            <Container>
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/meetings')}
                    >
                        Retour aux réunions
                    </Button>
                </Box>
            </Container>
        );
    }

    if (!meeting) {
        return (
            <Container>
                <Alert severity="warning" sx={{ mt: 2 }}>
                    Réunion introuvable ou peut avoir été supprimée.
                </Alert>
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/meetings')}
                    >
                        Retour aux réunions
                    </Button>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl">
            {/* Bouton de retour */}
            <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate('/meetings')}
                sx={{ mb: 2 }}
            >
                Retour aux réunions
            </Button>

            {/* Message de succès */}
            {success.show && (
                <Alert severity={success.severity} sx={{ mb: 3 }}>
                    {success.message}
                </Alert>
            )}

            {/* Message d'erreur */}
            {error && meeting && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* En-tête amélioré */}
            <HeaderPaper>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                            {meeting.title}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
                            <EnhancedBadgeStatut status={meeting.status} />
                            <HeaderTypeChip
                                size="medium"
                                label={meeting.meeting_type === 'regular' ? 'Réunion régulière' :
                                    meeting.meeting_type === 'board' ? 'Réunion du conseil' :
                                        meeting.meeting_type === 'extraordinary' ? 'Réunion extraordinaire' :
                                            meeting.meeting_type === 'general_assembly' ? 'Assemblée générale' :
                                                meeting.meeting_type === 'committee' ? 'Réunion de comité' : 'Autre'}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <HeaderIconWrapper>
                                    <Event />
                                </HeaderIconWrapper>
                                <Box>
                                    <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                                        Date
                                    </Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {formatDate(meeting.start_date)}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <HeaderIconWrapper>
                                    <AccessTime />
                                </HeaderIconWrapper>
                                <Box>
                                    <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                                        Heure
                                    </Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {formatTime(meeting.start_date)} - {formatTime(meeting.end_date)}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <HeaderIconWrapper>
                                    <LocationOn />
                                </HeaderIconWrapper>
                                <Box>
                                    <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                                        Lieu
                                    </Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {meeting.location || 'Lieu non spécifié'}
                                    </Typography>
                                </Box>
                            </Box>

                            {meeting.meeting_link && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <HeaderIconWrapper>
                                        <VideoCall />
                                    </HeaderIconWrapper>
                                    <Box>
                                        <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                                            Accès virtuel
                                        </Typography>
                                        <Typography
                                            variant="body1"
                                            fontWeight="medium"
                                            component="a"
                                            href={meeting.meeting_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{
                                                color: 'inherit',
                                                textDecoration: 'none',
                                                '&:hover': {
                                                    textDecoration: 'underline',
                                                    color: alpha(theme.palette.common.white, 0.9)
                                                }
                                            }}
                                        >
                                            Rejoindre la réunion
                                        </Typography>
                                    </Box>
                                </Box>
                            )}

                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <HeaderIconWrapper>
                                    <Groups />
                                </HeaderIconWrapper>
                                <Box>
                                    <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                                        Participants
                                    </Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {attendees.length} invités
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Boutons d'action améliorés */}
                    {canEditMeetings && (
                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'start' }}>
                            {meeting.status === 'scheduled' && (
                                <>
                                    <HeaderButton
                                        variant="contained"
                                        color="success"
                                        startIcon={<Check />}
                                        onClick={() => setOpenMarkCompleteDialog(true)}
                                        sx={{
                                            backgroundColor: theme.palette.success.main,
                                            '&:hover': { backgroundColor: theme.palette.success.dark }
                                        }}
                                    >
                                        Marquer comme terminée
                                    </HeaderButton>
                                    <HeaderButton
                                        variant="outlined"
                                        startIcon={<Cancel />}
                                        onClick={() => setOpenCancelDialog(true)}
                                    >
                                        Annuler la réunion
                                    </HeaderButton>
                                </>
                            )}

                            {meeting.status === 'completed' && (
                                <HeaderButton
                                    variant="contained"
                                    startIcon={<PictureAsPdf />}
                                    onClick={() => setOpenPVDialog(true)}
                                    sx={{
                                        backgroundColor: theme.palette.secondary.dark,
                                        '&:hover': { backgroundColor: theme.palette.secondary.main }
                                    }}
                                >
                                    Générer PV en PDF
                                </HeaderButton>
                            )}
                        </Box>
                    )}
                </Box>
            </HeaderPaper>
            {/* Contenu principal */}
            <StyledPaper>
                <StyledTabs
                    value={tabValue}
                    onChange={handleTabChange}
                    aria-label="onglets de réunion"
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab label="Aperçu" />
                    <Tab label="Participants" />
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                Rapports
                                {reports.length > 0 && (
                                    <Badge
                                        badgeContent={reports.length}
                                        color="primary"
                                        sx={{ ml: 1 }}
                                    />
                                )}
                            </Box>
                        }
                    />
                </StyledTabs>

                {/* Onglet Aperçu */}
                <PanneauOnglet value={tabValue} index={0}>
                    <Grid container spacing={3}>
                        {/* Description */}
                        <Grid item xs={12} md={8}>
                            <Typography variant="h6" gutterBottom>
                                Description
                            </Typography>
                            <Typography variant="body1" paragraph>
                                {meeting.description || 'Aucune description fournie.'}
                            </Typography>

                            {/* Section Ordre du jour */}
                            {meeting.agenda && (
                                <>
                                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                                        Ordre du jour
                                    </Typography>
                                    <Box
                                        sx={{
                                            p: 2,
                                            borderRadius: 1,
                                            bgcolor: 'background.default',
                                            border: `1px solid ${theme.palette.divider}`
                                        }}
                                    >
                                        <AffichageOrdreJour agenda={meeting.agenda} />
                                    </Box>
                                </>
                            )}

                            {/* Résumé (si terminée) */}
                            {meeting.status === 'completed' && meeting.summary && (
                                <>
                                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                                        Résumé
                                    </Typography>
                                    <Box
                                        sx={{
                                            p: 2,
                                            borderRadius: 1,
                                            bgcolor: 'background.default',
                                            border: `1px solid ${theme.palette.divider}`
                                        }}
                                    >
                                        <Typography variant="body1" whiteSpace="pre-wrap">
                                            {meeting.summary}
                                        </Typography>
                                    </Box>
                                </>
                            )}
                        </Grid>

                        {/* Statistiques rapides */}
                        <Grid item xs={12} md={4}>
                            <StyledPaper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    bgcolor: 'background.default',
                                    border: `1px solid ${theme.palette.divider}`
                                }}
                            >
                                <Typography variant="h6" gutterBottom>
                                    Statistiques rapides
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {/* Présence */}
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Présence
                                        </Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                            <Typography variant="body2">
                                                Présent:
                                            </Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {attendees.filter(a => a.status === 'present').length}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2">
                                                Absent:
                                            </Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {attendees.filter(a => a.status === 'absent').length}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2">
                                                Excusé:
                                            </Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {attendees.filter(a => a.status === 'excused').length}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2">
                                                En attente:
                                            </Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {attendees.filter(a => a.status === 'pending').length}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Divider />

                                    {/* Organisation */}
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Organisation
                                        </Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                            <Typography variant="body2">
                                                Association:
                                            </Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {meeting.association_name}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2">
                                                Créé par:
                                            </Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {meeting.created_by_details?.name || ""}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </StyledPaper>
                        </Grid>
                    </Grid>
                </PanneauOnglet>

                {/* Onglet Participants */}
                <PanneauOnglet value={tabValue} index={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
                        <Typography variant="h6">
                            Participants à la réunion ({attendees.length})
                        </Typography>
                        {canEditMeetings && meeting.status === 'scheduled' && (
                            <Button
                                variant="outlined"
                                startIcon={<PersonAdd />}
                                onClick={handleOpenAddAttendeeDialog}
                            >
                                Ajouter des participants
                            </Button>
                        )}
                    </Box>

                    {/* Liste des participants */}
                    {attendees.length === 0 ? (
                        <Alert severity="info">
                            Aucun participant n'a encore été ajouté à cette réunion.
                        </Alert>
                    ) : (
                        <Box sx={{ overflowX: 'auto' }}>
                            <List sx={{ bgcolor: 'background.paper' }}>
                                {attendees.map(attendee => (
                                    <ListItem
                                        key={attendee.id}
                                        divider
                                        secondaryAction={
                                            canEditMeetings && meeting.status === 'scheduled' && (
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Tooltip title="Marquer comme présent">
                                                        <IconButton
                                                            color={attendee.status === 'present' ? "success" : "default"}
                                                            onClick={() => handleUpdateAttendanceStatus(attendee.id, 'present')}
                                                        >
                                                            <Check />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Marquer comme absent">
                                                        <IconButton
                                                            color={attendee.status === 'absent' ? "error" : "default"}
                                                            onClick={() => handleUpdateAttendanceStatus(attendee.id, 'absent')}
                                                        >
                                                            <Close />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Marquer comme excusé">
                                                        <IconButton
                                                            color={attendee.status === 'excused' ? "warning" : "default"}
                                                            onClick={() => handleUpdateAttendanceStatus(attendee.id, 'excused')}
                                                        >
                                                            <Cancel />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            )
                                        }
                                    >
                                        <ListItemAvatar>
                                            <Avatar>
                                                {attendee.member_details?.name?.charAt(0).toUpperCase() || '?'}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="body1">
                                                        {attendee.member_details?.name || `ID du membre: ${attendee.member}`}
                                                    </Typography>
                                                    <BadgeStatutPresence status={attendee.status} />
                                                    {attendee.special_role && (
                                                        <Chip
                                                            size="small"
                                                            label={attendee.special_role}
                                                            variant="outlined"
                                                            color="primary"
                                                        />
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                <>
                                                    <Typography component="span" variant="body2" color="text.primary">
                                                        {attendee.member_details?.email || 'Pas d\'email'}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Mode de présence: {attendee.attendance_mode === 'in_person' ? 'Présentiel' :
                                                        attendee.attendance_mode === 'virtual' ? 'Virtuel' : 'Indécis'}
                                                    </Typography>
                                                    {attendee.notes && (
                                                        <Typography variant="body2" color="text.secondary">
                                                            Notes: {attendee.notes}
                                                        </Typography>
                                                    )}
                                                </>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}
                </PanneauOnglet>

                {/* Onglet Rapports - SIMPLIFIÉ */}
                <PanneauOnglet value={tabValue} index={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
                        <Typography variant="h6">
                            Procès-Verbaux ({reports.length})
                        </Typography>
                        {canEditMeetings && meeting.status === 'completed' && (
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<PictureAsPdf />}
                                onClick={() => setOpenPVDialog(true)}
                            >
                                Générer PV en PDF
                            </Button>
                        )}
                    </Box>

                    {reports.length === 0 ? (
                        <Box>
                            <Alert severity="info" sx={{ mb: 3 }}>
                                Aucun procès-verbal n'a été généré pour cette réunion.
                            </Alert>
                            {meeting.status === 'completed' && canEditMeetings && (
                                <Box sx={{ textAlign: 'center', mt: 3 }}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="large"
                                        startIcon={<PictureAsPdf />}
                                        onClick={() => setOpenPVDialog(true)}
                                    >
                                        Générer un Procès-Verbal (PV) en PDF
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    ) : (
                        <Grid container spacing={3}>
                            {reports.map(report => (
                                <Grid item xs={12} md={6} key={report.id}>
                                    <StyledPaper
                                        sx={{
                                            p: 3,
                                            border: report.is_approved ? `1px solid ${theme.palette.success.main}` : `1px solid ${theme.palette.divider}`,
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                                            <Typography variant="h6">
                                                {report.title}
                                            </Typography>
                                            {report.is_approved && (
                                                <Chip
                                                    icon={<CheckCircle />}
                                                    label="Approuvé"
                                                    color="success"
                                                    size="small"
                                                />
                                            )}
                                        </Box>

                                        <Typography variant="body2" color="text.secondary" paragraph>
                                            Créé le {moment(report.created_at).format('D MMM YYYY [à] HH:mm')}
                                            {report.created_by_details && ` par ${report.created_by_details.name}`}
                                        </Typography>

                                        {report.summary && (
                                            <Typography
                                                variant="body1"
                                                paragraph
                                                sx={{
                                                    mt: 1,
                                                    p: 1.5,
                                                    bgcolor: 'background.default',
                                                    borderRadius: 1,
                                                    fontStyle: 'italic'
                                                }}
                                            >
                                                {report.summary}
                                            </Typography>
                                        )}

                                        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>

                                            {report.report_file && (
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<Download />}
                                                    href={report.report_file}
                                                    target="_blank"
                                                >
                                                    Télécharger PDF
                                                </Button>
                                            )}
                                            {canEditMeetings && !report.is_approved && (
                                                <Button
                                                    variant="contained"
                                                    color="success"
                                                    startIcon={<Check />}
                                                    onClick={() => handleApproveReport(report.id)}
                                                >
                                                    Approuver
                                                </Button>
                                            )}
                                        </Box>
                                    </StyledPaper>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </PanneauOnglet>
            </StyledPaper>

            {/* Rendu des boîtes de dialogue */}
            {renderAddAttendeesDialog()}
            {renderMarkCompleteDialog()}
            {renderPVDialog()}
            {renderCancelMeetingDialog()}
        </Container>
    );
};

export default DetailReunion;