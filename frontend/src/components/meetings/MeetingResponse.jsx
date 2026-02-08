import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../Axios.jsx';
import {
    Container, Typography, Paper, TextField, Button, Box,
    Grid, Divider, CircularProgress, Alert
} from '@mui/material';

// Définir le mappage des types de réponse en dehors du composant
const RESPONSE_TYPE_MAP = {
    'yes': 'present',
    'no': 'absent',
    'maybe': 'undecided'
};

const ReponseReunionAvancee = () => {
    const { attendeeId, token, responseType } = useParams();
    const navigate = useNavigate();

    // Gestion d'état
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [meeting, setMeeting] = useState(null);
    const [attendee, setAttendee] = useState(null);
    const [status, setStatus] = useState('');
    const [note, setNote] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [processingStatus, setProcessingStatus] = useState(false);
    const [debugInfo, setDebugInfo] = useState([]);
    const [retryCount, setRetryCount] = useState(0);

    const MAX_RETRIES = 3;

    // Fonction de journalisation de débogage
    const logDebug = (message) => {
        const timestamp = new Date().toISOString();
        console.log(`[ReponseReunion] ${message}`);
        setDebugInfo(prev => [...prev, `${timestamp} - ${message}`]);
    };

    // Fonction de récupération des données de réunion
    const fetchData = async () => {
        try {
            setLoading(true);
            logDebug(`Chargement des données pour le participant: ${attendeeId}, token: ${token}`);

            // Journaliser l'URL appelée pour le débogage
            const url = `/meetings/response/${attendeeId}/${token}/`;
            logDebug(`Appel API: ${url}`);

            const response = await AxiosInstance.get(url);

            if (!response.data) {
                logDebug("Réponse vide reçue");
                setError("Aucune donnée reçue du serveur");
                setLoading(false);
                return;
            }

            logDebug(`Données reçues avec succès du backend`);

            if (!response.data.attendee || !response.data.meeting) {
                logDebug("Données de participant ou de réunion manquantes dans la réponse");
                setError("Données de réponse invalides reçues");
                setLoading(false);
                return;
            }

            // Définir l'état avec les données de réponse
            const { attendee, meeting } = response.data;
            setAttendee(attendee);
            setMeeting(meeting);
            setStatus(attendee.status || '');

            if (attendee.notes) {
                setNote(attendee.notes);
            }

            setLoading(false);

            // Gérer le type de réponse directe si présent
            if (responseType && RESPONSE_TYPE_MAP[responseType]) {
                handleDirectResponse(RESPONSE_TYPE_MAP[responseType]);
            }
        } catch (err) {
            console.error('Erreur lors de la récupération des données de réunion:', err);

            // Journalisation détaillée des erreurs
            logDebug(`Erreur lors du chargement des données: ${err.message}`);
            if (err.response) {
                logDebug(`Statut de réponse: ${err.response.status}`);
                if (err.response.data) {
                    logDebug(`Données de réponse: ${JSON.stringify(err.response.data)}`);
                }
            }

            // Messages d'erreur conviviaux
            if (err.response) {
                if (err.response.status === 404) {
                    setError('Le lien de réponse à la réunion est invalide ou expiré.');
                } else {
                    setError(`Erreur serveur: ${err.response.status} - ${err.response.data?.error || 'Erreur inconnue'}`);
                }
            } else if (err.request) {
                setError('Erreur réseau. Veuillez vérifier votre connexion et réessayer.');
            } else {
                setError('Une erreur inattendue s\'est produite. Veuillez réessayer plus tard.');
            }

            setRetryCount(prev => prev + 1);
            setLoading(false);
        }
    };

    // Gérer la réponse directe depuis l'URL
    const handleDirectResponse = async (newStatus) => {
        try {
            setProcessingStatus(true);
            logDebug(`Traitement de la réponse directe par URL avec statut=${newStatus}`);

            await AxiosInstance.post(`/meetings/response/${attendeeId}/${token}/`, {
                status: newStatus,
                notes: note
            });

            setStatus(newStatus);
            setSubmitted(true);
            logDebug('Réponse directe soumise avec succès');
        } catch (err) {
            console.error('Erreur lors de la soumission de la réponse directe:', err);
            logDebug(`Erreur lors de la soumission de la réponse directe: ${err.message}`);

            if (err.response) {
                logDebug(`Statut de réponse: ${err.response.status}`);
                logDebug(`Données de réponse: ${JSON.stringify(err.response.data || {})}`);
            }

            setError('Échec du traitement automatique de votre réponse. Veuillez essayer la soumission manuelle ci-dessous.');
        } finally {
            setProcessingStatus(false);
        }
    };

    // Gérer la soumission manuelle du formulaire
    const handleSubmit = async () => {
        if (!status) {
            setError('Veuillez sélectionner votre statut de présence.');
            return;
        }

        try {
            setProcessingStatus(true);
            logDebug(`Soumission de la réponse manuelle: statut=${status}`);

            await AxiosInstance.post(`/meetings/response/${attendeeId}/${token}/`, {
                status: status,
                notes: note
            });

            setSubmitted(true);
            logDebug('Réponse manuelle soumise avec succès');
        } catch (err) {
            console.error('Erreur lors de la soumission de la réponse:', err);
            logDebug(`Erreur lors de la soumission de la réponse manuelle: ${err.message}`);

            if (err.response) {
                logDebug(`Statut de réponse: ${err.response.status}`);
                if (err.response.data) {
                    logDebug(`Données de réponse: ${JSON.stringify(err.response.data)}`);
                }
            }

            setError('Échec de la soumission de votre réponse. Veuillez réessayer plus tard.');
        } finally {
            setProcessingStatus(false);
        }
    };

    // Charger les données au montage du composant
    useEffect(() => {
        if (retryCount < MAX_RETRIES) {
            fetchData();
        }
    }, [attendeeId, token, responseType]);

    // Logique de rendu basée sur l'état du composant
    if (loading || processingStatus) {
        return (
            <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
                <CircularProgress size={50} thickness={4} />
                <Typography variant="h6" sx={{ mt: 2 }}>
                    {processingStatus ? 'Traitement de votre réponse...' : 'Chargement des détails de la réunion...'}
                </Typography>
                {retryCount > 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Tentative {retryCount} sur {MAX_RETRIES}...
                    </Typography>
                )}
            </Container>
        );
    }

    if (submitted) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Box sx={{ color: 'success.main', fontSize: 60, mb: 2 }}>✓</Box>
                    <Typography variant="h5" gutterBottom>Réponse Soumise</Typography>
                    <Typography variant="body1" paragraph>
                        Merci d'avoir répondu à l'invitation à la réunion.
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Votre statut a été mis à jour vers: <strong>
                        {status === 'present' ? 'Présent' :
                            status === 'absent' ? 'Absent' :
                                status === 'undecided' ? 'Peut-être' : 'Excusé'}
                    </strong>
                    </Typography>
                    {meeting && (
                        <Box sx={{ mt: 2, mb: 3 }}>
                            <Typography variant="subtitle1">
                                <strong>{meeting.title}</strong>
                            </Typography>
                            <Typography variant="body2">
                                {new Date(meeting.start_date).toLocaleString()}
                            </Typography>
                        </Box>
                    )}
                    <Button variant="contained" onClick={() => navigate('/')}>
                        Retour au Tableau de Bord
                    </Button>
                </Paper>

            </Container>
        );
    }

    if (error && !meeting) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h5" gutterBottom>Erreur</Typography>
                    <Typography variant="body1" paragraph>
                        Un problème est survenu lors du traitement de votre réponse à la réunion.
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 3 }}>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                setRetryCount(0);
                                setError(null);
                                fetchData();
                            }}
                            disabled={retryCount >= MAX_RETRIES}
                        >
                            Réessayer
                        </Button>
                        <Button variant="contained" onClick={() => navigate('/')}>
                            Retour au Tableau de Bord
                        </Button>
                    </Box>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>Réponse à la Réunion</Typography>

            {meeting && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h5" gutterBottom>{meeting.title}</Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2">Date:</Typography>
                            <Typography variant="body1" gutterBottom>
                                {new Date(meeting.start_date).toLocaleDateString()}
                            </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2">Heure:</Typography>
                            <Typography variant="body1" gutterBottom>
                                {new Date(meeting.start_date).toLocaleTimeString()} -
                                {new Date(meeting.end_date).toLocaleTimeString()}
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle2">Lieu:</Typography>
                            <Typography variant="body1" gutterBottom>
                                {meeting.is_virtual ? (meeting.meeting_link ?
                                        <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer">
                                            Réunion Virtuelle (Cliquez pour rejoindre)
                                        </a> : 'Réunion Virtuelle') :
                                    (meeting.location || 'Lieu à déterminer')}
                            </Typography>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Votre Réponse</Typography>

                <Typography variant="body1" paragraph>Participerez-vous à cette réunion ?</Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item>
                        <Button
                            variant={status === 'present' ? 'contained' : 'outlined'}
                            color="success"
                            onClick={() => setStatus('present')}
                        >
                            Oui, je participerai
                        </Button>
                    </Grid>

                    <Grid item>
                        <Button
                            variant={status === 'absent' ? 'contained' : 'outlined'}
                            color="error"
                            onClick={() => setStatus('absent')}
                        >
                            Non, je ne peux pas participer
                        </Button>
                    </Grid>

                    <Grid item>
                        <Button
                            variant={status === 'undecided' ? 'contained' : 'outlined'}
                            color="warning"
                            onClick={() => setStatus('undecided')}
                        >
                            Peut-être / À discuter
                        </Button>
                    </Grid>
                </Grid>

                <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Notes supplémentaires (Optionnel)"
                    variant="outlined"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ajoutez des commentaires ou des raisons pour votre réponse"
                    sx={{ mb: 3 }}
                />

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={!status}
                    >
                        Soumettre la Réponse
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default ReponseReunionAvancee;