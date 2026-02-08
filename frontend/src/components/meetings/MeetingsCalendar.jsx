import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';
import 'moment/locale/fr';
import {
    Box,
    Typography,
    Button,
    Paper,
    Container,
    Chip,
    Alert,
    CircularProgress,
    useMediaQuery,
    Stack,
    ButtonGroup,
    IconButton,
    Tabs,
    Tab
} from '@mui/material';
import { styled, useTheme, alpha } from '@mui/material/styles';
import { Link, useNavigate } from 'react-router-dom';
import { Add, Refresh, ChevronLeft, ChevronRight, Today } from '@mui/icons-material';
import AxiosInstance from '../Axios.jsx';
import { usePermissions } from '/src/contexts/PermissionsContext.jsx';

// Configuration de la locale française
moment.locale('fr');
const localizer = momentLocalizer(moment);

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const ConteneurCalendrierStyled = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    [theme.breakpoints.up('md')]: {
        minHeight: 700,
    },
    [theme.breakpoints.down('md')]: {
        minHeight: 600,
        padding: theme.spacing(1.5),
    },
    [theme.breakpoints.down('sm')]: {
        minHeight: 500,
        padding: theme.spacing(1),
        borderRadius: '8px',
    },
    '& .rbc-calendar': {
        minHeight: 500,
        [theme.breakpoints.down('sm')]: {
            minHeight: 450,
        }
    },
    // Hide default toolbar on mobile - we'll use custom controls
    [theme.breakpoints.down('sm')]: {
        '& .rbc-toolbar': {
            display: 'none',
        }
    },
    // Desktop toolbar styling
    [theme.breakpoints.up('sm')]: {
        '& .rbc-toolbar': {
            flexWrap: 'wrap',
            gap: theme.spacing(1),
            marginBottom: theme.spacing(2),
        },
        '& .rbc-toolbar-label': {
            fontSize: '1.1rem',
            fontWeight: 600,
        },
    },
    // General calendar styling
    '& .rbc-header': {
        padding: theme.spacing(1),
        fontSize: '0.85rem',
        fontWeight: 600,
        borderBottom: `2px solid ${theme.palette.divider}`,
        [theme.breakpoints.down('sm')]: {
            fontSize: '0.7rem',
            padding: theme.spacing(0.5),
        }
    },
    '& .rbc-date-cell': {
        padding: theme.spacing(0.5),
        [theme.breakpoints.down('sm')]: {
            padding: theme.spacing(0.25),
            fontSize: '0.75rem',
        }
    },
    '& .rbc-event': {
        padding: theme.spacing(0.5),
        fontSize: '0.85rem',
        borderRadius: '4px',
        [theme.breakpoints.down('sm')]: {
            padding: '2px 4px',
            fontSize: '0.7rem',
        }
    },
    '& .rbc-agenda-view': {
        [theme.breakpoints.down('sm')]: {
            fontSize: '0.85rem',
        }
    },
    '& .rbc-time-slot': {
        minHeight: '40px',
        [theme.breakpoints.down('sm')]: {
            minHeight: '30px',
        }
    }
}));

const ChipContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(1),
    overflowX: 'auto',
    paddingBottom: theme.spacing(1),
    marginBottom: theme.spacing(1),
    '&::-webkit-scrollbar': {
        height: 6,
    },
    '&::-webkit-scrollbar-track': {
        background: theme.palette.grey[100],
        borderRadius: 3,
    },
    '&::-webkit-scrollbar-thumb': {
        background: theme.palette.grey[400],
        borderRadius: 3,
        '&:hover': {
            background: theme.palette.grey[500],
        }
    },
}));

const MobileNavigationBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(2),
    padding: theme.spacing(1),
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    borderRadius: theme.shape.borderRadius,
}));

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CalendrierReunions = () => {
    const { can, RESOURCES, ACTIONS } = usePermissions();
    const [reunions, setReunions] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState('month');
    const theme = useTheme();
    const navigate = useNavigate();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    // Set default view based on screen size
    useEffect(() => {
        if (isMobile) {
            setCurrentView('agenda'); // Agenda view is best for mobile
        } else {
            setCurrentView('month');
        }
    }, [isMobile]);

    // Messages du calendrier
    const messages = {
        allDay: 'Journée entière',
        previous: 'Précédent',
        next: 'Suivant',
        today: 'Aujourd\'hui',
        month: 'Mois',
        week: 'Semaine',
        day: 'Jour',
        agenda: 'Agenda',
        date: 'Date',
        time: 'Heure',
        event: 'Réunion',
        noEventsInRange: 'Aucune réunion dans cette période',
        showMore: (total) => `+ ${total} plus`,
    };

    useEffect(() => {
        const recupererReunions = async () => {
            try {
                setChargement(true);
                const reponse = await AxiosInstance.get('/meetings/meetings/');

                let donneesReunions = [];
                if (!Array.isArray(reponse.data)) {
                    donneesReunions = reponse.data.results || [];
                } else {
                    donneesReunions = reponse.data;
                }

                const reunionsFormatees = donneesReunions.map(reunion => ({
                    id: reunion.id,
                    title: reunion.title,
                    start: new Date(reunion.start_date),
                    end: new Date(reunion.end_date),
                    status: reunion.status,
                    meeting_type: reunion.meeting_type,
                    location: reunion.location,
                    is_virtual: reunion.is_virtual,
                    meeting_link: reunion.meeting_link,
                    resource: reunion
                }));

                setReunions(reunionsFormatees);
                setChargement(false);
            } catch (err) {
                console.error('Erreur lors de la récupération des réunions:', err);
                setErreur('Échec du chargement des réunions. Veuillez réessayer.');
                setChargement(false);
            }
        };

        recupererReunions();
    }, []);

    // Style des types de réunions
    const typesReunions = {
        regular: { label: 'Régulière', color: theme.palette.primary.main },
        board: { label: 'Conseil', color: theme.palette.success.main },
        extraordinary: { label: 'Extraordinaire', color: theme.palette.error.main },
        general_assembly: { label: 'Assemblée Générale', color: theme.palette.warning.main },
        committee: { label: 'Comité', color: theme.palette.info.main },
        other: { label: 'Autre', color: theme.palette.grey[600] }
    };

    const obtenirStyleEvenement = (evenement) => {
        const typeReunion = evenement.meeting_type || 'other';
        const infoType = typesReunions[typeReunion] || typesReunions.other;
        let couleur = infoType.color;

        if (evenement.status === 'cancelled') {
            couleur = theme.palette.error.main;
        } else if (evenement.status === 'completed') {
            couleur = theme.palette.grey[500];
        }

        return {
            style: {
                backgroundColor: couleur,
                color: '#fff',
                borderRadius: '4px',
                border: 'none',
                opacity: evenement.status === 'cancelled' ? 0.7 : 1
            }
        };
    };

    const gererSelectionEvenement = (evenement) => {
        navigate(`/meetings/${evenement.id}`);
    };

    // Mobile navigation handlers
    const handleNavigate = (action) => {
        let newDate;
        switch(action) {
            case 'PREV':
                if (currentView === 'month') {
                    newDate = moment(currentDate).subtract(1, 'month').toDate();
                } else if (currentView === 'week') {
                    newDate = moment(currentDate).subtract(1, 'week').toDate();
                } else if (currentView === 'day') {
                    newDate = moment(currentDate).subtract(1, 'day').toDate();
                } else {
                    newDate = moment(currentDate).subtract(1, 'month').toDate();
                }
                break;
            case 'NEXT':
                if (currentView === 'month') {
                    newDate = moment(currentDate).add(1, 'month').toDate();
                } else if (currentView === 'week') {
                    newDate = moment(currentDate).add(1, 'week').toDate();
                } else if (currentView === 'day') {
                    newDate = moment(currentDate).add(1, 'day').toDate();
                } else {
                    newDate = moment(currentDate).add(1, 'month').toDate();
                }
                break;
            case 'TODAY':
                newDate = new Date();
                break;
            default:
                newDate = currentDate;
        }
        setCurrentDate(newDate);
    };

    const getDateLabel = () => {
        if (currentView === 'month') {
            return moment(currentDate).format('MMMM YYYY');
        } else if (currentView === 'week') {
            const start = moment(currentDate).startOf('week');
            const end = moment(currentDate).endOf('week');
            return `${start.format('D MMM')} - ${end.format('D MMM YYYY')}`;
        } else if (currentView === 'day') {
            return moment(currentDate).format('dddd D MMMM YYYY');
        } else {
            return moment(currentDate).format('MMMM YYYY');
        }
    };

    const handleViewChange = (event, newView) => {
        if (newView) {
            setCurrentView(newView);
        }
    };

    return (
        <Container maxWidth="xl" sx={{ px: { xs: 1.5, sm: 2, md: 3 }, py: 3 }}>
            {/* Header Section */}
            <Box sx={{ mb: 3 }}>
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                        fontSize: { xs: '1.5rem', sm: '2rem' },
                        fontWeight: 700,
                        mb: 2
                    }}
                >
                    Calendrier des Réunions
                </Typography>

                {/* Action Buttons - FULL WIDTH ON MOBILE */}
                <Stack spacing={1.5} sx={{ mb: 2 }}>
                    {can(ACTIONS.CREATE, RESOURCES.MEETINGS) && (
                        <Button
                            variant="contained"
                            component={Link}
                            to="/meetings/create"
                            startIcon={<Add />}
                            fullWidth
                            sx={{
                                height: 48,
                                fontWeight: 600,
                                fontSize: { xs: '0.9rem', sm: '1rem' }
                            }}
                        >
                            Nouvelle Réunion
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={() => window.location.reload()}
                        fullWidth
                        sx={{
                            height: 48,
                            fontWeight: 600,
                            fontSize: { xs: '0.9rem', sm: '1rem' }
                        }}
                    >
                        Actualiser
                    </Button>
                </Stack>

                {/* Meeting Type Chips - HORIZONTAL SCROLL */}
                <ChipContainer>
                    {Object.entries(typesReunions).map(([key, value]) => (
                        <Chip
                            key={key}
                            label={value.label}
                            size="small"
                            sx={{
                                bgcolor: alpha(value.color, 0.1),
                                color: value.color,
                                fontWeight: 600,
                                fontSize: { xs: '0.75rem', sm: '0.8rem' },
                                height: { xs: 28, sm: 32 },
                                flexShrink: 0,
                                '& .MuiChip-label': {
                                    px: { xs: 1.5, sm: 2 }
                                }
                            }}
                        />
                    ))}
                </ChipContainer>
            </Box>

            {/* Error Alert */}
            {erreur && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {erreur}
                </Alert>
            )}

            {/* MOBILE CUSTOM NAVIGATION */}
            {isMobile && (
                <Box sx={{ mb: 2 }}>
                    {/* Navigation Controls */}
                    <MobileNavigationBox>
                        <IconButton
                            onClick={() => handleNavigate('PREV')}
                            size="medium"
                            sx={{
                                bgcolor: 'white',
                                '&:hover': { bgcolor: 'grey.100' }
                            }}
                        >
                            <ChevronLeft />
                        </IconButton>

                        <Box sx={{ textAlign: 'center', flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight="600">
                                {getDateLabel()}
                            </Typography>
                        </Box>

                        <IconButton
                            onClick={() => handleNavigate('NEXT')}
                            size="medium"
                            sx={{
                                bgcolor: 'white',
                                '&:hover': { bgcolor: 'grey.100' }
                            }}
                        >
                            <ChevronRight />
                        </IconButton>
                    </MobileNavigationBox>

                    {/* Today Button */}
                    <Button
                        variant="outlined"
                        startIcon={<Today />}
                        onClick={() => handleNavigate('TODAY')}
                        fullWidth
                        size="small"
                        sx={{ mb: 2, height: 40 }}
                    >
                        Aujourd'hui
                    </Button>

                    {/* View Tabs - SCROLLABLE */}
                    <Tabs
                        value={currentView}
                        onChange={handleViewChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                        sx={{
                            mb: 2,
                            '& .MuiTab-root': {
                                minWidth: 80,
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                textTransform: 'none',
                            }
                        }}
                    >
                        <Tab label="Mois" value="month" />
                        <Tab label="Jour" value="day" />
                        <Tab label="Agenda" value="agenda" />
                    </Tabs>
                </Box>
            )}

            {/* Calendar Container */}
            <ConteneurCalendrierStyled>
                {chargement ? (
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: 400
                    }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Calendar
                        localizer={localizer}
                        events={reunions}
                        startAccessor="start"
                        endAccessor="end"
                        date={currentDate}
                        onNavigate={setCurrentDate}
                        view={currentView}
                        onView={setCurrentView}
                        onSelectEvent={gererSelectionEvenement}
                        eventPropGetter={obtenirStyleEvenement}
                        views={isMobile ? ['month', 'day', 'agenda'] : ['month', 'week', 'day', 'agenda']}
                        messages={messages}
                        culture="fr"
                        formats={{
                            monthHeaderFormat: 'MMMM YYYY',
                            dayHeaderFormat: 'dddd D MMMM',
                            agendaHeaderFormat: ({ start, end }) =>
                                `${moment(start).format('D MMMM')} - ${moment(end).format('D MMMM YYYY')}`,
                            dayRangeHeaderFormat: ({ start, end }) =>
                                `${moment(start).format('D MMMM')} - ${moment(end).format('D MMMM')}`
                        }}
                        toolbar={!isMobile}
                        step={60}
                        timeslots={1}
                        min={new Date(2024, 0, 1, 8, 0, 0)}
                        max={new Date(2024, 0, 1, 20, 0, 0)}
                    />
                )}
            </ConteneurCalendrierStyled>
        </Container>
    );
};

export default CalendrierReunions;