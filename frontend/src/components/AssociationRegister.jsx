import {useState, useEffect, useRef, React} from 'react';
import {
    Box,
    Typography,
    InputAdornment,
    CircularProgress,
    Alert,
    Snackbar,
    Paper,
    Divider,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Tooltip,
    Fade,
    Chip,
    Badge,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Accordion,
    AccordionSummary,
    AccordionDetails, IconButton
} from '@mui/material';
import {
    Email,
    Business,
    UploadFile,
    CheckCircle,
    Error,
    PendingActions,
    ArticleOutlined,
    CloudUpload,
    VerifiedUser,
    FactCheck,
    AutoAwesome,
    FindInPage,
    GradingOutlined,
    InfoOutlined,
    Help,
    ExpandMore,
    WarningAmber,
    DeleteOutline,
    RestartAlt,
    HelpOutline,
    Person
} from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import AxiosInstance from './Axios';
import FormField from './forms/FormField';
import MyButton from './forms/MyButton';
import { Link } from 'react-router-dom';
import backgroundImage from '../assets/blue-stationery-table.jpg';

import '../assets/Login.css';
import logo from "../assets/logotili.jpeg";
// Advanced file validation
const SUPPORTED_FORMATS = ['application/pdf'];
const FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Form validation schema with enhanced file validation
const schema = yup.object({
    name: yup.string().required('Le nom de l\'association est obligatoire')
        .min(3, 'Le nom doit contenir au moins 3 caractères')
        .max(100, 'Le nom ne peut pas dépasser 100 caractères'),

    email: yup.string()
        .email('Format d\'email invalide')
        .required('L\'email est obligatoire'),

    president_email: yup.string()
        .email('Format d\'email invalide')
        .required('L\'email du président est obligatoire'),

    president_name: yup.string()
        .required('Le nom du président est obligatoire')
        .min(3, 'Le nom doit contenir au moins 3 caractères'),

    treasurer_email: yup.string()
        .email('Format d\'email invalide')
        .required('L\'email du trésorier est obligatoire'),

    treasurer_name: yup.string()
        .required('Le nom du trésorier est obligatoire')
        .min(3, 'Le nom doit contenir au moins 3 caractères'),

    secretary_email: yup.string()
        .email('Format d\'email invalide')
        .required('L\'email du secrétaire général est obligatoire'),

    secretary_name: yup.string()
        .required('Le nom du secrétaire général est obligatoire')
        .min(3, 'Le nom doit contenir au moins 3 caractères'),

    matricule_fiscal: yup.string()
        .required('Le matricule fiscal est obligatoire')
        .matches(
            /^[0-9]{7}[A-Za-z]$/,
            'Format invalide. Le matricule fiscal doit contenir 7 chiffres suivis d\'une lettre'
        ),

    cin_recto: yup.mixed()
        .required('Le recto de la CIN est obligatoire')
        .test('fileSize', 'Le fichier est trop volumineux (10MB max)',
            value => !value || value.size <= FILE_SIZE)
        .test('fileType', 'Format non supporté. Utilisez PDF uniquement',
            value => !value || SUPPORTED_FORMATS.includes(value.type)),

    cin_verso: yup.mixed()
        .required('Le verso de la CIN est obligatoire')
        .test('fileSize', 'Le fichier est trop volumineux (10MB max)',
            value => !value || value.size <= FILE_SIZE)
        .test('fileType', 'Format non supporté. Utilisez PDF uniquement',
            value => !value || SUPPORTED_FORMATS.includes(value.type)),

    rne_document: yup.mixed()
        .required('Le document RNE est obligatoire')
        .test('fileSize', 'Le fichier est trop volumineux (10MB max)',
            value => !value || value.size <= FILE_SIZE)
        .test('fileType', 'Format non supporté. Utilisez PDF uniquement',
            value => !value || SUPPORTED_FORMATS.includes(value.type))
});

