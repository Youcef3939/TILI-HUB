import { React, useState } from 'react';
import { Box, Typography, InputAdornment, CircularProgress, Alert, Snackbar } from '@mui/material';
import { Email, LockReset } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import Axios from './Axios.jsx';
import FormField from './forms/FormField';
import MyButton from './forms/MyButton';
import backgroundImage from '../assets/blue-stationery-table.jpg';
import logo from "../assets/logotili.jpeg";


// Form validation schema
const schema = yup.object({
    email: yup
        .string()
        .email('Format email invalide')
        .required('Email est requis')
});

const PasswordResetRequest = () => {
    const { handleSubmit, control, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            email: ''
        }
    });

    const [loading, setLoading] = useState(false);
    const [requestError, setRequestError] = useState("");
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    const handleCloseNotification = (event, reason) => {
        if (reason === 'clickaway') return;
        setNotification({ ...notification, open: false });
    };

    const submission = async (data) => {
        setRequestError("");
        setLoading(true);

        try {
            await Axios.post('auth/password_reset/', { email: data.email });
            setNotification({
                open: true,
                message: 'Si cette adresse email existe dans notre base de données, vous recevrez un lien de réinitialisation.',
                severity: 'success'
            });
        } catch (error) {
            setRequestError("Une erreur s'est produite lors de l'envoi. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
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

            {/* Left Panel */}
            <div className="left-panel">
                <div className="welcome-content">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Typography variant="h3" className="welcome-title">Récupération de compte</Typography>
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
                            Nous vous aiderons à réinitialiser votre mot de passe et à récupérer l'accès à votre compte.
                        </Typography>
                    </motion.div>

                    {/* Security Info Box */}
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
                                minHeight: '220px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center'
                            }}
                        >
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                            >
                                <LockReset sx={{ fontSize: 48, color: '#fff', mb: 2 }} />
                            </motion.div>
                            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
                                Sécurité de votre compte
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#fff' }}>
                                Un lien de réinitialisation sera envoyé à votre adresse email.
                                Ce lien est valable pendant 24 heures et ne peut être utilisé qu'une seule fois.
                            </Typography>
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
                                mt: 4,
                                p: 2,
                                borderRadius: '8px',
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(5px)'
                            }}
                        >
                            <Typography variant="body2" sx={{ color: '#fff', fontStyle: 'italic', textAlign: 'center' }}>
                                Plateforme conforme à la législation tunisienne pour la gestion des associations
                            </Typography>
                        </Box>
                    </motion.div>
                </div>
            </div>

            {/* Right Panel */}
            <div className="right-panel">
                <motion.form
                    onSubmit={handleSubmit(submission)}
                    className="login-card"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.3, type: "spring", stiffness: 100 }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                    >
                        <Typography variant="h4" className="login-title">Mot de passe oublié? 🔑</Typography>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.7 }}
                    >
                        <Typography className="login-subtitle">
                            Entrez votre email pour recevoir les instructions de réinitialisation
                        </Typography>
                    </motion.div>

                    {requestError && (
                        <motion.div
                            className="error-message"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <span className="error-icon">!</span>
                            <span>{requestError}</span>
                        </motion.div>
                    )}

                    {/* Email Field */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.9 }}
                    >
                        <Box className="input-group">
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
                                }}
                            />
                        </Box>
                    </motion.div>

                    {/* Submit Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 1.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <MyButton
                            label={loading ? <CircularProgress size={24} color="inherit" /> : "Envoyer le lien"}
                            type="submit"
                            className="login-btn"
                            disabled={loading}
                            fullWidth
                        />
                    </motion.div>

                    {/* Back to Login Link */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 1.3 }}
                    >
                        <Typography className="signup-prompt">
                            <Link to="/" className="signup-link">Retour à la connexion</Link>
                        </Typography>
                    </motion.div>
                </motion.form>
            </div>

            {/* Floating Animation Element */}
            <motion.div
                style={{
                    position: 'absolute',
                    bottom: 20,
                    right: 20,
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(13, 71, 161, 0.7), rgba(33, 150, 243, 0.7))',
                    zIndex: 1,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
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

            {/* Add smaller floating elements */}
            <motion.div
                style={{
                    position: 'absolute',
                    top: '25%',
                    left: '15%',
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.3)',
                    zIndex: 1
                }}
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
        </div>
    );
};

export default PasswordResetRequest;