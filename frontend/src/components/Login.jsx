import { React, useState, useEffect } from 'react';
import { Box, Typography, IconButton, InputAdornment, CircularProgress, Checkbox, FormControlLabel, Alert, Snackbar } from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, AlternateEmail, Dashboard, Assignment, Assessment, AutoAwesome } from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import Axios from './Axios.jsx';
import FormField from './forms/FormField';
import MyButton from './forms/MyButton';
import backgroundImage from '../assets/blue-stationery-table.jpg';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import '../assets/Login.css';
import logo from '../assets/logotili.jpeg';
// Form validation schema
const loginSchema = yup.object().shape({
    email: yup
        .string()
        .email('Format email invalide')
        .required('Email est requis'),
    password: yup
        .string()
        .required('Mot de passe est requis')
});

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { handleSubmit, control, setError, formState: { errors } } = useForm({
        resolver: yupResolver(loginSchema),
        defaultValues: {
            email: '',
            password: ''
        }
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState("");
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
    const [featureIndex, setFeatureIndex] = useState(0);

    // Platform features
    const platformFeatures = [
        {
            icon: <Dashboard className="feature-icon" />,
            title: "Tableau de bord personnalisé",
            description: "Accédez rapidement à vos projets, tâches et documents dans une interface intuitive."
        },
        {
            icon: <Assignment className="feature-icon" />,
            title: "Gestion des projets",
            description: "Création, suivi et validation des projets avec attribution des responsabilités."
        },
        {
            icon: <Assessment className="feature-icon" />,
            title: "Rapports financiers",
            description: "Générez automatiquement des rapports financiers conformes à la législation tunisienne."
        },
        {
            icon: <AutoAwesome className="feature-icon" />,
            title: "Assistant administratif",
            description: "Chatbot intelligent pour vous guider dans vos tâches administratives quotidiennes."
        }
    ];

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const message = params.get('message');

        if (message) {
            setNotification({
                open: true,
                message: decodeURIComponent(message),
                severity: params.get('status') === 'error' ? 'error' : 'success'
            });
        }

        const savedEmail = localStorage.getItem('rememberedEmail');
        if (savedEmail) {
            setRememberMe(true);
        }

        const featureInterval = setInterval(() => {
            setFeatureIndex(prev => (prev + 1) % platformFeatures.length);
        }, 6000);

        return () => clearInterval(featureInterval);
    }, [location]);

    const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

    const handleCloseNotification = (event, reason) => {
        if (reason === 'clickaway') return;
        setNotification({ ...notification, open: false });
    };

    const handleRememberMeChange = (event) => {
        setRememberMe(event.target.checked);
    };

    const handleLogin = async (data) => {
        setLoading(true);
        setLoginError("");

        try {
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', data.email.trim().toLowerCase());
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            const response = await Axios.post('/users/login/', {
                email: data.email.trim().toLowerCase(),
                password: data.password,
            });

            localStorage.setItem('Token', response.data.token);

            if (response.data.user) {
                localStorage.setItem('UserInfo', JSON.stringify(response.data.user));
            }

            localStorage.setItem('loginTimestamp', Date.now());

            setNotification({
                open: true,
                message: 'Connexion réussie! Redirection vers le tableau de bord...',
                severity: 'success'
            });

            setTimeout(() => {
                navigate('/home');
            }, 1000);

        } catch (error) {
            setLoading(false);
            console.error("Login Error:", error);

            if (error.response && error.response.status === 403) {
                let messageToCheck = "";
                const responseData = error.response.data;

                if (typeof responseData === 'string') {
                    messageToCheck = responseData;
                    if (responseData.includes("'error':")) {
                        try {
                            const fixedJson = responseData.replace(/'/g, '"');
                            const parsedData = JSON.parse(fixedJson);
                            if (parsedData.error) {
                                messageToCheck = parsedData.error;
                            }
                        } catch (e) {
                            // Keep original
                        }
                    }
                } else if (responseData && typeof responseData === 'object') {
                    messageToCheck = responseData.error || responseData.message || responseData.detail || JSON.stringify(responseData);
                }

                const validationKeywords = ['pending', 'validation', 'approval', 'wait for', 'administrator', 'verify'];
                const containsValidationKeyword = validationKeywords.some(keyword =>
                    messageToCheck.toLowerCase().includes(keyword.toLowerCase())
                );

                const isExactValidationMessage = messageToCheck.includes("Your account is pending validation");

                if (containsValidationKeyword || isExactValidationMessage) {
                    setLoginError("🌟 Votre compte est en cours de validation! 🌟\n\nUn administrateur examinera votre inscription très bientôt. Vous recevrez une notification dès que votre compte sera approuvé.");
                    setNotification({
                        open: true,
                        message: "Patience est une vertu! Votre compte est en attente d'approbation.",
                        severity: 'info'
                    });
                    return;
                }
            }

            if (error.response) {
                const responseData = error.response.data;
                let errorMessage = "";

                if (typeof responseData === 'string') {
                    errorMessage = responseData;
                } else if (responseData && typeof responseData === 'object') {
                    errorMessage = responseData.error || responseData.message || responseData.detail || "";
                }

                switch (error.response.status) {
                    case 401:
                        setError("email", { type: "manual", message: "Email ou mot de passe incorrect" });
                        setError("password", { type: "manual", message: "Email ou mot de passe incorrect" });
                        setLoginError("Les identifiants saisis ne correspondent pas à nos enregistrements.");
                        break;
                    case 403:
                        setLoginError(errorMessage || "Accès refusé. Veuillez contacter l'administrateur.");
                        break;
                    case 429:
                        setLoginError("Compte temporairement verrouillé en raison de trop nombreuses tentatives échouées.");
                        break;
                    default:
                        setLoginError(errorMessage || "Échec de l'authentification. Veuillez réessayer.");
                }
            } else if (error.request) {
                setLoginError("Erreur réseau. Veuillez vérifier votre connexion.");
            } else {
                setLoginError("Échec de l'authentification. Veuillez réessayer.");
            }
        }
    };

    const PendingUserMessage = () => {
        const hasStarEmoji = loginError && loginError.includes('🌟');
        const hasValidationKeywords = loginError && (
            loginError.toLowerCase().includes('validation') ||
            loginError.toLowerCase().includes('pending') ||
            loginError.toLowerCase().includes('approval') ||
            loginError.toLowerCase().includes('attente') ||
            loginError.toLowerCase().includes('administrator')
        );

        if (!hasStarEmoji && !hasValidationKeywords) {
            return null;
        }

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="pending-user-message"
            >
                <motion.div
                    animate={{
                        y: [0, -5, 0],
                        rotate: [0, 3, 0, -3, 0]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "loop"
                    }}
                    className="pending-title-container"
                >
                    <Typography variant="h5" className="pending-title">
                        🌟 Votre compte est presque prêt! 🌟
                    </Typography>
                </motion.div>

                <Typography className="pending-text">
                    Un administrateur examine actuellement votre inscription.
                </Typography>

                <div className="hourglass-container">
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.7, 1, 0.7]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        <HourglassEmptyIcon className="hourglass-icon" />
                    </motion.div>
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.7, 1, 0.7]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                    >
                        <HourglassEmptyIcon className="hourglass-icon" />
                    </motion.div>
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.7, 1, 0.7]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
                    >
                        <HourglassEmptyIcon className="hourglass-icon" />
                    </motion.div>
                </div>

                <Typography className="pending-subtext">
                    Nous vous enverrons un email dès que vous pourrez accéder à la plateforme.
                </Typography>
            </motion.div>
        );
    };

    const currentFeature = platformFeatures[featureIndex];

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
                    className="notification-alert"
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
                        <Typography variant="h3" className="welcome-title">Bienvenue sur TILI HUB</Typography>
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
                            Votre solution pour la gestion des associations en Tunisie
                        </Typography>
                    </motion.div>

                    {/* Feature Showcase */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.9 }}
                        className="feature-showcase-container"
                    >
                        <div className="feature-showcase">
                            <motion.div
                                key={featureIndex}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5 }}
                                className="feature-content"
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
                                <Typography variant="h5" className="feature-title">
                                    {currentFeature.title}
                                </Typography>
                                <Typography className="feature-description">
                                    {currentFeature.description}
                                </Typography>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Feature Dots */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 1.2 }}
                        className="feature-dots-container"
                    >
                        <div className="feature-dots">
                            {platformFeatures.map((_, idx) => (
                                <motion.div
                                    key={idx}
                                    className={`feature-dot ${idx === featureIndex ? 'active' : ''}`}
                                    whileHover={{ scale: 1.2 }}
                                    onClick={() => setFeatureIndex(idx)}
                                />
                            ))}
                        </div>
                    </motion.div>

                    {/* Compliance Notice */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 1.5 }}
                        className="compliance-notice-container"
                    >
                        <div className="compliance-notice">
                            <Typography className="compliance-text">
                                Plateforme conforme à la législation tunisienne pour la gestion des associations
                            </Typography>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="right-panel">
                <motion.form
                    onSubmit={handleSubmit(handleLogin)}
                    className="login-card"
                    data-testid="login-form"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.3, type: "spring", stiffness: 100 }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                    >
                        <Typography variant="h4" className="login-title">Connexion</Typography>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.7 }}
                    >
                        <Typography className="login-subtitle">Accédez à votre tableau de bord personnalisé</Typography>
                    </motion.div>

                    {loginError && (
                        (loginError.includes('🌟') ||
                            loginError.toLowerCase().includes('validation') ||
                            loginError.toLowerCase().includes('pending') ||
                            loginError.toLowerCase().includes('approval') ||
                            loginError.toLowerCase().includes('administrator')) ? (
                            <PendingUserMessage />
                        ) : (
                            <motion.div
                                className="error-message"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <span className="error-icon">!</span>
                                <span>{loginError}</span>
                            </motion.div>
                        )
                    )}

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.9 }}
                    >
                        <div className="input-group">
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
                                            <Email className="input-icon" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 1.1 }}
                    >
                        <div className="input-group">
                            <FormField
                                label="Mot de passe"
                                name="password"
                                control={control}
                                fullWidth
                                placeholder="Entrez votre mot de passe"
                                type={showPassword ? "text" : "password"}
                                error={!!errors.password}
                                helperText={errors.password?.message}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock className="input-icon" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={togglePasswordVisibility}
                                                className="visibility-toggle"
                                                edge="end"
                                                aria-label="toggle password visibility"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        className="remember-forgot"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 1.3 }}
                    >
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={rememberMe}
                                    onChange={handleRememberMeChange}
                                    color="primary"
                                    size="small"
                                />
                            }
                            label={<span className="remember-text">Se souvenir de moi</span>}
                        />
                        <Link to="/request/password_reset" className="forgot-link">Mot de passe oublié?</Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 1.5 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <MyButton
                            label={loading ? <CircularProgress size={24} color="inherit" /> : "Connexion"}
                            type="submit"
                            className="login-btn"
                            disabled={loading}
                            fullWidth
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 1.7 }}
                    >
                        <Typography className="signup-prompt">
                            Pas encore de compte? <Link to="/register" className="signup-link">S'inscrire</Link>
                        </Typography>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 1.9 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <div className="association-link-container">
                            <Link to="/associationregister" className="association-link">
                                <AlternateEmail className="link-icon" />
                                Enregistrer votre association
                            </Link>
                        </div>
                    </motion.div>
                </motion.form>
            </div>

            {/* Floating decorative elements */}
            <motion.div
                className="floating-circle large"
                animate={{
                    y: [0, -15, 0],
                    rotate: [0, 10, -10, 0]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            <motion.div
                className="floating-circle small-1"
                animate={{
                    y: [0, -30, 0],
                    x: [0, 15, 0],
                    opacity: [0.3, 0.7, 0.3]
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            <motion.div
                className="floating-circle small-2"
                animate={{
                    y: [0, 40, 0],
                    x: [0, -20, 0],
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

export default Login;