const RegisterAssociation = () => {
    // Form state management
    const [registerError, setRegisterError] = useState("");
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
    const [registeredAssociation, setRegisteredAssociation] = useState(null);
    const [verificationStatus, setVerificationStatus] = useState(null);
    const [showVerificationStatus, setShowVerificationStatus] = useState(false);
    const [verificationProgress, setVerificationProgress] = useState(0);
    const [activeStep, setActiveStep] = useState(0);
    const [uploadedFiles, setUploadedFiles] = useState({
        cin_recto: null,
        cin_verso: null,
        rne_document: null
    });

    // Additional UX enhancements
    const [networkError, setNetworkError] = useState(false);
    const [helpDialogOpen, setHelpDialogOpen] = useState(false);
    const [helpTopic, setHelpTopic] = useState('');
    const [documentErrorDialog, setDocumentErrorDialog] = useState(false);
    const [retryAttempt, setRetryAttempt] = useState(0);
    const [verificationTimeoutMessage, setVerificationTimeoutMessage] = useState(false);

    // Refs for timeout management
    const verificationTimeoutRef = useRef(null);
    const verificationAttemptRef = useRef(0);

    const { handleSubmit, control, formState: { errors }, watch, reset, clearErrors, setValue, setError } = useForm({
        resolver: yupResolver(schema),
        mode: 'onChange'
    });

    // Watch for file uploads to update UI
    const cinRecto = watch("cin_recto");
    const cinVerso = watch("cin_verso");
    const rneDocument = watch("rne_document");
    const matriculeFiscal = watch("matricule_fiscal");

    // Update uploaded files state when form values change
    useEffect(() => {
        setUploadedFiles({
            cin_recto: cinRecto,
            cin_verso: cinVerso,
            rne_document: rneDocument
        });
    }, [cinRecto, cinVerso, rneDocument]);

    // Reset error when matricule format changes
    useEffect(() => {
        if (matriculeFiscal && /^[0-9]{7}[A-Za-z]$/.test(matriculeFiscal)) {
            clearErrors("matricule_fiscal");
        }
    }, [matriculeFiscal, clearErrors]);

    const handleCloseNotification = (event, reason) => {
        if (reason === 'clickaway') return;
        setNotification({ ...notification, open: false });
    };

// Update this function in AssociationRegister.jsx
    const checkVerificationStatus = async (associationId) => {
        try {
            console.log(`Checking verification status for association ${associationId}`);
            // Updated URL to match the correct endpoint
            const response = await AxiosInstance.get(`/users/association-verification/${associationId}/`);
            console.log('Verification status response:', response.data);

            // Update state with the new status
            setVerificationStatus(response.data);

            // Log the status received to help with debugging
            if (response.data?.verification_status) {
                console.log(`Current verification status: ${response.data.verification_status}`);
            }

            return response.data;
        } catch (error) {
            console.error("Error checking verification status:", error);

            // Provide more detailed error logging
            if (error.response) {
                console.error("Response status:", error.response.status);
                console.error("Response data:", error.response.data);
            } else if (error.request) {
                console.error("No response received:", error.request);
            } else {
                console.error("Error message:", error.message);
            }

            if (verificationAttemptRef.current > 3) {
                setVerificationTimeoutMessage(true);
            }
            return null;
        }
    };

// Improved effect to check verification status periodically
    useEffect(() => {
        let statusCheckInterval;
        let progressInterval;

        if (registeredAssociation && showVerificationStatus) {
            // Clear any existing timeout
            if (verificationTimeoutRef.current) {
                clearTimeout(verificationTimeoutRef.current);
            }

            // Set timeout for verification (2 minutes)
            verificationTimeoutRef.current = setTimeout(() => {
                if (verificationStatus?.verification_status === 'pending') {
                    setVerificationTimeoutMessage(true);
                }
            }, 120000); // 2 minutes timeout

            // If verification status is already failed or verified, set progress accordingly
            if (verificationStatus?.verification_status === 'failed' ||
                verificationStatus?.verification_status === 'verified') {
                setVerificationProgress(100);
                return; // Don't set up intervals for checking
            }

            // Only for pending or undefined status: simulate verification progress
            progressInterval = setInterval(() => {
                setVerificationProgress(prev => {
                    if (prev < 95) return prev + 5; // Only go up to 95% for pending
                    clearInterval(progressInterval);
                    return 95; // Pending stays at 95% until complete
                });
            }, 700);

            // Check initially regardless of status to ensure we have the latest status
            const initialCheck = async () => {
                try {
                    console.log("Initial verification status check");
                    const result = await checkVerificationStatus(registeredAssociation.id);

                    // If verification is complete after initial check, update UI
                    if (result && result.verification_status !== 'pending') {
                        clearInterval(statusCheckInterval);
                        clearInterval(progressInterval);
                        clearTimeout(verificationTimeoutRef.current);
                        setVerificationProgress(100);

                        // Update notification based on verification result
                        setNotification({
                            open: true,
                            message: result.verification_status === 'verified' ?
                                'Vérification réussie!' :
                                'La vérification a échoué. Veuillez consulter les détails.',
                            severity: result.verification_status === 'verified' ? 'success' : 'error'
                        });
                    }
                } catch (error) {
                    console.error("Error in initial status check:", error);
                }
            };

            // Call the initial check
            initialCheck();

            // Only check periodically if status is pending or undefined
            if (!verificationStatus || verificationStatus.verification_status === 'pending') {
                console.log("Setting up periodic status checking");
                // Set up interval for checking pending status
                statusCheckInterval = setInterval(async () => {
                    try {
                        verificationAttemptRef.current += 1;
                        console.log(`Verification attempt ${verificationAttemptRef.current}`);

                        const result = await checkVerificationStatus(registeredAssociation.id);

                        // If verification is complete, stop checking
                        if (result && result.verification_status !== 'pending') {
                            console.log(`Verification completed with status: ${result.verification_status}`);
                            clearInterval(statusCheckInterval);
                            clearInterval(progressInterval);
                            clearTimeout(verificationTimeoutRef.current);
                            setVerificationProgress(100);

                            // Update notification based on verification result
                            setNotification({
                                open: true,
                                message: result.verification_status === 'verified' ?
                                    'Vérification réussie!' :
                                    'La vérification a échoué. Veuillez consulter les détails.',
                                severity: result.verification_status === 'verified' ? 'success' : 'error'
                            });
                        }
                    } catch (error) {
                        console.error("Error in status check interval:", error);
                        if (verificationAttemptRef.current > 5) {
                            console.log("Max verification attempts reached, stopping checks");
                            clearInterval(statusCheckInterval);
                            setVerificationTimeoutMessage(true);
                        }
                    }
                }, 5000); // Check every 5 seconds
            }

            // Cleanup function
            return () => {
                console.log("Cleaning up verification status checking");
                if (statusCheckInterval) clearInterval(statusCheckInterval);
                if (progressInterval) clearInterval(progressInterval);
                if (verificationTimeoutRef.current) clearTimeout(verificationTimeoutRef.current);
            };
        }
    }, [registeredAssociation, showVerificationStatus, verificationStatus]);
    // Handle common errors before submission
    const validateDocumentsBeforeSubmit = () => {
        let hasError = false;

        // Check PDF quality
        if (cinRecto && cinRecto.size < 50000) {
            setError("cin_recto", {
                type: "manual",
                message: "Le fichier semble être de trop faible qualité. Utilisez un document plus clair."
            });
            hasError = true;
        }

        if (cinVerso && cinVerso.size < 50000) {
            setError("cin_verso", {
                type: "manual",
                message: "Le fichier semble être de trop faible qualité. Utilisez un document plus clair."
            });
            hasError = true;
        }

        if (rneDocument && rneDocument.size < 100000) {
            setError("rne_document", {
                type: "manual",
                message: "Le document RNE semble être de trop faible qualité. Il pourrait être difficile à lire par notre système."
            });
            hasError = true;
        }

        if (hasError) {
            setDocumentErrorDialog(true);
        }

        return !hasError;
    };

    const handleRegister = async (data) => {
        // Pre-submission validation
        if (!validateDocumentsBeforeSubmit()) {
            return;
        }

        setLoading(true);
        setRegisterError("");
        setNetworkError(false);
        setActiveStep(4); // Move to the submission step

        const formDataObj = new FormData();

        // Add each field individually to FormData
        formDataObj.append('name', data.name);
        formDataObj.append('email', data.email);

        // Add president data
        formDataObj.append('president_email', data.president_email);
        formDataObj.append('president_name', data.president_name);

        // Add treasurer data
        formDataObj.append('treasurer_email', data.treasurer_email);
        formDataObj.append('treasurer_name', data.treasurer_name);

        // Add secretary data
        formDataObj.append('secretary_email', data.secretary_email);
        formDataObj.append('secretary_name', data.secretary_name);

        formDataObj.append('matricule_fiscal', data.matricule_fiscal);

        // Handle file fields separately
        if (data.cin_recto) formDataObj.append('cin_recto', data.cin_recto);
        if (data.cin_verso) formDataObj.append('cin_verso', data.cin_verso);
        if (data.rne_document) formDataObj.append('rne_document', data.rne_document);

        try {
            const response = await AxiosInstance.post('/users/register-association/', formDataObj, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 60000 // 60 sec timeout for large files
            })

            // Store the registered association data from response
            // The response already includes verification status from the backend
            const associationData = response.data;
            setRegisteredAssociation(associationData);

            // Set verification status directly from response
            setVerificationStatus({
                verification_status: associationData.verification_status,
                verification_notes: associationData.verification_notes,
                verification_date: associationData.verification_date
            });

            // Show verification status panel
            setShowVerificationStatus(true);

            // Reset verification attempt counter
            verificationAttemptRef.current = 0;

            // Set appropriate notification based on verification status
            if (associationData.verification_status === 'failed') {
                setNotification({
                    open: true,
                    message: 'Enregistrement soumis, mais la vérification a échoué. Vérifiez les détails d\'erreur.',
                    severity: 'error'
                });
                // Set progress to 100% for failed verification
                setVerificationProgress(100);
            } else if (associationData.verification_status === 'verified') {
                setNotification({
                    open: true,
                    message: 'Association enregistrée et vérifiée avec succès!',
                    severity: 'success'
                });
                // Set progress to 100% for successful verification
                setVerificationProgress(100);
            } else {
                // Handle pending verification
                setNotification({
                    open: true,
                    message: 'Association enregistrée. Vérification en attente...',
                    severity: 'info'
                });
                // Keep progress animation for pending verification
            }

            setLoading(false);
        } catch (error) {
            setLoading(false);
            console.error("Registration error:", error);

            // Network error handling
            if (error.code === 'ECONNABORTED' || !error.response) {
                setNetworkError(true);
                setRegisterError("Erreur de connexion ou délai d'attente dépassé. Vérifiez votre connexion internet et réessayez.");
                setActiveStep(3); // Go back to files step
                return;
            }

            // More detailed error message
            let errorMessage = "Échec de l'enregistrement. Veuillez réessayer.";

            // Handle specific error cases
            if (error.response?.status === 400) {
                if (error.response.data?.name) {
                    errorMessage = `Erreur: ${error.response.data.name[0]}`;
                } else if (error.response.data?.email) {
                    errorMessage = `Erreur: ${error.response.data.email[0]}`;
                } else if (error.response.data?.matricule_fiscal) {
                    errorMessage = `Erreur: ${error.response.data.matricule_fiscal[0]}`;
                } else if (error.response.data?.detail) {
                    errorMessage = error.response.data.detail;
                } else if (error.response.data?.error) {
                    errorMessage = error.response.data.error;
                }
            } else if (error.response?.status === 413) {
                errorMessage = "Fichiers trop volumineux. Veuillez réduire la taille des fichiers et réessayer.";
            } else if (error.response?.status >= 500) {
                errorMessage = "Erreur serveur. Notre équipe technique a été notifiée, veuillez réessayer plus tard.";
            }

            setRegisterError(`❌ ${errorMessage}`);
            setActiveStep(3); // Go back to files step on error
            setRetryAttempt(prev => prev + 1);
        }
    };

    // Manual file validation before upload
    const validateFile = (file, fieldName) => {
        if (!file) return true;

        // Check file type
        if (!SUPPORTED_FORMATS.includes(file.type)) {
            setError(fieldName, {
                type: "manual",
                message: "Format non supporté. Utilisez PDF uniquement."
            });
            return false;
        }

        // Check file size
        if (file.size > FILE_SIZE) {
            setError(fieldName, {
                type: "manual",
                message: "Fichier trop volumineux (10MB max)."
            });
            return false;
        }

        clearErrors(fieldName);
        return true;
    };

    const handleFileChange = (fieldName, file) => {
        if (validateFile(file, fieldName)) {
            setValue(fieldName, file);
        }
    };

    // Handle file removal
    const handleRemoveFile = (fieldName) => {
        setValue(fieldName, null);
        clearErrors(fieldName);
    };

    // Helper function to get color based on verification status
    const getStatusColor = (status) => {
        switch(status) {
            case 'verified': return '#4caf50';
            case 'failed': return '#f44336';
            case 'pending': return '#ff9800';
            default: return '#757575';
        }
    };

    // Helper function to get icon based on verification status
    const getStatusIcon = (status) => {
        switch(status) {
            case 'verified': return <CheckCircle sx={{ color: '#4caf50', fontSize: 40 }} />;
            case 'failed': return <Error sx={{ color: '#f44336', fontSize: 40 }} />;
            case 'pending': return <PendingActions sx={{ color: '#ff9800', fontSize: 40 }} />;
            default: return null;
        }
    };

    // Get percentage of form completion
    const getCompletionPercentage = () => {
        const fields = [
            'name',
            'email',
            'president_email',
            'president_name',
            'treasurer_email',
            'treasurer_name',
            'secretary_email',
            'secretary_name',
            'matricule_fiscal',
            'cin_recto',
            'cin_verso',
            'rne_document'
        ];
        const completed = fields.filter(field => watch(field)).length;
        return Math.round((completed / fields.length) * 100);
    };

    // Handle step navigation
    const handleNextStep = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBackStep = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    // Function to provide guidance based on verification status
    const getVerificationGuidance = (status) => {
        switch (status) {
            case 'verified':
                return (
                    <Alert severity="success" sx={{ mt: 3, borderLeft: '5px solid #2e7d32', backgroundColor: '#e8f5e9' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                            ✅ Vérification Réussie
                        </Typography>
                        <Typography variant="body2">
                            Félicitations ! Votre association a été <strong>vérifiée avec succès</strong>.
                            Vous pouvez maintenant vous connecter avec les informations fournies.
                        </Typography>
                    </Alert>
                );

            case 'failed':
                return (
                    <Alert
                        severity="error"
                        variant="outlined"
                        icon={<Error sx={{ fontSize: 30 }} />}
                        sx={{
                            mt: 3,
                            borderLeft: '6px solid #d32f2f',
                            backgroundColor: '#ffebee',
                            p: 2,
                            borderRadius: 2
                        }}
                    >
                        <Typography variant="h6" sx={{ color: '#d32f2f', fontWeight: 700, mb: 1 }}>
                            ❌ Vérification Échouée
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            Merci de vérifier les éléments suivants :
                        </Typography>
                        <Box component="ul" sx={{ pl: 3 }}>
                            <li>Matricule fiscal : <strong>{registeredAssociation?.matricule_fiscal || 'N/A'}</strong></li>
                            <li>Documents clairement lisibles</li>
                            <li>Pièce d'identité & RNE valides et à jour</li>
                        </Box>
                        <Typography variant="body2" sx={{ mt: 2, fontWeight: 500 }}>
                            ➡️ Veuillez créer une nouvelle demande avec des documents corrigés.
                        </Typography>

                        {verificationStatus?.verification_notes && (
                            <Box sx={{ mt: 2, p: 2, backgroundColor: '#ffcdd2', borderRadius: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    💡 Détails supplémentaires :
                                </Typography>
                                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                    {verificationStatus.verification_notes}
                                </Typography>
                            </Box>
                        )}
                    </Alert>
                );

            case 'pending':
                return (
                    <Alert
                        severity="info"
                        sx={{
                            mt: 3,
                            borderLeft: '5px solid #0288d1',
                            backgroundColor: '#e1f5fe',
                            color: '#01579b'
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            ⏳ Vérification en cours
                        </Typography>
                        <Typography variant="body2">
                            Votre demande est en cours de vérification. Le processus utilise notre technologie d'IA
                            pour analyser vos documents et extraire le matricule fiscal pour validation.
                            Cela peut prendre quelques instants.
                        </Typography>
                        {verificationTimeoutMessage && (
                            <Box sx={{ mt: 2, p: 2, backgroundColor: '#fff3e0', borderRadius: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                                    <WarningAmber sx={{ mr: 1, color: '#ff9800' }} />
                                    Le processus prend plus de temps que prévu. Si le statut ne change pas dans les
                                    prochaines minutes, essayez de rafraîchir la page ou contactez notre support.
                                </Typography>
                            </Box>
                        )}
                    </Alert>
                );

            default:
                return null;
        }
    };

    // Component for retry button functionality
    const RetryRegistrationButton = () => {
        if (verificationStatus?.verification_status !== 'failed' && !verificationTimeoutMessage) return null;

        return (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                    {verificationStatus?.verification_status === 'failed'
                        ? 'Pour réessayer avec de nouveaux documents :'
                        : 'Pour recommencer le processus :'}
                </Typography>
                <MyButton
                    label="Nouvelle demande"
                    onClick={() => {
                        setRegisteredAssociation(null);
                        setShowVerificationStatus(false);
                        setVerificationStatus(null);
                        setVerificationProgress(0);
                        setActiveStep(0);
                        setVerificationTimeoutMessage(false);
                        if (verificationTimeoutRef.current) {
                            clearTimeout(verificationTimeoutRef.current);
                        }
                        verificationAttemptRef.current = 0;
                        reset(); // clear form data
                    }}
                    sx={{
                        minWidth: 220,
                        backgroundColor: verificationStatus?.verification_status === 'failed' ? '#d32f2f' : '#ff9800',
                        color: '#fff',
                        fontWeight: 600,
                        '&:hover': {
                            backgroundColor: verificationStatus?.verification_status === 'failed' ? '#b71c1c' : '#e65100',
                        }
                    }}
                    startIcon={verificationStatus?.verification_status === 'failed' ? <RestartAlt /> : <AutoAwesome />}
                />
            </Box>
        );
    };

    // Help dialog content based on topic
    const getHelpContent = () => {
        switch(helpTopic) {
            case 'matricule':
                return (
                    <>
                        <DialogTitle>
                            Qu'est-ce que le Matricule Fiscal ?
                            <IconButton
                                aria-label="close"
                                onClick={() => setHelpDialogOpen(false)}
                                sx={{ position: 'absolute', right: 8, top: 8 }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent dividers>
                            <Typography variant="body1" paragraph>
                                Le Matricule Fiscal est un identifiant unique attribué à votre association par l'administration fiscale tunisienne.
                            </Typography>
                            <Typography variant="body1" paragraph>
                                <strong>Format standard :</strong> 7 chiffres suivis d'une lettre (ex: 1234567A)
                            </Typography>
                            <Typography variant="body1" paragraph>
                                <strong>Où le trouver :</strong> Vous pouvez trouver votre matricule fiscal sur :
                            </Typography>
                            <Box component="ul" sx={{ pl: 3 }}>
                                <li>Votre document RNE</li>
                                <li>Votre attestation fiscale</li>
                                <li>Votre carte d'identité fiscale</li>
                            </Box>
                            <Box sx={{ mt: 2, p: 2, backgroundColor: '#e3f2fd', borderRadius: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                    Important :
                                </Typography>
                                <Typography variant="body2">
                                    Le matricule fiscal que vous entrez ici sera automatiquement vérifié par rapport à celui qui figure dans votre document RNE. Assurez-vous qu'ils correspondent parfaitement.
                                </Typography>
                            </Box>
                        </DialogContent>
                    </>
                );

            case 'verification':
                return (
                    <>
                        <DialogTitle>
                            Processus de Vérification
                            <IconButton
                                aria-label="close"
                                onClick={() => setHelpDialogOpen(false)}
                                sx={{ position: 'absolute', right: 8, top: 8 }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent dividers>
                            <Typography variant="body1" paragraph>
                                Notre système utilise une technologie d'intelligence artificielle avancée pour vérifier vos documents et confirmer l'authenticité de votre association.
                            </Typography>

                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
                                Le processus comprend les étapes suivantes :
                            </Typography>

                            <Box sx={{ ml: 2 }}>
                                <Typography variant="body2" paragraph sx={{ display: 'flex', alignItems: 'center' }}>
                                    <CheckCircle sx={{ mr: 1, fontSize: 16, color: '#4caf50' }} />
                                    <strong>Extraction de données</strong> : Notre système OCR extrait automatiquement le matricule fiscal de votre document RNE.
                                </Typography>

                                <Typography variant="body2" paragraph sx={{ display: 'flex', alignItems: 'center' }}>
                                    <CheckCircle sx={{ mr: 1, fontSize: 16, color: '#4caf50' }} />
                                    <strong>Vérification</strong> : Nous comparons le matricule extrait avec celui que vous avez fourni.
                                </Typography>

                                <Typography variant="body2" paragraph sx={{ display: 'flex', alignItems: 'center' }}>
                                    <CheckCircle sx={{ mr: 1, fontSize: 16, color: '#4caf50' }} />
                                    <strong>Validation</strong> : Si les deux correspondent, votre compte est immédiatement validé.
                                </Typography>
                            </Box>

                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 3, mb: 1 }}>
                                Conseils pour une vérification réussie :
                            </Typography>

                            <Box component="ul" sx={{ pl: 3 }}>
                                <li>Assurez-vous que tous les documents sont clairs et bien scannés</li>
                                <li>Vérifiez que le matricule fiscal est clairement visible sur le document RNE</li>
                                <li>Utilisez des fichiers PDF de bonne qualité (et non des photos de documents)</li>
                                <li>Assurez-vous que le matricule entré correspond exactement à celui du document</li>
                            </Box>

                            <Alert severity="info" variant="outlined" sx={{ mt: 3 }}>
                                <Typography variant="body2">
                                    Si la vérification échoue, vous recevrez un message détaillant les raisons et pourrez effectuer une nouvelle demande avec des documents corrigés.
                                </Typography>
                            </Alert>
                        </DialogContent>
                    </>
                );

            case 'documents':
                return (
                    <>
                        <DialogTitle>
                            Documents Requis
                            <IconButton
                                aria-label="close"
                                onClick={() => setHelpDialogOpen(false)}
                                sx={{ position: 'absolute', right: 8, top: 8 }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent dividers>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                Pièce d'identité
                            </Typography>

                            <Typography variant="body2" paragraph>
                                Nous demandons le recto et le verso de la CIN du représentant légal de l'association pour vérifier son identité.
                            </Typography>

                            <Box sx={{ mt: 1, mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                                <Typography variant="body2">
                                    <strong>Format requis :</strong> PDF uniquement<br />
                                    <strong>Taille maximale :</strong> 10 Mo par fichier<br />
                                    <strong>Qualité :</strong> Le document doit être clairement lisible
                                </Typography>
                            </Box>

                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                Document RNE (Registre National des Entreprises)
                            </Typography>

                            <Typography variant="body2" paragraph>
                                Ce document officiel contient les informations légales de votre association, dont le matricule fiscal qui sera vérifié automatiquement.
                            </Typography>

                            <Box sx={{ mt: 1, mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                                <Typography variant="body2">
                                    <strong>Format requis :</strong> PDF uniquement<br />
                                    <strong>Taille maximale :</strong> 10 Mo<br />
                                    <strong>Éléments importants :</strong> Le matricule fiscal doit être clairement visible
                                </Typography>
                            </Box>

                            <Alert severity="warning" sx={{ mt: 2 }}>
                                <Typography variant="body2">
                                    <strong>Confidentialité des données :</strong> Tous les documents que vous téléchargez sont traités de manière sécurisée et confidentielle conformément à la législation en vigueur.
                                </Typography>
                            </Alert>
                        </DialogContent>
                    </>
                );

            default:
                return (
                    <>
                        <DialogTitle>Aide Générale</DialogTitle>
                        <DialogContent dividers>
                            <Typography variant="body1">
                                Si vous avez besoin d'aide supplémentaire, veuillez contacter notre service d'assistance.
                            </Typography>
                        </DialogContent>
                    </>
                );
        }
    };

    // Documentation dialog component
    const HelpDialog = () => (
        <Dialog
            open={helpDialogOpen}
            onClose={() => setHelpDialogOpen(false)}
            maxWidth="md"
            fullWidth
            scroll="paper"
        >
            {getHelpContent()}
            <DialogActions>
                <MyButton
                    label="Fermer"
                    onClick={() => setHelpDialogOpen(false)}
                />
            </DialogActions>
        </Dialog>
    );

    // Document quality warning dialog
    const DocumentQualityDialog = () => (
        <Dialog
            open={documentErrorDialog}
            onClose={() => setDocumentErrorDialog(false)}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle sx={{ backgroundColor: '#fff3e0', color: '#e65100' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <WarningAmber sx={{ mr: 1 }} />
                    Attention: Problème potentiel de qualité
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                <Typography variant="body1" paragraph>
                    Certains de vos documents semblent être de qualité insuffisante pour notre système de reconnaissance automatique.
                </Typography>

                <Typography variant="body1" paragraph>
                    <strong>Recommandations :</strong>
                </Typography>

                <Box component="ul" sx={{ pl: 3 }}>
                    <li>Assurez-vous que tous les documents sont clairement scannés, non flous et bien cadrés</li>
                    <li>Les fichiers PDF doivent avoir une résolution suffisante pour être lisibles</li>
                    <li>Le matricule fiscal doit être parfaitement visible sur le document RNE</li>
                    <li>Évitez les documents trop compressés ou de mauvaise qualité</li>
                </Box>

                <Typography variant="body1" paragraph sx={{ mt: 2 }}>
                    Vous pouvez continuer avec les documents actuels ou les remplacer par des documents de meilleure qualité.
                </Typography>
            </DialogContent>
            <DialogActions>
                <MyButton
                    label="Annuler et corriger"
                    onClick={() => {
                        setDocumentErrorDialog(false);
                        setActiveStep(1); // Return to document upload
                    }}
                    sx={{ color: '#d32f2f' }}
                />
                <MyButton
                    label="Continuer quand même"
                    onClick={() => {
                        setDocumentErrorDialog(false);
                        handleSubmit(handleRegister)();
                    }}
                    className="login-btn"
                />
            </DialogActions>
        </Dialog>
    );

    // Network error dialog
    const NetworkErrorAlert = () => {
        if (!networkError) return null;

        return (
            <Alert
                severity="error"
                sx={{
                    mb: 3,
                    backgroundColor: '#ffebee',
                    borderLeft: '4px solid #d32f2f',
                    '& .MuiAlert-icon': {
                        fontSize: '2rem'
                    }
                }}
                icon={<WarningAmber fontSize="inherit" />}
                action={
                    <MyButton
                        label="Réessayer"
                        onClick={() => {
                            setNetworkError(false);
                            handleSubmit(handleRegister)();
                        }}
                        sx={{ color: '#d32f2f' }}
                    />
                }
            >
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Problème de connexion détecté
                </Typography>
                <Typography variant="body2">
                    La connexion au serveur a échoué ou le délai d'attente a été dépassé.
                    Cela peut être dû à une connexion Internet instable ou à des fichiers volumineux.
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                    Veuillez vérifier votre connexion et réessayer.
                </Typography>
            </Alert>
        );
    };

    // Registration steps with enhanced help tooltips
    const steps = [
        {
            label: 'Informations de base',
            description: 'Entrez les informations de base de votre association',
            fields: ['name', 'email', 'matricule_fiscal'],
            icon: <Business />,
            helpTopic: 'matricule',
            helpText: "Qu'est-ce que le matricule fiscal et où le trouver?"
        },
        {
            label: 'Piéce d\'identité (Recto)',
            description: 'Téléchargez le recto de votre Piéce d\'identité',
            fields: ['cin_recto'],
            icon: <ArticleOutlined />,
            helpTopic: 'documents',
            helpText: "Quels formats sont acceptés et comment préparer mes documents?"
        },
        {
            label: 'Piéce d\'identité (Verso)',
            description: 'Téléchargez le verso de votre Piéce d\'identité',
            fields: ['cin_verso'],
            icon: <ArticleOutlined />,
            helpTopic: 'documents',
            helpText: "Quels formats sont acceptés et comment préparer mes documents?"
        },
        {
            label: 'Document RNE',
            description: 'Téléchargez votre document RNE pour la vérification',
            fields: ['rne_document'],
            icon: <FactCheck />,
            helpTopic: 'documents',
            helpText: "Qu'est-ce que le document RNE et pourquoi est-il nécessaire?"
        },
        {
            label: 'Soumission',
            description: 'Vérification des documents et enregistrement',
            icon: <GradingOutlined />,
            helpTopic: 'verification',
            helpText: "Comment fonctionne le processus de vérification automatique?"
        }
    ];

    // Helper to check if current step is valid and can proceed
    const canProceed = () => {
        const currentFields = steps[activeStep].fields || [];
        return currentFields.every(field => !errors[field] && watch(field));
    };

    // Enhanced file input component with error handling and delete option
    const FileInput = ({ name, label, description, control, errors }) => (
        <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{label}</Typography>
                <Tooltip title="Format PDF uniquement, max 10MB" arrow>
                    <InfoOutlined sx={{ ml: 1, fontSize: 16, color: 'text.secondary', cursor: 'pointer' }} />
                </Tooltip>
            </Box>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>{description}</Typography>

            <Controller
                name={name}
                control={control}
                defaultValue={null}
                render={({ field: { onChange, value } }) => (
                    <Box
                        sx={{
                            border: '2px dashed',
                            borderColor: errors[name] ? '#f44336' : (value ? '#4caf50' : '#0d47a1'),
                            borderRadius: 2,
                            p: 3,
                            textAlign: 'center',
                            transition: 'all 0.3s ease',
                            backgroundColor: value ? 'rgba(76, 175, 80, 0.05)' : 'transparent',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {value ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
                                    <CheckCircle sx={{ fontSize: 30, color: '#4caf50', mr: 1 }} />
                                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                        Document téléchargé
                                    </Typography>
                                </Box>
                                <Box sx={{ p: 1, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 1, mb: 2 }}>
                                    <Typography>{value.name}</Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        {(value.size / 1024 / 1024).toFixed(2)} MB
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                                    <Chip
                                        label="Changer"
                                        onClick={() => document.getElementById(`file-input-${name}`).click()}
                                        icon={<CloudUpload />}
                                        color="primary"
                                        variant="outlined"
                                    />
                                    <Chip
                                        label="Supprimer"
                                        onClick={() => handleRemoveFile(name)}
                                        icon={<DeleteOutline />}
                                        color="error"
                                        variant="outlined"
                                    />
                                </Box>
                            </motion.div>
                        ) : (
                            <>
                                <CloudUpload sx={{ fontSize: 40, color: '#0d47a1', mb: 1 }} />
                                <Typography>Déposez votre fichier ici ou cliquez pour parcourir</Typography>
                                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                                    Format PDF uniquement • Taille maximale: 10MB
                                </Typography>
                            </>
                        )}
                        <input
                            id={`file-input-${name}`}
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    handleFileChange(name, file);
                                }
                            }}
                            style={{
                                opacity: 0,
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                cursor: 'pointer'
                            }}
                        />
                    </Box>
                )}
            />
            {errors[name] && (
                <Alert severity="error" variant="outlined" sx={{ mt: 1 }}>
                    <Typography variant="caption">
                        {errors[name].message}
                    </Typography>
                </Alert>
            )}
        </Box>
    );

    // Enhanced verification dashboard with more user feedback
    const VerificationDashboard = () => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Typography variant="h4" sx={{ mb: 4, color: '#0d47a1', fontWeight: 'bold', textAlign: 'center' }}>
                Vérification des Documents
            </Typography>

            <Paper elevation={3} sx={{ p: 4, borderRadius: 3, mb: 4, backgroundColor: '#f8faff' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <AutoAwesome sx={{ fontSize: 32, color: '#0d47a1', mr: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 'medium' }}>
                        {registeredAssociation?.name || 'Votre association'}
                    </Typography>
                </Box>

                <Divider sx={{ mb: 4 }} />

                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                            verificationStatus?.verification_status === 'verified' ? (
                                <CheckCircle sx={{ color: '#4caf50', fontSize: 28 }} />
                            ) : verificationStatus?.verification_status === 'failed' ? (
                                <Error sx={{ color: '#f44336', fontSize: 28 }} />
                            ) : (
                                <PendingActions sx={{ color: '#ff9800', fontSize: 28 }} />
                            )
                        }
                    >
                        <Box
                            sx={{
                                position: 'relative',
                                width: 120,
                                height: 120,
                                borderRadius: '50%',
                                backgroundColor: '#e0f2f1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto',
                            }}
                        >
                            <CircularProgress
                                variant="determinate"
                                value={verificationProgress}
                                size={120}
                                thickness={4}
                                sx={{
                                    position: 'absolute',
                                    color: getStatusColor(verificationStatus?.verification_status),
                                    animationDuration: '1.5s',
                                }}
                            />
                            <VerifiedUser sx={{ fontSize: 50, color: '#0d47a1' }} />
                        </Box>
                    </Badge>

                    <Typography
                        variant="h6"
                        sx={{
                            mt: 3,
                            fontWeight: 'bold',
                            color: getStatusColor(verificationStatus?.verification_status),
                            textTransform: 'uppercase',
                            letterSpacing: 1
                        }}
                    >
                        {verificationStatus?.verification_status === 'verified' ? 'Vérifié' :
                            verificationStatus?.verification_status === 'failed' ? 'Échec de Vérification' :
                                'Vérification en cours'}
                    </Typography>
                </Box>

                <Box sx={{ mb: 4 }}>
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, backgroundColor: 'white' }}>
                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
                            Détails de la vérification
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2">Matricule Fiscal:</Typography>
                                <Chip
                                    label={registeredAssociation?.matricule_fiscal?.toUpperCase() || 'N/A'}
                                    variant="outlined"
                                    color="primary"
                                />
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2">État de l'extraction:</Typography>
                                <Chip
                                    icon={verificationStatus?.verification_status === 'verified' ? <CheckCircle /> :
                                        verificationStatus?.verification_status === 'failed' ? <Error /> :
                                            <PendingActions />}
                                    label={verificationStatus?.verification_status === 'verified' ? 'Réussi' :
                                        verificationStatus?.verification_status === 'failed' ? 'Échoué' :
                                            'En cours'}
                                    variant="filled"
                                    color={verificationStatus?.verification_status === 'verified' ? 'success' :
                                        verificationStatus?.verification_status === 'failed' ? 'error' :
                                            'warning'}
                                />
                            </Box>

                            {verificationStatus?.verification_date && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2">Date de vérification:</Typography>
                                    <Chip
                                        label={new Date(verificationStatus.verification_date).toLocaleString()}
                                        variant="outlined"
                                    />
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Box>

                <AnimatePresence>
                    {verificationStatus?.verification_notes && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Alert
                                severity={verificationStatus.verification_status === 'verified' ? 'success' :
                                    verificationStatus.verification_status === 'failed' ? 'error' : 'info'}
                                variant="filled"
                                sx={{ mb: 3 }}
                            >
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Notes:</Typography>
                                <Typography variant="body2">
                                    {verificationStatus.verification_notes}
                                </Typography>
                            </Alert>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Add verification guidance */}
                {getVerificationGuidance(verificationStatus?.verification_status)}

                {/* Add retry button for failed verifications */}
                <RetryRegistrationButton />

                {verificationStatus?.verification_status === 'pending' && !verificationTimeoutMessage && (
                    <Box sx={{ textAlign: 'center', mt: 3 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                            Notre IA analyse vos documents... Cette opération peut prendre quelques instants.
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
                            <FindInPage sx={{ color: '#0d47a1', mr: 1 }} />
                            <Typography variant="caption">Extraction et validation des données</Typography>
                        </Box>
                    </Box>
                )}

                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <MyButton
                        label="Retour à la connexion"
                        component={Link}
                        to="/"
                        className="login-btn"
                        sx={{ minWidth: 200 }}
                    />
                </Box>
            </Paper>

            <Accordion sx={{ mb: 3, boxShadow: 'none', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '8px !important' }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                        <HelpOutline sx={{ mr: 1, fontSize: 20, color: '#0d47a1' }} />
                        Comment fonctionne le processus de vérification ?
                    </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ backgroundColor: '#f5f9ff' }}>
                    <Typography variant="body2" paragraph>
                        Notre système utilise une technologie OCR (Reconnaissance Optique de Caractères) avancée pour
                        analyser vos documents et extraire automatiquement le matricule fiscal figurant sur votre RNE.
                    </Typography>
                    <Typography variant="body2" paragraph>
                        Ce matricule est ensuite comparé à celui que vous avez saisi lors de l'inscription. Si les deux
                        correspondent, votre compte est vérifié instantanément.
                    </Typography>
                    <Typography variant="body2">
                        Le processus est entièrement automatisé et sécurisé, garantissant une vérification rapide
                        et fiable de votre association.
                    </Typography>
                </AccordionDetails>
            </Accordion>

            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'text.secondary' }}>
                La vérification est effectuée par notre système d'intelligence artificielle qui extrait les informations
                de vos documents et valide leur conformité avec les exigences légales.
            </Typography>
        </motion.div>
    );

    // AI document verification animation component - enhanced with better visualization
    const AiVerificationAnimation = () => (
        <Box sx={{ position: 'relative', mt: 3, mb: 3, height: 60 }}>
            <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{
                    x: [0, 50, 100, 150, 200],
                    opacity: [1, 1, 1, 0.8, 0]
                }}
                transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <ArticleOutlined sx={{ color: '#0d47a1', fontSize: 28 }} />
            </motion.div>

            <motion.div
                animate={{
                    rotate: [0, 360],
                    scale: [1, 1.2, 1]
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                style={{
                    position: 'absolute',
                    left: '45%',
                    top: 0,
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <AutoAwesome sx={{ color: '#ff9800', fontSize: 28 }} />
            </motion.div>

            <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{
                    x: [200, 150, 100, 50, 0],
                    opacity: [0, 0.8, 1, 1, 1]
                }}
                transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <VerifiedUser sx={{ color: '#4caf50', fontSize: 28 }} />
            </motion.div>
        </Box>
    );

    // Render the main component
    return (
        <div className="login-container">
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                TransitionComponent={Fade}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.severity}
                    variant="filled"
                    sx={{ width: '100%', fontWeight: 'medium' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>

            <div className="background-image" style={{ backgroundImage: `url(${backgroundImage})` }} />
            <div className="gradient-overlay" />

            {/* Help Dialogs */}
            <HelpDialog />
            <DocumentQualityDialog />

            {/* Left Panel */}
            <div className="left-panel">
                <div className="welcome-content">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Typography variant="h3" className="welcome-title">Rejoindre notre réseau</Typography>
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
                            Enregistrez votre association et commencez à interagir avec notre communauté.
                        </Typography>
                    </motion.div>

                    {/* Features Box */}
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
                                <Business sx={{ fontSize: 48, color: '#fff', mb: 2 }} />
                            </motion.div>
                            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
                                Bénéfices de l'inscription
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#fff' }}>
                                Accédez à nos outils de gestion spécialisés pour les associations tunisiennes,
                                conformes à la législation en vigueur.
                            </Typography>
                        </Box>
                    </motion.div>

                    {/* AI Verification Feature */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 1.2 }}
                    >
                        <Box
                            sx={{
                                mt: 4,
                                p: 3,
                                borderRadius: '12px',
                                backgroundColor: 'rgba(76, 175, 80, 0.3)',
                                backdropFilter: 'blur(10px)',
                                minHeight: '100px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center'
                            }}
                        >
                            <motion.div
                                animate={{
                                    rotate: [0, 10, 0, -10, 0],
                                    scale: [1, 1.1, 1]
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    repeatType: "loop"
                                }}
                            >
                                <AutoAwesome sx={{ fontSize: 40, color: '#fff', mb: 1 }} />
                            </motion.div>
                            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
                                Vérification Intelligente
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#fff' }}>
                                Notre système IA analyse vos documents et extrait automatiquement les informations
                                nécessaires pour une validation rapide et efficace.
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
                {showVerificationStatus && verificationStatus ? (
                    // Show enhanced verification dashboard after registration
                    <motion.div
                        className="login-card"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
                    >
                        <VerificationDashboard />
                    </motion.div>
                ) : (
                    // Registration form with stepper
                    <motion.div
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
                            <Typography variant="h4" className="login-title">Enregistrement Association 🏢</Typography>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.7 }}
                        >
                            <Typography className="login-subtitle">Créez votre compte organisation</Typography>
                        </motion.div>

                        {/* Progress indicator */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 3 }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={getCompletionPercentage()}
                                    sx={{
                                        height: 10,
                                        borderRadius: 5,
                                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                        '& .MuiLinearProgress-bar': {
                                            backgroundColor: '#4caf50',
                                            borderRadius: 5
                                        }
                                    }}
                                />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                {getCompletionPercentage()}%
                            </Typography>
                        </Box>

                        {registerError && (
                            <motion.div
                                className="error-message"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <span className="error-icon">!</span>
                                <span>{registerError}</span>
                            </motion.div>
                        )}

                        {/* Network error alert */}
                        <NetworkErrorAlert />

                        <form onSubmit={handleSubmit(handleRegister)}>
                            <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 3 }}>
                                {steps.map((step, index) => (
                                    <Step key={step.label}>
                                        <StepLabel
                                            StepIconProps={{
                                                icon: step.icon,
                                                completed: index < activeStep
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {step.label}
                                                {step.helpTopic && (
                                                    <Tooltip title={step.helpText} arrow>
                                                        <Help
                                                            sx={{
                                                                ml: 1,
                                                                fontSize: 16,
                                                                color: 'text.secondary',
                                                                cursor: 'pointer'
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setHelpTopic(step.helpTopic);
                                                                setHelpDialogOpen(true);
                                                            }}
                                                        />
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </StepLabel>
                                        <StepContent>
                                            <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                                                {step.description}
                                            </Typography>

                                            {index === 0 && (
                                                <>
                                                    {/* Association Name Field */}
                                                    <Box className="input-group" sx={{ mb: 3 }}>
                                                        <FormField
                                                            label="Nom de l'association"
                                                            name="name"
                                                            control={control}
                                                            fullWidth
                                                            placeholder="Entrez le nom de votre association"
                                                            error={!!errors.name}
                                                            helperText={errors.name?.message}
                                                            InputProps={{
                                                                startAdornment: (
                                                                    <InputAdornment position="start">
                                                                        <Business style={{ color: '#0d47a1' }} />
                                                                    </InputAdornment>
                                                                ),
                                                            }}
                                                        />
                                                    </Box>

                                                    {/* Association Email Field */}
                                                    <Box className="input-group" sx={{ mb: 3 }}>
                                                        <FormField
                                                            label="Adresse email de l'association"
                                                            name="email"
                                                            type="email"
                                                            control={control}
                                                            fullWidth
                                                            placeholder="association@exemple.com"
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

                                                    {/* President Information Section */}
                                                    <Typography variant="subtitle1" sx={{ mt: 3, mb: 2, fontWeight: 'bold', color: '#2563eb' }}>
                                                        Information du Président
                                                    </Typography>

                                                    {/* President Name Field */}
                                                    <Box className="input-group" sx={{ mb: 3 }}>
                                                        <FormField
                                                            label="Nom complet du Président"
                                                            name="president_name"
                                                            control={control}
                                                            fullWidth
                                                            placeholder="Prénom et nom du président"
                                                            error={!!errors.president_name}
                                                            helperText={errors.president_name?.message}
                                                            InputProps={{
                                                                startAdornment: (
                                                                    <InputAdornment position="start">
                                                                        <Person style={{ color: '#2563eb' }} />
                                                                    </InputAdornment>
                                                                ),
                                                            }}
                                                        />
                                                    </Box>

                                                    {/* President Email Field */}
                                                    <Box className="input-group" sx={{ mb: 3 }}>
                                                        <FormField
                                                            label="Email du Président"
                                                            name="president_email"
                                                            type="email"
                                                            control={control}
                                                            fullWidth
                                                            placeholder="president@exemple.com"
                                                            error={!!errors.president_email}
                                                            helperText={errors.president_email?.message}
                                                            InputProps={{
                                                                startAdornment: (
                                                                    <InputAdornment position="start">
                                                                        <Email style={{ color: '#2563eb' }} />
                                                                    </InputAdornment>
                                                                ),
                                                            }}
                                                        />
                                                    </Box>

                                                    {/* Treasurer Information Section */}
                                                    <Typography variant="subtitle1" sx={{ mt: 3, mb: 2, fontWeight: 'bold', color: '#2563eb' }}>
                                                        Information du Trésorier
                                                    </Typography>

                                                    {/* Treasurer Name Field */}
                                                    <Box className="input-group" sx={{ mb: 3 }}>
                                                        <FormField
                                                            label="Nom complet du Trésorier"
                                                            name="treasurer_name"
                                                            control={control}
                                                            fullWidth
                                                            placeholder="Prénom et nom du trésorier"
                                                            error={!!errors.treasurer_name}
                                                            helperText={errors.treasurer_name?.message}
                                                            InputProps={{
                                                                startAdornment: (
                                                                    <InputAdornment position="start">
                                                                        <Person style={{ color: '#2563eb' }} />
                                                                    </InputAdornment>
                                                                ),
                                                            }}
                                                        />
                                                    </Box>

                                                    {/* Treasurer Email Field */}
                                                    <Box className="input-group" sx={{ mb: 3 }}>
                                                        <FormField
                                                            label="Email du Trésorier"
                                                            name="treasurer_email"
                                                            type="email"
                                                            control={control}
                                                            fullWidth
                                                            placeholder="tresorier@exemple.com"
                                                            error={!!errors.treasurer_email}
                                                            helperText={errors.treasurer_email?.message}
                                                            InputProps={{
                                                                startAdornment: (
                                                                    <InputAdornment position="start">
                                                                        <Email style={{ color: '#2563eb' }} />
                                                                    </InputAdornment>
                                                                ),
                                                            }}
                                                        />
                                                    </Box>

                                                    {/* Secretary Information Section */}
                                                    <Typography variant="subtitle1" sx={{ mt: 3, mb: 2, fontWeight: 'bold', color: '#2563eb' }}>
                                                        Information du Secrétaire Général
                                                    </Typography>

                                                    {/* Secretary Name Field */}
                                                    <Box className="input-group" sx={{ mb: 3 }}>
                                                        <FormField
                                                            label="Nom complet du Secrétaire Général"
                                                            name="secretary_name"
                                                            control={control}
                                                            fullWidth
                                                            placeholder="Prénom et nom du secrétaire"
                                                            error={!!errors.secretary_name}
                                                            helperText={errors.secretary_name?.message}
                                                            InputProps={{
                                                                startAdornment: (
                                                                    <InputAdornment position="start">
                                                                        <Person style={{ color: '#2563eb' }} />
                                                                    </InputAdornment>
                                                                ),
                                                            }}
                                                        />
                                                    </Box>

                                                    {/* Secretary Email Field */}
                                                    <Box className="input-group" sx={{ mb: 3 }}>
                                                        <FormField
                                                            label="Email du Secrétaire Général"
                                                            name="secretary_email"
                                                            type="email"
                                                            control={control}
                                                            fullWidth
                                                            placeholder="secretaire@exemple.com"
                                                            error={!!errors.secretary_email}
                                                            helperText={errors.secretary_email?.message}
                                                            InputProps={{
                                                                startAdornment: (
                                                                    <InputAdornment position="start">
                                                                        <Email style={{ color: '#2563eb' }} />
                                                                    </InputAdornment>
                                                                ),
                                                            }}
                                                        />
                                                    </Box>

                                                    {/* Matricule Fiscal Field with enhanced help */}
                                                    <Box className="input-group">
                                                        <FormField
                                                            label="Matricule Fiscal"
                                                            name="matricule_fiscal"
                                                            control={control}
                                                            fullWidth
                                                            placeholder="Format: 1234567A"
                                                            error={!!errors.matricule_fiscal}
                                                            helperText={errors.matricule_fiscal?.message}
                                                            InputProps={{
                                                                startAdornment: (
                                                                    <InputAdornment position="start">
                                                                        <span style={{ color: '#2563eb', fontWeight: 'bold' }}>MF</span>
                                                                    </InputAdornment>
                                                                ),
                                                            }}
                                                        />
                                                    </Box>
                                                    <Alert severity="info" sx={{ mt: 2, fontSize: '0.85rem' }}>
                                                        Le matricule fiscal sera automatiquement vérifié dans votre document RNE.
                                                        Assurez-vous qu'il soit identique.
                                                    </Alert>

                                                    {/* Additional info about the email fields */}
                                                    <Alert severity="info" sx={{ mt: 2, fontSize: '0.85rem' }}>
                                                        Les informations du Président, Trésorier et Secrétaire Général seront utilisées pour créer automatiquement des comptes avec les rôles appropriés après vérification de l'association.
                                                    </Alert>
                                                </>
                                            )}

                                            {index === 1 && (
                                                <FileInput
                                                    name="cin_recto"
                                                    label="Pièce d'identité(Recto)"
                                                    description="Téléchargez le recto de votre Pièce d'identité"
                                                    control={control}
                                                    errors={errors}
                                                />
                                            )}

                                            {index === 2 && (
                                                <FileInput
                                                    name="cin_verso"
                                                    label="Pièce d'identité (Verso)"
                                                    description="Téléchargez le verso de votre Pièce d'identité"
                                                    control={control}
                                                    errors={errors}
                                                />
                                            )}

                                            {index === 3 && (
                                                <>
                                                    <FileInput
                                                        name="rne_document"
                                                        label="Document RNE"
                                                        description="Téléchargez votre document du Registre National des Entreprises pour vérification"
                                                        control={control}
                                                        errors={errors}
                                                    />

                                                    <Alert
                                                        severity="warning"
                                                        sx={{ mt: 2, fontSize: '0.85rem' }}
                                                        icon={<WarningAmber />}
                                                    >
                                                        <Typography variant="body2" fontWeight="medium">
                                                            Important : Le matricule fiscal doit être clairement visible sur ce document
                                                        </Typography>
                                                    </Alert>
                                                </>
                                            )}

                                            {index === 4 && (
                                                <Box sx={{ textAlign: 'center', py: 2 }}>
                                                    {loading ? (
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                            <CircularProgress size={50} sx={{ mb: 2 }} />
                                                            <Typography variant="body1">
                                                                Traitement de votre demande...
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                                                                Téléchargement et analyse des documents
                                                            </Typography>
                                                            <AiVerificationAnimation />
                                                            <Typography variant="caption" sx={{ mt: 2, color: 'text.secondary', fontStyle: 'italic' }}>
                                                                Cela peut prendre quelques instants selon la taille des fichiers
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <>
                                                            <Alert
                                                                severity="info"
                                                                variant="filled"
                                                                icon={<InfoOutlined fontSize="large" />}
                                                                sx={{
                                                                    mb: 2,
                                                                    fontWeight: 'bold',
                                                                    fontSize: '1rem',
                                                                    borderLeft: '4px solid #0d47a1'
                                                                }}
                                                            >
                                                                <strong>IMPORTANT:</strong> Vérifiez que toutes les informations sont correctes avant de soumettre.
                                                            </Alert>

                                                            <Typography variant="body2" paragraph sx={{ textAlign: 'left', color: 'text.secondary' }}>
                                                                En soumettant ce formulaire :
                                                            </Typography>

                                                            <Box sx={{ textAlign: 'left', mb: 2 }}>
                                                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                                    <CheckCircle sx={{ mr: 1, fontSize: 16, color: '#4caf50' }} />
                                                                    Nous vérifierons automatiquement votre document RNE
                                                                </Typography>
                                                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                                    <CheckCircle sx={{ mr: 1, fontSize: 16, color: '#4caf50' }} />
                                                                    Si la vérification réussit, votre compte sera activé immédiatement
                                                                </Typography>
                                                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                                                                    <CheckCircle sx={{ mr: 1, fontSize: 16, color: '#4caf50' }} />
                                                                    Vous recevrez un retour détaillé sur la vérification
                                                                </Typography>
                                                            </Box>
                                                        </>
                                                    )}
                                                </Box>
                                            )}

                                            <Box sx={{ mb: 2, mt: 2, display: 'flex',gap: 2 }}>
                                                <MyButton
                                                    label="Retour"
                                                    onClick={handleBackStep}
                                                    disabled={index === 0 || loading}
                                                    sx={{flex: 1 }}
                                                />

                                                {index === steps.length - 1 ? (
                                                    <MyButton
                                                        label={loading ? <CircularProgress size={24} color="inherit" /> : "Enregistrer"}
                                                        type="submit"
                                                        className="login-btn"
                                                        disabled={loading}
                                                        sx={{ flex: 1 }}
                                                    />
                                                ) : (
                                                    <MyButton
                                                        label="Suivant"
                                                        onClick={handleNextStep}
                                                        disabled={!canProceed() || loading}
                                                        className="login-btn"
                                                        sx={{ flex: 1 }}
                                                    />
                                                )}
                                            </Box>
                                        </StepContent>
                                    </Step>
                                ))}
                            </Stepper>

                            {/* Back to Login Link */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                            >
                                <Typography className="signup-prompt" sx={{ textAlign: 'center', mt: 3 }}>
                                    <Link to="/" className="signup-link">Retour à la connexion</Link>
                                </Typography>
                            </motion.div>
                        </form>
                    </motion.div>
                )}
            </div>

            {/* Floating Animation Elements */}
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

            {/* AI Verification Floating Element */}
            <motion.div
                style={{
                    position: 'absolute',
                    top: '30%',
                    left: '10%',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.7), rgba(129, 199, 132, 0.7))',
                    zIndex: 1,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                animate={{
                    x: [0, 10, 0, -10, 0],
                    scale: [1, 1.1, 1, 1.1, 1]
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                <AutoAwesome style={{ color: 'white', fontSize: 20 }} />
            </motion.div>

            {/* Another Floating Element */}
            <motion.div
                style={{
                    position: 'absolute',
                    top: '15%',
                    right: '15%',
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.7), rgba(255, 193, 7, 0.7))',
                    zIndex: 1,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                }}
                animate={{
                    y: [0, 15, 0],
                    opacity: [0.7, 1, 0.7]
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Document Verification Progress Animation */}
            {loading && (
                <motion.div
                    style={{
                        position: 'absolute',
                        bottom: '15%',
                        left: '5%',
                        right: '5%',
                        height: 3,
                        background: 'linear-gradient(90deg, #4caf50, #2196f3)',
                        zIndex: 2,
                        borderRadius: 2
                    }}
                    initial={{ width: 0, x: 0, opacity: 0 }}
                    animate={{
                        opacity: [0, 1, 1, 1, 0],
                        x: ['0%', '100%']
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            )}
        </div>
    );
};

export default RegisterAssociation;