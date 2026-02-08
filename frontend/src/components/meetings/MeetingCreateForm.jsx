import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box, Container, Paper, Typography, TextField, Button, Grid,
    FormControl, InputLabel, Select, MenuItem, FormHelperText,
    FormControlLabel, Switch, Divider, CircularProgress, Alert,
    RadioGroup, Radio, Stepper, Step, StepLabel
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import { ArrowBack, Save } from '@mui/icons-material';
import AxiosInstance from '../Axios.jsx';
import { usePermissions } from '/src/contexts/PermissionsContext.jsx';

const TYPES_REUNION = [
    { value: 'regular', label: 'Réunion Mensuelle Régulière' },
    { value: 'board', label: 'Réunion du Conseil' },
    { value: 'extraordinary', label: 'Réunion Extraordinaire' },
    { value: 'general_assembly', label: 'Assemblée Générale' },
    { value: 'committee', label: 'Réunion de Comité' },
    { value: 'other', label: 'Autre' },
];

const FORMATS_REUNION = [
    { value: 'in_person', label: 'Présentiel Uniquement' },
    { value: 'virtual', label: 'Virtuel Uniquement' },
    { value: 'hybrid', label: 'Hybride (Présentiel & Virtuel)' },
];

const METHODES_NOTIFICATION = [
    { value: 'email', label: 'Email Uniquement' },
    { value: 'platform', label: 'Plateforme Uniquement' },
    { value: 'both', label: 'Email et Plateforme' },
];

const etapes = ['Informations de Base', 'Horaire & Lieu', 'Options Supplémentaires', 'Vérification & Création'];

