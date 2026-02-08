import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    CircularProgress,
    Snackbar,
    Alert,
    Grid,
    Paper,
    Container,
    IconButton,
    Chip,
    Avatar,
    Fade,
    Tabs,
    Tab
} from "@mui/material";
import { useForm } from 'react-hook-form';
import AxiosInstance from './Axios.jsx';
import Dayjs from "dayjs";
import { useNavigate, Link } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { styled, useTheme, alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';

// Form Fields
import MyDatePickerField from "./forms/MyDatePickerField.jsx";
import MyTextField from "./forms/MyTextField.jsx";
import MySelectField from "./forms/MySelectField.jsx";

// Icons
import PermIdentityIcon from '@mui/icons-material/PermIdentity';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import HomeIcon from '@mui/icons-material/Home';
import PublicIcon from '@mui/icons-material/Public';
import WorkIcon from '@mui/icons-material/Work';
import CakeIcon from '@mui/icons-material/Cake';
import EventIcon from '@mui/icons-material/Event';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';


// Styled components
const FormContainer = styled(Paper)(({ theme }) => ({
    borderRadius: '12px',
    padding: theme.spacing(3),
    boxShadow: '0 2px 20px rgba(0, 0, 0, 0.08)',
    backgroundColor: theme.palette.background.paper,
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    margin: '0 auto',
    maxWidth: '100%',
    position: 'relative',
    transition: 'transform 0.3s, box-shadow 0.3s',
    overflow: 'hidden',
    '&:hover': {
        boxShadow: '0 4px 25px rgba(0, 0, 0, 0.12)',
    }
}));

const HeaderContainer = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    padding: theme.spacing(2, 3),
    borderRadius: '8px',
    marginBottom: theme.spacing(3),
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)',
        zIndex: 0,
    }
}));

const SubmitButton = styled(Button)(({ theme }) => ({
    backgroundColor: theme.palette.primary.main,
    '&:hover': {
        backgroundColor: theme.palette.primary.dark,
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 10px rgba(0, 0, 0, 0.15)',
    },
    borderRadius: '8px',
    padding: '10px 24px',
    fontWeight: 600,
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
    '&:active': {
        transform: 'translateY(0)',
    }
}));

const ResetButton = styled(Button)(({ theme }) => ({
    borderRadius: '8px',
    padding: '10px 24px',
    fontWeight: 500,
    color: theme.palette.text.secondary,
    backgroundColor: 'transparent',
    border: `1px solid ${theme.palette.divider}`,
    '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
    },
    transition: 'all 0.3s ease',
}));

const FormBox = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(3),
    '& .MuiFormControl-root': {
        width: '100%',
    },
    '& .MuiOutlinedInput-root': {
        borderRadius: '8px',
        transition: 'transform 0.2s ease',
    },
    '& .MuiFormLabel-root': {
        color: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.8) : theme.palette.primary.main,
    }
}));

const StyledTab = styled(Tab)(({ theme }) => ({
    textTransform: 'none',
    fontWeight: 500,
    fontSize: '0.9rem',
    minHeight: 48,
    borderRadius: '8px 8px 0 0',
    '&.Mui-selected': {
        color: theme.palette.primary.main,
        fontWeight: 600,
    }
}));

const InfoChip = styled(Chip)(({ theme }) => ({
    backgroundColor: alpha(theme.palette.info.main, 0.1),
    color: theme.palette.info.main,
    borderRadius: '16px',
    fontWeight: 500,
    '& .MuiChip-icon': {
        color: theme.palette.info.main,
    }
}));

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
    width: 100,
    height: 100,
    backgroundColor: alpha(theme.palette.primary.main, 0.9),
    color: theme.palette.common.white,
    fontSize: '2.5rem',
    fontWeight: 'bold',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    margin: '0 auto 20px auto',
}));

