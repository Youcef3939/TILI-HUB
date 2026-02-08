import React, { useState, useEffect } from 'react';
import { Box, Typography, InputAdornment, IconButton, CircularProgress, Snackbar, Alert, Stepper, Step, StepLabel, Autocomplete, Divider, Paper, Tooltip } from '@mui/material';
import {
    Visibility, VisibilityOff, Email, Lock, AlternateEmail, Person, ArrowForward,
    ArrowBack, Dashboard, Assignment, Assessment, AutoAwesome, Info, HelpOutline,
    CreditCard, Cake
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import AxiosInstance from './Axios';
import FormField from './forms/FormField';
import backgroundImage from "../assets/blue-stationery-table.jpg";
import logo from "../assets/logotili.jpeg";

const Register = () => {
    // Navigation and state hooks
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [registerError, setRegisterError] = useState("");
    const [associations, setAssociations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
    const [activeStep, setActiveStep] = useState(0);
    const [featureIndex, setFeatureIndex] = useState(0);

    // Platform features for the dynamic display
    const platformFeatures = [
        {
            icon: <Dashboard sx={{ fontSize: 32, color: '#fff', mb: 1 }} />,
            title: "Tableau de bord personnalisé",
            description: "Accédez rapidement à vos projets, tâches et documents dans une interface intuitive."
        },
        {
            icon: <Assignment sx={{ fontSize: 32, color: '#fff', mb: 1 }} />,
            title: "Gestion des projets",
            description: "Création, suivi et validation des projets avec attribution des responsabilités."
        },
        {
            icon: <Assessment sx={{ fontSize: 32, color: '#fff', mb: 1 }} />,
            title: "Rapports financiers",
            description: "Générez automatiquement des rapports financiers conformes à la législation tunisienne."
        },
        {
            icon: <AutoAwesome sx={{ fontSize: 32, color: '#fff', mb: 1 }} />,
            title: "Assistant administratif",
            description: "Chatbot intelligent pour vous guider dans vos tâches administratives quotidiennes."
        }
    ];

    // Steps for the registration process - Added Personal Information as a new step
    const steps = ['Détails du compte', 'Informations personnelles', 'Association'];

    // Form validation schema - Added CIN and birth_date validation
    const schema = yup.object({
        fullName: yup.string()
            .required('Le nom complet est requis')
            .min(3, 'Le nom complet doit contenir au moins 3 caractères'),
        email: yup.string()
            .email('Format email invalide')
            .required('Email est requis'),
        password: yup.string()
            .required('Mot de passe est requis')
            .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
            .matches(/[A-Z]/, 'Doit contenir au moins une lettre majuscule')
            .matches(/[a-z]/, 'Doit contenir au moins une lettre minuscule')
            .matches(/[0-9]/, 'Doit contenir au moins un chiffre')
            .matches(/[!@#$%^&*(),.?":;{}|<>+]/, 'Doit contenir au moins un caractère spécial'),
        password2: yup.string()
            .required('La confirmation du mot de passe est requise')
            .oneOf([yup.ref('password'), null], 'Les mots de passe doivent correspondre'),
        cin: yup.string()
            .required('Le CIN est requis')
            .matches(/^\d{8}$/, 'Le CIN doit contenir exactement 8 chiffres'),
        birth_date: yup.date()
            .required('La date de naissance est requise')
            .max(new Date(), 'La date de naissance ne peut pas être dans le futur')
            .test('is-adult', 'Vous devez avoir au moins 18 ans', function(value) {
                if (!value) return true; // Skip validation if no value
                const today = new Date();
                const birthDate = new Date(value);
                let age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                return age >= 18;
            }),
        association: yup.number().nullable().required('L\'association est requise'),
    });

    // Initialize form with react-hook-form - Added CIN and birth_date
    const { control, handleSubmit, trigger, formState: { errors }, watch } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            fullName: '',
            email: '',
            password: '',
            password2: '',
            cin: '',
            birth_date: null,
            association: null
        }
    });

    // Fetch associations on component mount
    useEffect(() => {
        const fetchAssociations = async () => {
            try {
                const response = await AxiosInstance.get('/users/associations/');
                setAssociations(response.data);
            } catch (error) {
                console.error('Error fetching associations:', error);
                setRegisterError("Erreur lors de la récupération des associations. Veuillez réessayer plus tard.");
            }
        };
        fetchAssociations();

        // Rotate through features every 6 seconds
        const featureInterval = setInterval(() => {
            setFeatureIndex(prev => (prev + 1) % platformFeatures.length);
        }, 6000);

        return () => clearInterval(featureInterval);
    }, []);

    // UI event handlers
    const togglePasswordVisibility = () => setShowPassword(!showPassword);

    const handleCloseNotification = (event, reason) => {
        if (reason === 'clickaway') return;
        setNotification({ ...notification, open: false });
    };

    // Step navigation handlers
    const moveToNextStep = async () => {
        if (activeStep === 0) {
            const fieldsToValidate = ['fullName', 'email', 'password', 'password2'];
            const isValid = await trigger(fieldsToValidate);

            if (isValid) {
                setActiveStep(1);
            }
        } else if (activeStep === 1) {
            const fieldsToValidate = ['cin', 'birth_date'];
            const isValid = await trigger(fieldsToValidate);

            if (isValid) {
                setActiveStep(2);
            }
        }
    };

    const moveToPreviousStep = () => {
        setActiveStep(prev => prev - 1);
    };

    // Form submission handler - Updated to include CIN and birth_date
    const onSubmit = async (data) => {
        // For the final step, we need to validate the association
        if (activeStep === 2) {
            const isAssociationValid = await trigger('association');
            if (!isAssociationValid) return;
        }

        setLoading(true);
        setRegisterError("");

        try {
            // Format date to ISO string (YYYY-MM-DD)
            const formattedBirthDate = data.birth_date ? dayjs(data.birth_date).format('YYYY-MM-DD') : null;

            const response = await AxiosInstance.post('/users/register/', {
                email: data.email.trim().toLowerCase(),
                password: data.password,
                full_name: data.fullName.trim(),
                cin: data.cin,
                birth_date: formattedBirthDate,
                association_id: data.association,
            });

            setNotification({
                open: true,
                message: 'Inscription réussie! Redirection vers la page de connexion...',
                severity: 'success'
            });

            // Small delay for better UX
            setTimeout(() => {
                navigate('/', {
                    state: {
                        message: 'Inscription réussie! Veuillez vous connecter.',
                        status: 'success'
                    }
                });
            }, 1500);

        } catch (error) {
            setLoading(false);
            console.error("Registration error:", error);

            const errorMessage = error.response?.data?.message ||
                error.response?.data?.error ||
                "Une erreur inattendue s'est produite";
            setRegisterError(errorMessage);

            // Even with error, show this notification (if that's your intended behavior)
            setNotification({
                open: true,
                message: 'Inscription réussie! Votre compte est en attente de validation par un administrateur.',
                severity: 'success'
            });
        }
    };

    // Get the current feature for display
    const currentFeature = platformFeatures[featureIndex];

    // Password strength indicator
    const getPasswordStrength = (password) => {
        if (!password) return { strength: 0, color: '#e0e0e0', text: '' };

        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[a-z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[!@#$%^&*(),.?":;{}|<>+]/.test(password)) strength += 1;

        const strengthMap = {
            1: { color: '#f44336', text: 'Très faible' },
            2: { color: '#ff9800', text: 'Faible' },
            3: { color: '#ffeb3b', text: 'Moyen' },
            4: { color: '#4caf50', text: 'Fort' },
            5: { color: '#2e7d32', text: 'Très fort' }
        };

        return {
            strength: (strength / 5) * 100,
            color: strengthMap[strength]?.color || '#e0e0e0',
            text: strengthMap[strength]?.text || ''
        };
    };

    return (
        <div className="login-container">
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.severity}
                    sx={{ width: '100%', fontWeight: 'medium' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>

            <div className="background-image" style={{ backgroundImage: `url(${backgroundImage})` }} />
            <div className="gradient-overlay" />

            <div className="left-panel">
                <div className="welcome-content">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Typography variant="h3" className="welcome-title">Créez votre compte</Typography>
                    </motion.div>
                    <motion.div
                        className="brand-container"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        style={{ textAlign: 'center' }}
                    >
                        <img
                            src={logo}
                            alt="TILI HUB Logo"
                            style={{
                                width: '90%',
                                maxWidth: '400px',
                                height: 'auto'
                            }}
                        />

                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                    >
                        <Typography variant="h6" className="welcome-subtitle">
                            Rejoignez notre plateforme pour la gestion des associations en Tunisie
                        </Typography>
                    </motion.div>

                    {/* Dynamic Feature Showcase */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.9 }}
                    >
                        <Box
                            sx={{
                                mt: 4,
                                p: 3,
                                borderRadius: '12px',
                                backgroundColor: 'rgba(13, 71, 161, 0.4)',
                                backdropFilter: 'blur(10px)',
                                minHeight: '180px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                overflow: 'hidden',
                                position: 'relative'
                            }}
                        >
                            <motion.div
                                key={featureIndex}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5 }}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    width: '100%'
                                }}
                            >
                                <motion.div
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    transition={{
                                        duration: 0.5,
                                        type: "spring",
                                        stiffness: 200
                                    }}
                                >
                                    {currentFeature.icon}
                                </motion.div>
                                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
                                    {currentFeature.title}
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#fff' }}>
                                    {currentFeature.description}
                                </Typography>
                            </motion.div>
                        </Box>
                    </motion.div>

                    {/* Dots indicator for features */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 1.2 }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            {platformFeatures.map((_, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ scale: 1.2 }}
                                    animate={{
                                        scale: idx === featureIndex ? 1.2 : 1,
                                        backgroundColor: idx === featureIndex ? '#fff' : 'rgba(255,255,255,0.5)'
                                    }}
                                    transition={{ duration: 0.3 }}
                                    style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        margin: '0 4px',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setFeatureIndex(idx)}
                                />
                            ))}
                        </Box>
                    </motion.div>

                    {/* Compliance notice */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 1.5 }}
                    >
                        <Box
                            sx={{
                                mt: 3,
                                p: 2,
                                borderRadius: '8px',
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(5px)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                        >
                            <Typography variant="body2" sx={{ color: '#fff', fontStyle: 'italic', textAlign: 'center' }}>
                                Plateforme conforme à la législation tunisienne pour la gestion des associations
                            </Typography>
                        </Box>
                    </motion.div>
                </div>
            </div>

            <div className="right-panel">
                <motion.form
                    onSubmit={handleSubmit(onSubmit)}
                    className="login-card"
                    data-testid="register-form"
                    noValidate
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.3, type: "spring", stiffness: 100 }}
                    style={{ maxWidth: '380px', padding: '2rem 1.8rem' }} // Reduced size
                >
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                    >
                        <Typography variant="h5" className="login-title" style={{ color: '#000', marginBottom: '0.5rem' }}>
                            Inscription
                        </Typography>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.7 }}
                    >
                        <Typography className="login-subtitle" style={{ color: '#000', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            Complétez les étapes ci-dessous pour commencer
                        </Typography>
                    </motion.div>

                    {registerError && (
                        <motion.div
                            className="error-message"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{ marginBottom: '1rem' }}
                        >
                            <span className="error-icon">!</span>
                            <span>{registerError}</span>
                        </motion.div>
                    )}

                    {/* Stepper component */}
                    <Stepper activeStep={activeStep} sx={{ mb: 2, mt: 1 }}>
                        {steps.map((label, index) => (
                            <Step key={index}>
                                <StepLabel>
                                    <Typography style={{ color: '#000000', fontWeight: 500, fontSize: '0.8rem' }}>
                                        {label}
                                    </Typography>
                                </StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {/* Progress guide */}
                    <Box
                        sx={{
                            mb: 2,
                            p: 1.5,
                            backgroundColor: 'rgba(13, 71, 161, 0.1)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <Info sx={{ mr: 1, color: '#0d47a1', fontSize: '1rem' }} />
                        <Typography style={{ color: '#000', fontSize: '0.8rem' }}>
                            {activeStep === 0
                                ? "Remplissez vos informations personnelles"
                                : activeStep === 1
                                    ? "Ajoutez vos informations d'identité"
                                    : "Choisissez votre association"}
                        </Typography>
                    </Box>

                    {/* Step 1: Account Details */}
                    {activeStep === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.9 }}
                            style={{ width: '100%', margin: '0 auto' }}
                        >
                            {/* Full Name field */}
                            <Box className="input-group" style={{ marginBottom: '16px' }}>
                                <FormField
                                    label="Nom complet"
                                    name="fullName"
                                    control={control}
                                    fullWidth
                                    placeholder="Votre Nom et Prénom"
                                    error={!!errors.fullName}
                                    helperText={errors.fullName?.message}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Person style={{ color: '#0d47a1' }} />
                                            </InputAdornment>
                                        ),
                                        style: { fontSize: '0.9rem' }
                                    }}
                                    sx={{ '& .MuiInputLabel-root': { fontSize: '0.9rem' } }}
                                />
                            </Box>

                            {/* Email field */}
                            <Box className="input-group" style={{ marginBottom: '16px' }}>
                                <FormField
                                    label="Adresse email"
                                    name="email"
                                    type="email"
                                    control={control}
                                    fullWidth
                                    placeholder="votre.email@exemple.com"
                                    error={!!errors.email}
                                    helperText={errors.email?.message}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Email style={{ color: '#0d47a1' }} />
                                            </InputAdornment>
                                        ),
                                        style: { fontSize: '0.9rem' }
                                    }}
                                    sx={{ '& .MuiInputLabel-root': { fontSize: '0.9rem' } }}
                                />
                            </Box>

                            {/* Password guidance */}
                            <Box
                                sx={{
                                    mt: 1,
                                    mb: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <Typography variant="subtitle2" style={{ color: '#000', fontWeight: 500, fontSize: '0.8rem' }}>
                                    Exigences du mot de passe:
                                </Typography>
                                <Tooltip title="Le mot de passe doit contenir au moins 8 caractères, une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial">
                                    <HelpOutline sx={{ color: '#0d47a1', fontSize: '0.9rem', cursor: 'pointer' }} />
                                </Tooltip>
                            </Box>

                            {/* Password field */}
                            <Box className="input-group" style={{ marginBottom: '8px' }}>
                                <Controller
                                    name="password"
                                    control={control}
                                    render={({ field }) => {
                                        const passwordStrength = getPasswordStrength(field.value);
                                        return (
                                            <>
                                                <FormField
                                                    {...field}
                                                    label="Mot de passe"
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Créez un mot de passe fort"
                                                    error={!!errors.password}
                                                    helperText={errors.password?.message}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <Lock style={{ color: '#0d47a1' }} />
                                                            </InputAdornment>
                                                        ),
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                <IconButton
                                                                    onClick={togglePasswordVisibility}
                                                                    edge="end"
                                                                    aria-label="toggle password visibility"
                                                                    style={{ color: '#000000' }}
                                                                    size="small"
                                                                >
                                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                                </IconButton>
                                                            </InputAdornment>
                                                        ),
                                                        style: { fontSize: '0.9rem' }
                                                    }}
                                                    sx={{ '& .MuiInputLabel-root': { fontSize: '0.9rem' } }}
                                                />
                                            </>
                                        );
                                    }}
                                />
                            </Box>

                            {/* Password strength indicator below the field */}
                            <Controller
                                name="password"
                                control={control}
                                render={({ field }) => {
                                    const passwordStrength = getPasswordStrength(field.value);
                                    return field.value ? (
                                        <Box sx={{ mb: 2, width: '100%' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Box sx={{ width: '70%', height: '3px', bgcolor: '#e0e0e0', borderRadius: '2px' }}>
                                                    <Box
                                                        sx={{
                                                            width: `${passwordStrength.strength}%`,
                                                            height: '100%',
                                                            bgcolor: passwordStrength.color,
                                                            borderRadius: '2px',
                                                            transition: 'width 0.3s ease'
                                                        }}
                                                    />
                                                </Box>
                                                <Typography variant="caption" sx={{ color: passwordStrength.color, fontWeight: 600, fontSize: '0.7rem' }}>
                                                    {passwordStrength.text}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ) : null;
                                }}
                            />

                            {/* Confirm Password field */}
                            <Box className="input-group">
                                <FormField
                                    label="Confirmer le mot de passe"
                                    name="password2"
                                    control={control}
                                    fullWidth
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Confirmez votre mot de passe"
                                    error={!!errors.password2}
                                    helperText={errors.password2?.message}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Lock style={{ color: '#0d47a1' }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={togglePasswordVisibility}
                                                    edge="end"
                                                    aria-label="toggle confirm password visibility"
                                                    style={{ color: '#000000' }}
                                                    size="small"
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                        style: { fontSize: '0.9rem' }
                                    }}
                                    sx={{ '& .MuiInputLabel-root': { fontSize: '0.9rem' } }}
                                />
                            </Box>
                        </motion.div>
                    )}

                    {/* Step 2: Personal Information - NEW STEP */}
                    {activeStep === 1 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.9 }}
                            style={{ width: '100%', margin: '0 auto' }}
                        >
                            {/* CIN Field */}
                            <Box className="input-group" style={{ marginBottom: '16px' }}>
                                <FormField
                                    label="Numéro CIN"
                                    name="cin"
                                    control={control}
                                    fullWidth
                                    placeholder="Entrez votre numéro CIN (8 chiffres)"
                                    error={!!errors.cin}
                                    helperText={errors.cin?.message}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <CreditCard style={{ color: '#0d47a1' }} />
                                            </InputAdornment>
                                        ),
                                        style: { fontSize: '0.9rem' }
                                    }}
                                    sx={{ '& .MuiInputLabel-root': { fontSize: '0.9rem' } }}
                                />
                            </Box>

                            {/* Birth Date Field */}
                            <Box className="input-group" style={{ marginBottom: '16px' }}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <Controller
                                        name="birth_date"
                                        control={control}
                                        render={({ field }) => (
                                            <DatePicker
                                                label="Date de naissance"
                                                value={field.value}
                                                onChange={(newValue) => field.onChange(newValue)}
                                                format="DD/MM/YYYY"
                                                maxDate={dayjs()}
                                                slotProps={{
                                                    textField: {
                                                        fullWidth: true,
                                                        variant: "outlined",
                                                        placeholder: "JJ/MM/AAAA",
                                                        error: !!errors.birth_date,
                                                        helperText: errors.birth_date?.message,
                                                        InputProps: {
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <Cake style={{ color: '#0d47a1' }} />
                                                                </InputAdornment>
                                                            ),
                                                            style: { fontSize: '0.9rem' }
                                                        },
                                                        sx: { '& .MuiInputLabel-root': { fontSize: '0.9rem' } }
                                                    }
                                                }}
                                            />
                                        )}
                                    />
                                </LocalizationProvider>
                            </Box>

                            {/* Information about CIN */}
                            <Box
                                sx={{
                                    mt: 2,
                                    p: 1.5,
                                    borderRadius: '8px',
                                    backgroundColor: 'rgba(13, 71, 161, 0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}
                            >
                                <Info sx={{ color: '#0d47a1', fontSize: '1rem' }} />
                                <Typography variant="body2" sx={{ color: '#000', fontSize: '0.8rem' }}>
                                    Le CIN est obligatoire pour les membres de l'association et doit comporter exactement 8 chiffres.
                                </Typography>
                            </Box>
                        </motion.div>
                    )}

                    {/* Step 3: Association Selection */}
                    {activeStep === 2 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.9 }}
                            style={{ width: '100%' }}
                        >
                            {/* Improved Association search */}
                            <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'rgba(13, 71, 161, 0.05)', borderRadius: '8px', mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ color: '#000', fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>
                                    <Info sx={{ fontSize: '0.9rem', mr: 1, color: '#0d47a1' }} />
                                    Recherchez votre association par nom ou emplacement
                                </Typography>
                            </Paper>

                            {/* Association field with enhanced Autocomplete - Increased size */}
                            <Box className="input-group" sx={{ mb: 2 }}>
                                <Controller
                                    name="association"
                                    control={control}
                                    render={({ field: { onChange, value } }) => (
                                        <Autocomplete
                                            id="association-autocomplete"
                                            options={associations}
                                            getOptionLabel={(option) => option.name || ''}
                                            isOptionEqualToValue={(option, value) => option.id === value?.id}
                                            value={value ? associations.find(assoc => assoc.id === value) || null : null}
                                            onChange={(_, newValue) => onChange(newValue ? newValue.id : null)}
                                            filterOptions={(options, state) => {
                                                const inputValue = state.inputValue.toLowerCase().trim();
                                                return options.filter(option =>
                                                    option.name.toLowerCase().includes(inputValue) ||
                                                    (option.location && option.location.toLowerCase().includes(inputValue))
                                                );
                                            }}
                                            ListboxProps={{
                                                style: {
                                                    maxHeight: '220px' // Increased height
                                                }
                                            }}
                                            renderOption={(props, option) => (
                                                <Box component="li" {...props} sx={{ borderBottom: '1px solid #f0f0f0' }}>
                                                    <Box>
                                                        <Typography fontWeight="500" fontSize="0.9rem">{option.name}</Typography>
                                                        {option.location && (
                                                            <Typography variant="caption" color="text.secondary" fontSize="0.75rem">
                                                                {option.location}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            )}
                                            renderInput={(params) => (
                                                <FormField
                                                    {...params}
                                                    label="Association"
                                                    placeholder="Tapez pour rechercher votre association"
                                                    error={!!errors.association}
                                                    helperText={errors.association?.message}
                                                    fullWidth
                                                    InputLabelProps={{
                                                        ...params.InputLabelProps,
                                                        style: { fontSize: '0.9rem' }
                                                    }}
                                                    InputProps={{
                                                        ...params.InputProps,
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <AlternateEmail style={{ color: '#0d47a1', fontSize: '1.1rem' }} />
                                                                {params.InputProps.startAdornment}
                                                            </InputAdornment>
                                                        ),
                                                        style: {
                                                            fontSize: '0.9rem',
                                                            padding: '10px 8px 10px 0'
                                                        }
                                                    }}
                                                    sx={{
                                                        '& .MuiInputLabel-root': { fontSize: '0.9rem' },
                                                        '& .MuiOutlinedInput-root': {
                                                            '& fieldset': {
                                                                borderColor: errors.association ? '#d32f2f' : '#3f51b5',
                                                                borderWidth: '1.5px'
                                                            },
                                                            '&:hover fieldset': {
                                                                borderColor: '#1a237e'
                                                            },
                                                            '&.Mui-focused fieldset': {
                                                                borderColor: '#0d47a1'
                                                            }
                                                        }
                                                    }}
                                                />
                                            )}
                                        />
                                    )}
                                />
                            </Box>

                            {/* Notice about adding new association */}
                            <Box
                                sx={{
                                    mt: 2,
                                    p: 1.5,
                                    borderRadius: '8px',
                                    border: '1px dashed #0d47a1',
                                    bgcolor: 'rgba(13, 71, 161, 0.05)',
                                    width: '100%'
                                }}
                            >
                                <Typography variant="body2" style={{ color: '#000', marginBottom: '8px', fontSize: '0.8rem' }}>
                                    <b>Vous ne trouvez pas votre association?</b> Vous pouvez l'ajouter en quelques étapes simples.
                                </Typography>

                                <Link to="/associationregister" className="association-link" style={{ marginTop: '8px', fontSize: '0.8rem' }}>
                                    <AlternateEmail style={{ marginRight: '8px', fontSize: '0.9rem' }} />
                                    Enregistrer votre association
                                </Link>
                            </Box>
                        </motion.div>
                    )}

                    {/* Navigation buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                        {activeStep === 0 ? (
                            <Box style={{ width: '100px' }}></Box> // Empty space for alignment
                        ) : (
                            <button
                                type="button"
                                onClick={moveToPreviousStep}
                                className="back-btn"
                                style={{
                                    padding: '8px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: 'transparent',
                                    color: '#0d47a1',
                                    border: '1px solid #0d47a1',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    height: '40px',
                                    fontWeight: 600,
                                    fontSize: '0.8rem'
                                }}
                            >
                                <ArrowBack style={{ marginRight: '4px', fontSize: '1rem' }} />
                                Retour
                            </button>
                        )}

                        {activeStep < 2 ? (
                            <button
                                type="button"
                                onClick={moveToNextStep}
                                className="login-btn"
                                style={{
                                    padding: '8px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: '#0d47a1',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    height: '40px',
                                    fontWeight: 600,
                                    fontSize: '0.8rem'
                                }}
                            >
                                Suivant
                                <ArrowForward style={{ marginLeft: '4px', fontSize: '1rem' }} />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                className="login-btn"
                                disabled={loading}
                                style={{
                                    padding: '8px 16px',
                                    background: '#0d47a1',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.7 : 1,
                                    height: '40px',
                                    fontWeight: 600,
                                    fontSize: '0.8rem'
                                }}
                            >
                                {loading ? (
                                    <>
                                        <CircularProgress size={16} color="inherit" style={{ marginRight: '8px' }} />
                                        En cours...
                                    </>
                                ) : "S'inscrire"}
                            </button>
                        )}
                    </Box>

                    {/* Validation notice */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 1.7 }}
                    >
                        <Box
                            sx={{
                                mt: 2,
                                p: 2,
                                borderRadius: '8px',
                                bgcolor: 'rgba(25, 118, 210, 0.08)',
                                border: '1px solid rgba(25, 118, 210, 0.2)'
                            }}
                        >
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', color: 'info.main', fontSize: '0.8rem' }}>
                                <Info sx={{ mr: 1, fontSize: '1rem' }} />
                                Après inscription, votre compte devra être validé par un administrateur avant de pouvoir vous connecter.
                            </Typography>
                        </Box>
                    </motion.div>

                    <Divider sx={{ my: 2 }} />

                    <Typography className="signup-prompt" sx={{ textAlign: 'center', fontSize: '0.8rem' }} style={{ color: '#000' }}>
                        Vous avez déjà un compte? <Link to="/" className="signup-link">Se connecter</Link>
                    </Typography>
                </motion.form>
            </div>

            {/* Floating animation elements - Smaller and less distracting */}
            <motion.div
                style={{
                    position: 'absolute',
                    bottom: 20,
                    right: 20,
                    width: 40, // Reduced size
                    height: 40, // Reduced size
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(13, 71, 161, 0.7), rgba(33, 150, 243, 0.7))',
                    zIndex: 1,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
                animate={{
                    y: [0, -10, 0], // Smaller movement
                    rotate: [0, 5, -5, 0] // Less rotation
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Add smaller floating elements */}
            <motion.div
                style={{
                    position: 'absolute',
                    top: '25%',
                    left: '15%',
                    width: 15, // Reduced size
                    height: 15, // Reduced size
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.3)',
                    zIndex: 1
                }}
                animate={{
                    y: [0, -20, 0], // Smaller movement
                    x: [0, 10, 0], // Smaller movement
                    opacity: [0.3, 0.7, 0.3]
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            <motion.div
                style={{
                    position: 'absolute',
                    bottom: '30%',
                    left: '60%',
                    width: 20, // Reduced size
                    height: 20, // Reduced size
                    borderRadius: '50%',
                    background: 'rgba(13, 71, 161, 0.3)',
                    zIndex: 1
                }}
                animate={{
                    y: [0, 25, 0], // Smaller movement
                    x: [0, -15, 0], // Smaller movement
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{
                    duration: 7,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
        </div>
    );
};

export default Register;