const FormulaireCreationReunion = ({ isEditMode = false }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { can, RESOURCES, ACTIONS } = usePermissions();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditMode);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Données de formulaire par défaut avec modèle d'ordre du jour
    const ordreJourDefaut = `1. Accueil et Introduction
2. Approbation du Procès-verbal de la Réunion Précédente
3. Mise à jour Financière
4. Mises à jour des Projets
5. Nouveaux Sujets
6. Discussion Ouverte
7. Révision des Actions à Entreprendre
8. Date de la Prochaine Réunion`;

    // État du formulaire
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        meeting_type: 'regular',
        start_date: moment().add(1, 'day').set({ hour: 10, minute: 0, second: 0 }),
        end_date: moment().add(1, 'day').set({ hour: 12, minute: 0, second: 0 }),
        meeting_format: 'in_person',
        location: '',
        meeting_link: '',
        agenda: '',
        is_recurring: false,
        recurrence_pattern: {
            frequency: 'monthly',
            interval: 1,
            day_of_month: moment().date(),
            end_after: 12
        },
        notification_method: 'both',
        reminder_days_before: 2
    });

    // Erreurs de validation
    const [errors, setErrors] = useState({});

    // Récupérer les données de la réunion en mode édition
    useEffect(() => {
        if (isEditMode && id) {
            const fetchMeetingData = async () => {
                try {
                    setInitialLoading(true);
                    setError(null);

                    // Point d'accès corrigé pour utiliser /meetings/meetings/
                    const response = await AxiosInstance.get(`/meetings/meetings/${id}/`);
                    const meetingData = response.data;

                    // Déterminer le type de format à partir de is_virtual et location
                    let meetingFormat = 'in_person';
                    if (meetingData.is_virtual) {
                        meetingFormat = meetingData.location ? 'hybrid' : 'virtual';
                    }

                    setFormData({
                        title: meetingData.title || '',
                        description: meetingData.description || '',
                        meeting_type: meetingData.meeting_type || 'regular',
                        start_date: moment(meetingData.start_date),
                        end_date: moment(meetingData.end_date),
                        meeting_format: meetingFormat,
                        location: meetingData.location || '',
                        meeting_link: meetingData.meeting_link || '',
                        agenda: meetingData.agenda || '',
                        is_recurring: meetingData.is_recurring || false,
                        recurrence_pattern: meetingData.recurrence_pattern || {
                            frequency: 'monthly',
                            interval: 1,
                            day_of_month: moment(meetingData.start_date).date(),
                            end_after: 12
                        },
                        notification_method: meetingData.notification_method || 'both',
                        reminder_days_before: meetingData.reminder_days_before || 2
                    });

                    setInitialLoading(false);
                } catch (err) {
                    console.error('Erreur lors de la récupération des données de la réunion:', err);
                    setError('Échec du chargement des données de la réunion. Veuillez réessayer.');
                    setInitialLoading(false);
                }
            };

            fetchMeetingData();
        }
    }, [isEditMode, id]);

    // Gérer les changements de champs texte
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        // Effacer l'erreur pour ce champ
        if (errors[name]) {
            setErrors({ ...errors, [name]: null });
        }
    };

    // Gérer les changements de champs interrupteur
    const handleSwitchChange = (e) => {
        const { name, checked } = e.target;
        setFormData({ ...formData, [name]: checked });

        // Initialiser l'ordre du jour avec le modèle si on définit comme récurrent
        if (name === 'is_recurring' && checked && !formData.agenda) {
            setFormData({
                ...formData,
                [name]: checked,
                agenda: ordreJourDefaut
            });
        }
    };

    // Gérer les changements de date
    const handleDateChange = (name, value) => {
        setFormData({ ...formData, [name]: value });

        // Si la date de début change, ajuster la date de fin à 2 heures plus tard
        if (name === 'start_date') {
            const newEndDate = moment(value).add(2, 'hours');
            setFormData({
                ...formData,
                [name]: value,
                end_date: newEndDate
            });
        }

        if (errors[name]) {
            setErrors({ ...errors, [name]: null });
        }
    };

    // Gérer les changements du modèle de récurrence
    const handleRecurrenceChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            recurrence_pattern: {
                ...formData.recurrence_pattern,
                [name]: value
            }
        });
    };

    // Valider le formulaire pour l'étape courante
    const validateStep = () => {
        const newErrors = {};
        let isValid = true;

        // Étape 1: Informations de base
        if (activeStep === 0) {
            if (!formData.title.trim()) {
                newErrors.title = 'Le titre de la réunion est requis';
                isValid = false;
            }
            if (!formData.meeting_type) {
                newErrors.meeting_type = 'Le type de réunion est requis';
                isValid = false;
            }
        }

        // Étape 2: Horaire & Lieu
        else if (activeStep === 1) {
            if (!formData.start_date) {
                newErrors.start_date = 'La date de début est requise';
                isValid = false;
            }
            if (!formData.end_date) {
                newErrors.end_date = 'La date de fin est requise';
                isValid = false;
            }
            if (formData.end_date && formData.start_date &&
                moment(formData.end_date).isBefore(moment(formData.start_date))) {
                newErrors.end_date = 'La date de fin doit être après la date de début';
                isValid = false;
            }

            // Valider en fonction du format de réunion
            if (formData.meeting_format === 'in_person' || formData.meeting_format === 'hybrid') {
                if (!formData.location.trim()) {
                    newErrors.location = 'Le lieu est requis pour les réunions en présentiel ou hybrides';
                    isValid = false;
                }
            }

            if (formData.meeting_format === 'virtual' || formData.meeting_format === 'hybrid') {
                if (!formData.meeting_link.trim()) {
                    newErrors.meeting_link = 'Le lien de réunion est requis pour les réunions virtuelles ou hybrides';
                    isValid = false;
                }
            }
        }

        // Étape 3: Options supplémentaires
        else if (activeStep === 2) {
            if (formData.is_recurring) {
                const recurrence = formData.recurrence_pattern;
                if (!recurrence.frequency) {
                    newErrors.frequency = 'La fréquence est requise';
                    isValid = false;
                }
                if (!recurrence.interval || recurrence.interval < 1) {
                    newErrors.interval = 'L\'intervalle doit être au moins 1';
                    isValid = false;
                }
                if (recurrence.frequency === 'monthly' &&
                    (!recurrence.day_of_month || recurrence.day_of_month < 1 || recurrence.day_of_month > 28)) {
                    newErrors.day_of_month = 'Le jour du mois doit être entre 1 et 28';
                    isValid = false;
                }
            }
        }

        setErrors(newErrors);
        return isValid;
    };

    // Gérer l'étape suivante
    const handleNext = () => {
        if (validateStep()) {
            if (activeStep === etapes.length - 1) {
                handleSubmit();
            } else {
                setActiveStep(prevStep => prevStep + 1);
            }
        }
    };

    // Gérer l'étape précédente
    const handleBack = () => {
        setActiveStep(prevStep => prevStep - 1);
    };

    // Soumettre le formulaire
    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            // Obtenir l'association de l'utilisateur
            let associationId = null;
            const userStr = localStorage.getItem('user');

            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    associationId = user?.association?.id;
                } catch (e) {
                    console.error("Erreur lors de l'analyse des données utilisateur depuis localStorage:", e);
                }
            }

            // Si l'ID d'association n'est pas disponible, récupérer le profil utilisateur
            if (!associationId) {
                try {
                    // Point d'accès corrigé pour utiliser AxiosInstance et le chemin correct
                    const userProfileResponse = await AxiosInstance.get('/users/profile/');
                    associationId = userProfileResponse.data.association?.id;
                } catch (profileErr) {
                    console.error("Erreur lors de la récupération du profil utilisateur:", profileErr);
                    throw new Error("Impossible de déterminer votre association. Veuillez vous reconnecter.");
                }
            }

            if (!associationId) {
                throw new Error("Votre compte n'est associé à aucune organisation. Veuillez contacter un administrateur.");
            }

            // Convertir meeting_format en is_virtual pour la compatibilité API
            const requestData = {
                ...formData,
                start_date: formData.start_date.toISOString(),
                end_date: formData.end_date.toISOString(),
                association: associationId,
                is_virtual: formData.meeting_format === 'virtual' || formData.meeting_format === 'hybrid'
            };
            if (formData.is_recurring && formData.recurrence_pattern) {
                console.log("Sending recurrence pattern:", formData.recurrence_pattern);
                // Ensure all properties are of the correct type
                requestData.recurrence_pattern = {
                    frequency: String(formData.recurrence_pattern.frequency),
                    interval: Number(formData.recurrence_pattern.interval),
                    end_after: Number(formData.recurrence_pattern.end_after),
                    day_of_month: formData.recurrence_pattern.day_of_month
                        ? Number(formData.recurrence_pattern.day_of_month)
                        : moment(formData.start_date).date()
                };
            }

            let response;
            if (isEditMode) {
                // Point d'accès corrigé pour utiliser AxiosInstance et le chemin correct
                response = await AxiosInstance.put(`/meetings/meetings/${id}/`, requestData);
            } else {
                // Point d'accès corrigé pour utiliser AxiosInstance et le chemin correct
                response = await AxiosInstance.post('/meetings/meetings/', requestData);
            }

            setSuccess(true);

            // Naviguer vers les détails de la réunion après un délai
            setTimeout(() => {
                navigate(`/meetings/${isEditMode ? id : response.data.id}`);
            }, 1500);
        } catch (err) {
            console.error(`Erreur lors de ${isEditMode ? 'la mise à jour' : 'la création'} de la réunion:`, err);

            let errorMessage;
            if (err.response?.data) {
                if (typeof err.response.data === 'object') {
                    errorMessage = Object.entries(err.response.data)
                        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
                        .join(', ');
                } else {
                    errorMessage = err.response.data;
                }
            } else if (err.message) {
                errorMessage = err.message;
            } else {
                errorMessage = "Une erreur inconnue s'est produite. Veuillez consulter la console pour plus de détails.";
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <Container maxWidth="md">
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                    <CircularProgress size={60} thickness={4} />
                    <Typography variant="h6" sx={{ mt: 2 }}>
                        Chargement des détails de la réunion...
                    </Typography>
                </Box>
            </Container>
        );
    }

    // Rendre un contenu différent selon l'étape courante
    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                name="title"
                                label="Titre de la Réunion"
                                value={formData.title}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                error={!!errors.title}
                                helperText={errors.title}
                                placeholder="ex., Réunion Mensuelle du Conseil - Avril 2025"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required error={!!errors.meeting_type}>
                                <InputLabel>Type de Réunion</InputLabel>
                                <Select
                                    name="meeting_type"
                                    value={formData.meeting_type}
                                    onChange={handleInputChange}
                                    label="Type de Réunion"
                                >
                                    {TYPES_REUNION.map((type) => (
                                        <MenuItem key={type.value} value={type.value}>
                                            {type.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.meeting_type && <FormHelperText>{errors.meeting_type}</FormHelperText>}
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                name="description"
                                label="Description"
                                value={formData.description}
                                onChange={handleInputChange}
                                fullWidth
                                multiline
                                rows={4}
                                placeholder="Brève description de l'objectif et des buts de la réunion"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                name="agenda"
                                label="Ordre du Jour"
                                value={formData.agenda}
                                onChange={handleInputChange}
                                fullWidth
                                multiline
                                rows={6}
                                placeholder="Saisissez les points de l'ordre du jour"
                                helperText={
                                    <Button
                                        size="small"
                                        onClick={() => setFormData({...formData, agenda: ordreJourDefaut})}
                                        sx={{ mt: 1 }}
                                    >
                                        Utiliser le Modèle par Défaut
                                    </Button>
                                }
                            />
                        </Grid>
                    </Grid>
                );

            case 1:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <LocalizationProvider dateAdapter={AdapterMoment}>
                                <DateTimePicker
                                    label="Date & Heure de Début"
                                    value={formData.start_date}
                                    onChange={(newValue) => handleDateChange('start_date', newValue)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            required: true,
                                            error: !!errors.start_date,
                                            helperText: errors.start_date
                                        }
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <LocalizationProvider dateAdapter={AdapterMoment}>
                                <DateTimePicker
                                    label="Date & Heure de Fin"
                                    value={formData.end_date}
                                    onChange={(newValue) => handleDateChange('end_date', newValue)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            required: true,
                                            error: !!errors.end_date,
                                            helperText: errors.end_date
                                        }
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>

                        <Grid item xs={12}>
                            <FormControl component="fieldset" sx={{ width: '100%' }}>
                                <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 1 }}>
                                    Format de Réunion
                                </Typography>
                                <RadioGroup
                                    row
                                    name="meeting_format"
                                    value={formData.meeting_format}
                                    onChange={handleInputChange}
                                >
                                    {FORMATS_REUNION.map((format) => (
                                        <FormControlLabel
                                            key={format.value}
                                            value={format.value}
                                            control={<Radio />}
                                            label={format.label}
                                        />
                                    ))}
                                </RadioGroup>
                            </FormControl>
                        </Grid>

                        {(formData.meeting_format === 'in_person' || formData.meeting_format === 'hybrid') && (
                            <Grid item xs={12}>
                                <TextField
                                    name="location"
                                    label="Lieu de la Réunion"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    fullWidth
                                    required
                                    error={!!errors.location}
                                    helperText={errors.location}
                                    placeholder="ex., Salle de Conférence A, Bureau Principal"
                                />
                            </Grid>
                        )}

                        {(formData.meeting_format === 'virtual' || formData.meeting_format === 'hybrid') && (
                            <Grid item xs={12}>
                                <TextField
                                    name="meeting_link"
                                    label="Lien de la Réunion"
                                    value={formData.meeting_link}
                                    onChange={handleInputChange}
                                    fullWidth
                                    required
                                    error={!!errors.meeting_link}
                                    helperText={errors.meeting_link}
                                    placeholder="ex., https://zoom.us/j/123456789"
                                />
                            </Grid>
                        )}
                    </Grid>
                );

            case 2:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Paper sx={{ p: 3, mb: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" fontWeight="bold">
                                        Réunion Récurrente
                                    </Typography>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.is_recurring}
                                                onChange={handleSwitchChange}
                                                name="is_recurring"
                                                color="primary"
                                            />
                                        }
                                        label=""
                                    />
                                </Box>

                                {formData.is_recurring && (
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <FormControl fullWidth required error={!!errors.frequency}>
                                                <InputLabel>Fréquence</InputLabel>
                                                <Select
                                                    name="frequency"
                                                    value={formData.recurrence_pattern.frequency}
                                                    onChange={handleRecurrenceChange}
                                                    label="Fréquence"
                                                >
                                                    <MenuItem value="daily">Quotidienne</MenuItem>
                                                    <MenuItem value="weekly">Hebdomadaire</MenuItem>
                                                    <MenuItem value="monthly">Mensuelle</MenuItem>
                                                </Select>
                                                {errors.frequency && <FormHelperText>{errors.frequency}</FormHelperText>}
                                            </FormControl>
                                        </Grid>

                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                name="interval"
                                                label="Intervalle"
                                                type="number"
                                                value={formData.recurrence_pattern.interval}
                                                onChange={handleRecurrenceChange}
                                                fullWidth
                                                required
                                                inputProps={{ min: 1, max: 12 }}
                                                error={!!errors.interval}
                                                helperText={errors.interval || `Répéter tous les ${formData.recurrence_pattern.interval} ${formData.recurrence_pattern.frequency === 'daily' ? 'jours' : formData.recurrence_pattern.frequency === 'weekly' ? 'semaines' : 'mois'}`}
                                            />
                                        </Grid>

                                        {formData.recurrence_pattern.frequency === 'monthly' && (
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    name="day_of_month"
                                                    label="Jour du Mois"
                                                    type="number"
                                                    value={formData.recurrence_pattern.day_of_month}
                                                    onChange={handleRecurrenceChange}
                                                    fullWidth
                                                    required
                                                    inputProps={{ min: 1, max: 28 }}
                                                    error={!!errors.day_of_month}
                                                    helperText={errors.day_of_month || "Choisissez entre 1-28 pour assurer des dates valides pour tous les mois"}
                                                />
                                            </Grid>
                                        )}

                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                name="end_after"
                                                label="Terminer Après"
                                                type="number"
                                                value={formData.recurrence_pattern.end_after}
                                                onChange={handleRecurrenceChange}
                                                fullWidth
                                                required
                                                inputProps={{ min: 1, max: 24 }}
                                                helperText={`Crée ${formData.recurrence_pattern.end_after} occurrences de cette réunion`}
                                            />
                                        </Grid>
                                    </Grid>
                                )}
                            </Paper>
                        </Grid>

                        <Grid item xs={12}>
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Paramètres de Notification
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Méthode de Notification</InputLabel>
                                            <Select
                                                name="notification_method"
                                                value={formData.notification_method}
                                                onChange={handleInputChange}
                                                label="Méthode de Notification"
                                            >
                                                {METHODES_NOTIFICATION.map((method) => (
                                                    <MenuItem key={method.value} value={method.value}>
                                                        {method.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            name="reminder_days_before"
                                            label="Rappel Jours Avant"
                                            type="number"
                                            value={formData.reminder_days_before}
                                            onChange={handleInputChange}
                                            fullWidth
                                            inputProps={{ min: 1, max: 14 }}
                                            helperText={`Envoyer un rappel ${formData.reminder_days_before} jours avant la réunion`}
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>
                    </Grid>
                );

            case 3:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Alert severity="info" sx={{ mb: 3 }}>
                                Veuillez vérifier les détails de la réunion ci-dessous avant {isEditMode ? 'la mise à jour' : 'la création'} de la réunion.
                                Tous les participants seront notifiés selon vos paramètres de notification.
                            </Alert>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Informations de Base
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Typography variant="subtitle2" color="text.secondary">Titre</Typography>
                                <Typography variant="body1" fontWeight="medium" gutterBottom>{formData.title}</Typography>

                                <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                                <Typography variant="body1" gutterBottom>
                                    {TYPES_REUNION.find(t => t.value === formData.meeting_type)?.label || formData.meeting_type}
                                </Typography>

                                {formData.description && (
                                    <>
                                        <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                                        <Typography variant="body2" paragraph>{formData.description}</Typography>
                                    </>
                                )}
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Horaire & Lieu
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                                <Typography variant="body1" gutterBottom>
                                    {formData.start_date.format('dddd, MMMM D, YYYY')}
                                </Typography>

                                <Typography variant="subtitle2" color="text.secondary">Heure</Typography>
                                <Typography variant="body1" gutterBottom>
                                    {formData.start_date.format('h:mm A')} - {formData.end_date.format('h:mm A')}
                                </Typography>

                                <Typography variant="subtitle2" color="text.secondary">Format</Typography>
                                <Typography variant="body1" gutterBottom>
                                    {FORMATS_REUNION.find(f => f.value === formData.meeting_format)?.label || formData.meeting_format}
                                </Typography>

                                {(formData.meeting_format === 'in_person' || formData.meeting_format === 'hybrid') && (
                                    <>
                                        <Typography variant="subtitle2" color="text.secondary">Lieu</Typography>
                                        <Typography variant="body1" gutterBottom>{formData.location}</Typography>
                                    </>
                                )}

                                {(formData.meeting_format === 'virtual' || formData.meeting_format === 'hybrid') && (
                                    <>
                                        <Typography variant="subtitle2" color="text.secondary">Lien de Réunion</Typography>
                                        <Typography variant="body1" gutterBottom>{formData.meeting_link}</Typography>
                                    </>
                                )}
                            </Paper>
                        </Grid>

                        <Grid item xs={12}>
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Options Supplémentaires
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" color="text.secondary">Réunion Récurrente</Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {formData.is_recurring ?
                                                `Oui - ${formData.recurrence_pattern.frequency === 'daily' ? 'Quotidienne' :
                                                    formData.recurrence_pattern.frequency === 'weekly' ? 'Hebdomadaire' : 'Mensuelle'} 
                          (tous les ${formData.recurrence_pattern.interval} ${formData.recurrence_pattern.frequency === 'daily' ? 'jour' :
                                                    formData.recurrence_pattern.frequency === 'weekly' ? 'semaine' : 'mois'}${formData.recurrence_pattern.interval > 1 ? 's' : ''})` :
                                                'Non - Réunion Unique'}
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" color="text.secondary">Paramètres de Notification</Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {METHODES_NOTIFICATION.find(m => m.value === formData.notification_method)?.label || formData.notification_method},
                                            {` ${formData.reminder_days_before} ${formData.reminder_days_before === 1 ? 'jour' : 'jours'} avant la réunion`}
                                        </Typography>
                                    </Grid>
                                </Grid>

                                {formData.agenda && (
                                    <>
                                        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Ordre du Jour</Typography>
                                        <Paper sx={{ p: 2, bgcolor: '#f5f5f5', mt: 1 }}>
                                            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                                {formData.agenda}
                                            </Typography>
                                        </Paper>
                                    </>
                                )}
                            </Paper>
                        </Grid>
                    </Grid>
                );

            default:
                return null;
        }
    };

    return (
        <Container maxWidth="xl">
            <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate('/meetings')}
                sx={{ mb: 2 }}
            >
                Retour aux Réunions
            </Button>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    {isEditMode ? 'Modifier la Réunion' : 'Créer une Nouvelle Réunion'}
                </Typography>
            </Paper>

            {/* Message de Réussite */}
            {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    Réunion {isEditMode ? 'mise à jour' : 'créée'} avec succès ! Redirection vers les détails de la réunion...
                </Alert>
            )}

            {/* Message d'Erreur */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Stepper */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Stepper activeStep={activeStep} alternativeLabel>
                    {etapes.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Paper>

            {/* Contenu du Formulaire */}
            <Paper sx={{ p: 3, mb: 3 }}>
                {renderStepContent()}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                    <Button
                        disabled={activeStep === 0 || loading || success}
                        onClick={handleBack}
                        variant="outlined"
                    >
                        Retour
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={loading || success}
                        endIcon={activeStep === etapes.length - 1 ? <Save /> : null}
                    >
                        {activeStep === etapes.length - 1 ? (isEditMode ? 'Mettre à Jour la Réunion' : 'Créer la Réunion') : 'Suivant'}
                        {loading && <CircularProgress size={24} sx={{ ml: 1 }} />}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default FormulaireCreationReunion;