const CreateMember = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const navigate = useNavigate();
    const theme = useTheme();

    const schema = yup.object({
        name: yup.string().required('Le nom est obligatoire'),
        cin: yup.string()
            .matches(/^\d{8}$/, 'La CIN doit contenir exactement 8 chiffres')
            .required('La CIN est obligatoire'),
        address: yup.string().required('L\'adresse est obligatoire'),
        email: yup.string().email('Email invalide').required('L\'email est obligatoire'),
        nationality: yup.string().required('La nationalité est obligatoire'),
        birth_date: yup.date().nullable().required('La date de naissance est obligatoire'),
        job: yup.string().required('Le métier est obligatoire'),
        joining_date: yup.date().nullable().required('La date d\'adhésion est obligatoire'),
        role: yup.string().required('Le rôle est obligatoire'),
    });

    const { handleSubmit, control, reset, watch, formState: { errors, isValid } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: '',
            cin: '',
            address: '',
            email: '',
            nationality: '',
            birth_date: null,
            job: '',
            joining_date: null,
            role: '',
        },
        mode: 'onChange'
    });

    // Helper function to get initials from name
    const getInitials = (name) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    // Update the submission function in CreateMember.jsx
    const submission = async (data) => {
        setLoading(true);
        setError(null);
        try {
            // Create the data object with all required fields
            const memberData = {
                ...data,
                birth_date: data.birth_date ? Dayjs(data.birth_date).format('YYYY-MM-DD') : null,
                joining_date: data.joining_date ? Dayjs(data.joining_date).format('YYYY-MM-DD') : null,
                needs_profile_completion: false
            };

            console.log("Submitting member data:", memberData);

            const response = await AxiosInstance.post('/api/member/', memberData);

            setSuccess(true);
            reset();
            setTimeout(() => {
                navigate('/members', {
                    state: {
                        success: true,
                        message: `Le membre "${data.name}" a été créé avec succès`
                    }
                });
            }, 1500);
        } catch (err) {
            console.error('Erreur lors de la création du membre:', err);

            // Handle different types of error responses
            let errorMessage;
            if (err.response) {
                if (typeof err.response.data === 'object') {
                    // Handle object errors (field-specific errors)
                    errorMessage = Object.entries(err.response.data)
                        .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                        .join('; ');
                } else if (err.response.data.error) {
                    // Handle error property
                    errorMessage = err.response.data.error;
                } else if (err.response.data.detail) {
                    // Handle detail property
                    errorMessage = err.response.data.detail;
                } else if (typeof err.response.data === 'string') {
                    // Handle string error
                    errorMessage = err.response.data;
                } else {
                    // Default error
                    errorMessage = 'Une erreur est survenue lors de la création du membre. Veuillez réessayer.';
                }
            } else {
                errorMessage = 'Erreur de réseau. Veuillez vérifier votre connexion et réessayer.';
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const roleOptions = [
        { value: "Président", label: "Président" },
        { value: "Secrétaire générale", label: "Secrétaire générale" },
        { value: "Trésorier", label: "Trésorier" },
        { value: "Membre", label: "Membre" },
        { value: "Autre", label: "Autre" },
    ];

    const countries = [
        { value: "Afghanistan", label: "Afghanistan" },
        { value: "Albania", label: "Albanie" },
        { value: "Algeria", label: "Algérie" },
        { value: "Andorra", label: "Andorre" },
        { value: "Angola", label: "Angola" },
        { value: "Antigua and Barbuda", label: "Antigua-et-Barbuda" },
        { value: "Argentina", label: "Argentine" },
        { value: "Armenia", label: "Arménie" },
        { value: "Australia", label: "Australie" },
        { value: "Austria", label: "Autriche" },
        { value: "Azerbaijan", label: "Azerbaïdjan" },
        { value: "Bahamas", label: "Bahamas" },
        { value: "Bahrain", label: "Bahreïn" },
        { value: "Bangladesh", label: "Bangladesh" },
        { value: "Barbados", label: "Barbade" },
        { value: "Belarus", label: "Biélorussie" },
        { value: "Belgium", label: "Belgique" },
        { value: "Belize", label: "Belize" },
        { value: "Benin", label: "Bénin" },
        { value: "Bhutan", label: "Bhoutan" },
        { value: "Bolivia", label: "Bolivie" },
        { value: "Bosnia and Herzegovina", label: "Bosnie-Herzégovine" },
        { value: "Botswana", label: "Botswana" },
        { value: "Brazil", label: "Brésil" },
        { value: "Brunei", label: "Brunéi" },
        { value: "Bulgaria", label: "Bulgarie" },
        { value: "Burkina Faso", label: "Burkina Faso" },
        { value: "Burundi", label: "Burundi" },
        { value: "Cabo Verde", label: "Cap-Vert" },
        { value: "Cambodia", label: "Cambodge" },
        { value: "Cameroon", label: "Cameroun" },
        { value: "Canada", label: "Canada" },
        { value: "Central African Republic", label: "République centrafricaine" },
        { value: "Chad", label: "Tchad" },
        { value: "Chile", label: "Chili" },
        { value: "China", label: "Chine" },
        { value: "Colombia", label: "Colombie" },
        { value: "Comoros", label: "Comores" },
        { value: "Congo", label: "Congo" },
        { value: "Congo (Democratic Republic)", label: "Congo (République démocratique)" },
        { value: "Costa Rica", label: "Costa Rica" },
        { value: "Croatia", label: "Croatie" },
        { value: "Cuba", label: "Cuba" },
        { value: "Cyprus", label: "Chypre" },
        { value: "Czech Republic", label: "République tchèque" },
        { value: "Denmark", label: "Danemark" },
        { value: "Djibouti", label: "Djibouti" },
        { value: "Dominica", label: "Dominique" },
        { value: "Dominican Republic", label: "République dominicaine" },
        { value: "Ecuador", label: "Équateur" },
        { value: "Egypt", label: "Égypte" },
        { value: "El Salvador", label: "Salvador" },
        { value: "Equatorial Guinea", label: "Guinée équatoriale" },
        { value: "Eritrea", label: "Érythrée" },
        { value: "Estonia", label: "Estonie" },
        { value: "Eswatini", label: "Eswatini" },
        { value: "Ethiopia", label: "Éthiopie" },
        { value: "Fiji", label: "Fidji" },
        { value: "Finland", label: "Finlande" },
        { value: "France", label: "France" },
        { value: "Gabon", label: "Gabon" },
        { value: "Gambia", label: "Gambie" },
        { value: "Georgia", label: "Géorgie" },
        { value: "Germany", label: "Allemagne" },
        { value: "Ghana", label: "Ghana" },
        { value: "Greece", label: "Grèce" },
        { value: "Grenada", label: "Grenade" },
        { value: "Guatemala", label: "Guatemala" },
        { value: "Guinea", label: "Guinée" },
        { value: "Guinea-Bissau", label: "Guinée-Bissau" },
        { value: "Guyana", label: "Guyana" },
        { value: "Haiti", label: "Haïti" },
        { value: "Honduras", label: "Honduras" },
        { value: "Hungary", label: "Hongrie" },
        { value: "Iceland", label: "Islande" },
        { value: "India", label: "Inde" },
        { value: "Indonesia", label: "Indonésie" },
        { value: "Iran", label: "Iran" },
        { value: "Iraq", label: "Irak" },
        { value: "Ireland", label: "Irlande" },
        { value: "Palestine", label: "Palestine" },
        { value: "Italy", label: "Italie" },
        { value: "Jamaica", label: "Jamaïque" },
        { value: "Japan", label: "Japon" },
        { value: "Jordan", label: "Jordanie" },
        { value: "Kazakhstan", label: "Kazakhstan" },
        { value: "Kenya", label: "Kenya" },
        { value: "Kiribati", label: "Kiribati" },
        { value: "Korea (North)", label: "Corée du Nord" },
        { value: "Korea (South)", label: "Corée du Sud" },
        { value: "Kuwait", label: "Koweït" },
        { value: "Kyrgyzstan", label: "Kirghizistan" },
        { value: "Laos", label: "Laos" },
        { value: "Latvia", label: "Lettonie" },
        { value: "Lebanon", label: "Liban" },
        { value: "Lesotho", label: "Lesotho" },
        { value: "Liberia", label: "Libéria" },
        { value: "Libya", label: "Libye" },
        { value: "Liechtenstein", label: "Liechtenstein" },
        { value: "Lithuania", label: "Lituanie" },
        { value: "Luxembourg", label: "Luxembourg" },
        { value: "Madagascar", label: "Madagascar" },
        { value: "Malawi", label: "Malawi" },
        { value: "Malaysia", label: "Malaisie" },
        { value: "Maldives", label: "Maldives" },
        { value: "Mali", label: "Mali" },
        { value: "Malta", label: "Malte" },
        { value: "Marshall Islands", label: "Îles Marshall" },
        { value: "Mauritania", label: "Mauritanie" },
        { value: "Mauritius", label: "Maurice" },
        { value: "Mexico", label: "Mexique" },
        { value: "Micronesia", label: "Micronésie" },
        { value: "Moldova", label: "Moldavie" },
        { value: "Monaco", label: "Monaco" },
        { value: "Mongolia", label: "Mongolie" },
        { value: "Montenegro", label: "Monténégro" },
        { value: "Morocco", label: "Maroc" },
        { value: "Mozambique", label: "Mozambique" },
        { value: "Myanmar", label: "Myanmar" },
        { value: "Namibia", label: "Namibie" },
        { value: "Nauru", label: "Nauru" },
        { value: "Nepal", label: "Népal" },
        { value: "Netherlands", label: "Pays-Bas" },
        { value: "New Zealand", label: "Nouvelle-Zélande" },
        { value: "Nicaragua", label: "Nicaragua" },
        { value: "Niger", label: "Niger" },
        { value: "Nigeria", label: "Nigeria" },
        { value: "North Macedonia", label: "Macédoine du Nord" },
        { value: "Norway", label: "Norvège" },
        { value: "Oman", label: "Oman" },
        { value: "Pakistan", label: "Pakistan" },
        { value: "Palau", label: "Palaos" },
        { value: "Panama", label: "Panama" },
        { value: "Papua New Guinea", label: "Papouasie-Nouvelle-Guinée" },
        { value: "Paraguay", label: "Paraguay" },
        { value: "Peru", label: "Pérou" },
        { value: "Philippines", label: "Philippines" },
        { value: "Poland", label: "Pologne" },
        { value: "Portugal", label: "Portugal" },
        { value: "Qatar", label: "Qatar" },
        { value: "Romania", label: "Roumanie" },
        { value: "Russia", label: "Russie" },
        { value: "Rwanda", label: "Rwanda" },
        { value: "Saint Kitts and Nevis", label: "Saint-Christophe-et-Niévès" },
        { value: "Saint Lucia", label: "Sainte-Lucie" },
        { value: "Saint Vincent and the Grenadines", label: "Saint-Vincent-et-les-Grenadines" },
        { value: "Samoa", label: "Samoa" },
        { value: "San Marino", label: "Saint-Marin" },
        { value: "Sao Tome and Principe", label: "Sao Tomé-et-Principe" },
        { value: "Saudi Arabia", label: "Arabie saoudite" },
        { value: "Senegal", label: "Sénégal" },
        { value: "Serbia", label: "Serbie" },
        { value: "Seychelles", label: "Seychelles" },
        { value: "Sierra Leone", label: "Sierra Leone" },
        { value: "Singapore", label: "Singapour" },
        { value: "Slovakia", label: "Slovaquie" },
        { value: "Slovenia", label: "Slovénie" },
        { value: "Solomon Islands", label: "Îles Salomon" },
        { value: "Somalia", label: "Somalie" },
        { value: "South Africa", label: "Afrique du Sud" },
        { value: "South Sudan", label: "Soudan du Sud" },
        { value: "Spain", label: "Espagne" },
        { value: "Sri Lanka", label: "Sri Lanka" },
        { value: "Sudan", label: "Soudan" },
        { value: "Suriname", label: "Suriname" },
        { value: "Sweden", label: "Suède" },
        { value: "Switzerland", label: "Suisse" },
        { value: "Syria", label: "Syrie" },
        { value: "Taiwan", label: "Taïwan" },
        { value: "Tajikistan", label: "Tadjikistan" },
        { value: "Tanzania", label: "Tanzanie" },
        { value: "Thailand", label: "Thaïlande" },
        { value: "Timor-Leste", label: "Timor oriental" },
        { value: "Togo", label: "Togo" },
        { value: "Tonga", label: "Tonga" },
        { value: "Trinidad and Tobago", label: "Trinité-et-Tobago" },
        { value: "Tunisia", label: "Tunisie" },
        { value: "Turkey", label: "Turquie" },
        { value: "Turkmenistan", label: "Turkménistan" },
        { value: "Tuvalu", label: "Tuvalu" },
        { value: "Uganda", label: "Ouganda" },
        { value: "Ukraine", label: "Ukraine" },
        { value: "United Arab Emirates", label: "Émirats arabes unis" },
        { value: "United Kingdom", label: "Royaume-Uni" },
        { value: "United States", label: "États-Unis" },
        { value: "Uruguay", label: "Uruguay" },
        { value: "Uzbekistan", label: "Ouzbékistan" },
        { value: "Vanuatu", label: "Vanuatu" },
        { value: "Vatican City", label: "Cité du Vatican" },
        { value: "Venezuela", label: "Venezuela" },
        { value: "Vietnam", label: "Vietnam" },
        { value: "Yemen", label: "Yémen" },
        { value: "Zambia", label: "Zambie" },
        { value: "Zimbabwe", label: "Zimbabwe" }
    ];

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                when: "beforeChildren",
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <Container maxWidth="lg">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <Box sx={{ maxWidth: 1000, margin: '0 auto' }}>
                    {/* Back button */}
                    <Button
                        component={motion.button}
                        variants={itemVariants}
                        onClick={() => navigate('/members')}
                        startIcon={<ArrowBackIcon />}
                        sx={{
                            mb: 2,
                            fontWeight: 500,
                            color: theme.palette.text.secondary,
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                            }
                        }}
                    >
                        Retour à la liste des membres
                    </Button>

                    {/* Header */}
                    <motion.div variants={itemVariants}>
                        <HeaderContainer>
                            <PersonIcon sx={{ mr: 2, fontSize: 28 }} />
                            <Box sx={{ zIndex: 1 }}>
                                <Typography variant="h5" component="h1" fontWeight="bold">
                                    Créer un nouveau membre
                                </Typography>
                                <Typography variant="subtitle2">
                                    Ajouter un nouveau membre à votre organisation
                                </Typography>
                            </Box>
                            {/* Decorative circles */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: -20,
                                    right: -20,
                                    width: 100,
                                    height: 100,
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.1)',
                                    zIndex: 0
                                }}
                            />
                            <Box
                                sx={{
                                    position: 'absolute',
                                    bottom: -30,
                                    right: 100,
                                    width: 60,
                                    height: 60,
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.1)',
                                    zIndex: 0
                                }}
                            />
                        </HeaderContainer>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <FormContainer elevation={0}>
                            {/* Tabs */}
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                                <Tabs
                                    value={tabValue}
                                    onChange={handleTabChange}
                                    aria-label="onglets de création de membre"
                                    indicatorColor="primary"
                                    textColor="primary"
                                >
                                    <StyledTab label="Informations personnelles" icon={<PersonIcon />} iconPosition="start" />
                                    <StyledTab label="Professionnel & Dates" icon={<WorkIcon />} iconPosition="start" />
                                </Tabs>
                            </Box>

                            <form onSubmit={handleSubmit(submission)}>
                                {/* Profile Avatar */}
                                <Box sx={{ textAlign: 'center', mb: 3 }}>
                                    <ProfileAvatar>
                                        {getInitials(watch('name'))}
                                    </ProfileAvatar>
                                </Box>

                                {/* Tab Content */}
                                <Box sx={{ mb: 3 }}>
                                    {/* Personal Information Tab */}
                                    <Fade in={tabValue === 0} unmountOnExit>
                                        <Box hidden={tabValue !== 0}>
                                            <Grid container spacing={3}>
                                                <Grid item xs={12} md={6}>
                                                    <FormBox>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                            <PersonIcon color="primary" sx={{ mr: 1 }} />
                                                            <Typography variant="subtitle2">Nom complet</Typography>
                                                        </Box>
                                                        <MyTextField
                                                            name="name"
                                                            control={control}
                                                            placeholder="Entrez le nom complet"
                                                            error={!!errors.name}
                                                            helperText={errors.name?.message}
                                                        />
                                                    </FormBox>
                                                </Grid>

                                                <Grid item xs={12} md={6}>
                                                    <FormBox>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                            <EmailIcon color="primary" sx={{ mr: 1 }} />
                                                            <Typography variant="subtitle2">Email</Typography>
                                                        </Box>
                                                        <MyTextField
                                                            name="email"
                                                            control={control}
                                                            placeholder="Entrez l'adresse email"
                                                            error={!!errors.email}
                                                            helperText={errors.email?.message}
                                                        />
                                                    </FormBox>
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <FormBox>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                            <PermIdentityIcon color="primary" sx={{ mr: 1 }} />
                                                            <Typography variant="subtitle2">CIN</Typography>
                                                        </Box>
                                                        <MyTextField
                                                            name="cin"
                                                            control={control}
                                                            placeholder="Entrez la CIN (8 chiffres)"
                                                            error={!!errors.cin}
                                                            helperText={errors.cin?.message}
                                                        />
                                                    </FormBox>
                                                </Grid>

                                                <Grid item xs={12}>
                                                    <FormBox>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                            <HomeIcon color="primary" sx={{ mr: 1 }} />
                                                            <Typography variant="subtitle2">Adresse</Typography>
                                                        </Box>
                                                        <MyTextField
                                                            name="address"
                                                            control={control}
                                                            placeholder="Entrez l'adresse résidentielle"
                                                            error={!!errors.address}
                                                            helperText={errors.address?.message}
                                                        />
                                                    </FormBox>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    </Fade>

                                    {/* Professional & Dates Tab */}
                                    <Fade in={tabValue === 1} unmountOnExit>
                                        <Box hidden={tabValue !== 1}>
                                            <Grid container spacing={3}>
                                                <Grid item xs={12} md={6}>
                                                    <FormBox>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                            <PublicIcon color="primary" sx={{ mr: 1 }} />
                                                            <Typography variant="subtitle2">Nationalité</Typography>
                                                        </Box>
                                                        <MySelectField
                                                            name="nationality"
                                                            control={control}
                                                            options={countries}
                                                            error={!!errors.nationality}
                                                            helperText={errors.nationality?.message}
                                                        />
                                                    </FormBox>
                                                </Grid>

                                                <Grid item xs={12} md={6}>
                                                    <FormBox>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                            <WorkIcon color="primary" sx={{ mr: 1 }} />
                                                            <Typography variant="subtitle2">Métier</Typography>
                                                        </Box>
                                                        <MyTextField
                                                            name="job"
                                                            control={control}
                                                            placeholder="Entrez le métier"
                                                            error={!!errors.job}
                                                            helperText={errors.job?.message}
                                                        />
                                                    </FormBox>
                                                </Grid>

                                                <Grid item xs={12} md={6}>
                                                    <FormBox>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                            <AdminPanelSettingsIcon color="primary" sx={{ mr: 1 }} />
                                                            <Typography variant="subtitle2">Rôle</Typography>
                                                        </Box>
                                                        <MySelectField
                                                            name="role"
                                                            control={control}
                                                            options={roleOptions}
                                                            error={!!errors.role}
                                                            helperText={errors.role?.message}
                                                        />
                                                    </FormBox>
                                                </Grid>

                                                <Grid item xs={12} md={6}>
                                                    <FormBox>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                            <CakeIcon color="primary" sx={{ mr: 1 }} />
                                                            <Typography variant="subtitle2">Date de naissance</Typography>
                                                        </Box>
                                                        <MyDatePickerField
                                                            name="birth_date"
                                                            control={control}
                                                            error={!!errors.birth_date}
                                                            helperText={errors.birth_date?.message}
                                                        />
                                                    </FormBox>
                                                </Grid>

                                                <Grid item xs={12} md={6}>
                                                    <FormBox>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                            <EventIcon color="primary" sx={{ mr: 1 }} />
                                                            <Typography variant="subtitle2">Date d'adhésion</Typography>
                                                        </Box>
                                                        <MyDatePickerField
                                                            name="joining_date"
                                                            control={control}
                                                            error={!!errors.joining_date}
                                                            helperText={errors.joining_date?.message}
                                                        />
                                                    </FormBox>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    </Fade>
                                </Box>

                                {/* Info message */}
                                <Box sx={{ mb: 3 }}>
                                    <InfoChip
                                        icon={<InfoOutlinedIcon />}
                                        label="Remplissez tous les champs obligatoires pour créer un nouveau membre"
                                    />
                                </Box>

                                {/* Action buttons */}
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    flexWrap: { xs: 'wrap', sm: 'nowrap' },
                                    gap: 2,
                                    mt: 2
                                }}>
                                    <ResetButton
                                        onClick={() => reset()}
                                        variant="outlined"
                                    >
                                        Réinitialiser
                                    </ResetButton>

                                    <SubmitButton
                                        type="submit"
                                        variant="contained"
                                        disabled={loading || !isValid}
                                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                    >
                                        {loading ? 'Création en cours...' : success ? 'Créé !' : 'Créer le membre'}
                                    </SubmitButton>
                                </Box>
                            </form>
                        </FormContainer>
                    </motion.div>
                </Box>
            </motion.div>

            {/* Error Notification */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    severity="error"
                    onClose={() => setError(null)}
                    sx={{ width: '100%', borderRadius: '8px' }}
                    action={
                        <IconButton
                            size="small"
                            aria-label="close"
                            color="inherit"
                            onClick={() => setError(null)}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    }
                >
                    {error}
                </Alert>
            </Snackbar>

            {/* Success Notification */}
            <Snackbar
                open={success}
                autoHideDuration={3000}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    severity="success"
                    sx={{ width: '100%', borderRadius: '8px' }}
                >
                    Membre créé avec succès ! Redirection vers la liste des membres...
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default CreateMember;