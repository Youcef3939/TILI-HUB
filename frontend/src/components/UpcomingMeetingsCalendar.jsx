import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Chip,
    CircularProgress,
    Paper,
} from '@mui/material';
import { styled, useTheme, alpha } from '@mui/material/styles';
import {
    Event,
    CalendarToday,
    VideoCall,
    LocationOn,
    ArrowForward,
    Add
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import AxiosInstance from './Axios';
import dayjs from 'dayjs';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const MeetingItem = styled(ListItem)(({ theme }) => ({
    borderRadius: theme.shape.borderRadius * 1.5,
    marginBottom: theme.spacing(1),
    transition: 'all 0.2s ease',
    padding: theme.spacing(2),

    '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
        transform: 'translateX(4px)',
    },

    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(1.5),
    },
}));

// ============================================================================
// STATUS CHIP COMPONENT
// ============================================================================

const StatusChip = ({ status }) => {
    const theme = useTheme();

    const statusConfig = {
        scheduled: { color: theme.palette.success.main, label: 'Planifié' },
        cancelled: { color: theme.palette.error.main, label: 'Annulé' },
        completed: { color: theme.palette.text.secondary, label: 'Terminé' },
        postponed: { color: theme.palette.warning.main, label: 'Reporté' },
        in_progress: { color: theme.palette.info.main, label: 'En cours' },
    };

    const config = statusConfig[status] || {
        color: theme.palette.primary.main,
        label: status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Inconnu'
    };

    return (
        <Chip
            size="small"
            label={config.label}
            sx={{
                color: config.color,
                bgcolor: alpha(config.color, 0.12),
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24,
            }}
        />
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const UpcomingMeetingsCalendar = () => {
    const theme = useTheme();
    const navigate = useNavigate();

    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch upcoming meetings
    useEffect(() => {
        const fetchMeetings = async () => {
            try {
                setLoading(true);
                const response = await AxiosInstance.get('/meetings/meetings/?filter=upcoming');
                const upcomingMeetings = response.data.slice(0, 5);
                setMeetings(upcomingMeetings);
            } catch (err) {
                console.error('Error fetching meetings:', err);
                setError('Échec du chargement des réunions');
            } finally {
                setLoading(false);
            }
        };

        fetchMeetings();
    }, []);

    // Format helpers
    const formatTime = (date) => dayjs(date).format('HH:mm');
    const formatDate = (date) => dayjs(date).format('DD MMM YYYY');

    // ========================================================================
    // LOADING STATE
    // ========================================================================
    if (loading) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 200,
                bgcolor: 'background.paper',
                borderRadius: 2,
            }}>
                <CircularProgress size={40} thickness={4} />
            </Box>
        );
    }

    // ========================================================================
    // ERROR STATE
    // ========================================================================
    if (error) {
        return (
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    border: '1px dashed',
                    borderColor: 'error.main',
                    textAlign: 'center'
                }}
            >
                <Typography color="error.main" sx={{ mb: 2, fontWeight: 600 }}>
                    {error}
                </Typography>
                <Button
                    size="small"
                    onClick={() => window.location.reload()}
                    variant="outlined"
                    color="error"
                >
                    Réessayer
                </Button>
            </Paper>
        );
    }

    // ========================================================================
    // MAIN RENDER
    // ========================================================================
    return (
        <Box>
            {/* Header Section - FIXED FOR MOBILE */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1.5, sm: 0 },
                mb: 2
            }}>
                <Typography
                    variant="h6"
                    fontWeight="700"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: { xs: '1rem', sm: '1.25rem' },
                        color: 'text.primary',
                    }}
                >
                    <CalendarToday sx={{
                        mr: 1,
                        fontSize: { xs: 20, sm: 24 },
                        color: 'primary.main'
                    }} />
                    Calendrier des Événements
                </Typography>

                {/* Action Buttons - FIXED FOR MOBILE */}
                <Box sx={{
                    display: 'flex',
                    gap: 1,
                    width: { xs: '100%', sm: 'auto' }
                }}>
                    <Button
                        component={Link}
                        to="/meetings/create"
                        startIcon={<Add />}
                        size="small"
                        variant="outlined"
                        sx={{
                            flex: { xs: 1, sm: 'none' },
                            minWidth: { xs: 0, sm: 'auto' },
                            fontWeight: 600,
                        }}
                    >
                        Nouveau
                    </Button>
                    <Button
                        component={Link}
                        to="/meetings"
                        endIcon={<ArrowForward />}
                        size="small"
                        sx={{
                            flex: { xs: 1, sm: 'none' },
                            minWidth: { xs: 0, sm: 'auto' },
                            fontWeight: 600,
                        }}
                    >
                        Voir Tout
                    </Button>
                </Box>
            </Box>

            {/* Empty State */}
            {meetings.length === 0 ? (
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2.5, sm: 3 },
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        border: '1px dashed',
                        borderColor: 'divider',
                        textAlign: 'center'
                    }}
                >
                    <CalendarToday sx={{
                        fontSize: 48,
                        color: 'text.disabled',
                        mb: 1
                    }} />
                    <Typography color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
                        Aucun événement à venir
                    </Typography>
                    <Button
                        variant="contained"
                        component={Link}
                        to="/meetings/create"
                        startIcon={<Add />}
                        size="small"
                    >
                        Planifier une Réunion
                    </Button>
                </Paper>
            ) : (
                /* Meetings List */
                <Paper
                    elevation={0}
                    sx={{
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    }}
                >
                    <List sx={{ p: { xs: 1, sm: 1.5 } }}>
                        {meetings.map((meeting, index) => (
                            <MeetingItem
                                key={meeting.id}
                                button
                                onClick={() => navigate(`/meetings/${meeting.id}`)}
                                divider={index < meetings.length - 1}
                            >
                                <ListItemAvatar>
                                    <Avatar sx={{
                                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                                        color: 'primary.main',
                                        width: { xs: 40, sm: 48 },
                                        height: { xs: 40, sm: 48 },
                                    }}>
                                        <Event />
                                    </Avatar>
                                </ListItemAvatar>

                                <ListItemText
                                    primary={
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: 1,
                                            mb: 0.5,
                                        }}>
                                            <Typography
                                                variant="body1"
                                                fontWeight="600"
                                                sx={{
                                                    fontSize: { xs: '0.95rem', sm: '1rem' },
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    maxWidth: { xs: '150px', sm: '300px' },
                                                }}
                                            >
                                                {meeting.title}
                                            </Typography>
                                            <StatusChip status={meeting.status} />
                                        </Box>
                                    }
                                    secondary={
                                        <Box sx={{ mt: 0.5 }}>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {formatDate(meeting.start_date)} • {formatTime(meeting.start_date)} - {formatTime(meeting.end_date)}
                                            </Typography>
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                mt: 0.5,
                                                gap: 0.5,
                                            }}>
                                                {meeting.is_virtual ? (
                                                    <VideoCall fontSize="small" color="action" />
                                                ) : (
                                                    <LocationOn fontSize="small" color="action" />
                                                )}
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{
                                                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {meeting.is_virtual ? 'Réunion virtuelle' : meeting.location}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    }
                                />
                            </MeetingItem>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
};

export default UpcomingMeetingsCalendar;