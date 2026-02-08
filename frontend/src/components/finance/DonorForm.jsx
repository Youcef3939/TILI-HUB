import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Box,
    Typography,
    InputAdornment,
    IconButton,
    FormControlLabel,
    Switch,
    Divider,
    CircularProgress,
    Alert,
    Autocomplete
} from '@mui/material';
import {
    Close,
    Person,
    Email,
    Phone,
    LocationOn,
    Description,
    Article,
    Business,
    People
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import AxiosInstance from '../Axios';

// Schéma de validation du formulaire
const donorSchema = yup.object({
    name: yup.string().required('Le nom du donateur est requis'),
    email: yup.string().email('Entrez une adresse email valide').nullable(),
    phone: yup.string().nullable(),
    address: yup.string().nullable(),
    tax_id: yup.string().nullable(),
    notes: yup.string().nullable(),
    is_anonymous: yup.boolean().default(false),
    is_member: yup.boolean().default(false),
    is_internal: yup.boolean().default(false),
    member_id: yup.number().nullable().when('is_member', {
        is: true,
        then: schema => schema.required('La sélection d\'un membre est requise')
    })
});

const DonorForm = ({ open, onClose, onSuccess, editingDonor = null }) => {
    // États
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    // Configuration du formulaire
    const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(donorSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            address: '',
            tax_id: '',
            notes: '',
            is_anonymous: false,
            is_member: false,
            is_internal: false,
            member_id: null
        }
    });

    // Surveiller les valeurs pour le rendu conditionnel
    const isMember = watch('is_member');
    const isInternal = watch('is_internal');

    // Récupérer les membres lorsque le formulaire s'ouvre et is_member est vrai
    useEffect(() => {
        if (open && isMember) {
            fetchMembers();
        }
    }, [open, isMember]);

    // Récupérer les membres depuis l'API
    const fetchMembers = async () => {
        try {
            setLoadingMembers(true);
            const response = await AxiosInstance.get('/api/member/');
            setMembers(response.data);
        } catch (error) {
            console.error('Erreur lors de la récupération des membres:', error);
            setMembers([]);
        } finally {
            setLoadingMembers(false);
        }
    };

    // Réinitialiser le formulaire lors de l'ouverture de la modale ou du changement de donateur
    useEffect(() => {
        if (open) {
            if (editingDonor) {
                // Si modification d'un donateur existant, remplir le formulaire avec ses données
                reset({
                    name: editingDonor.name || '',
                    email: editingDonor.email || '',
                    phone: editingDonor.phone || '',
                    address: editingDonor.address || '',
                    tax_id: editingDonor.tax_id || '',
                    notes: editingDonor.notes || '',
                    is_anonymous: editingDonor.is_anonymous || false,
                    is_member: editingDonor.is_member || false,
                    is_internal: editingDonor.is_internal || false,
                    member_id: editingDonor.member_id || null
                });
            } else {
                // Si création d'un nouveau donateur, réinitialiser aux valeurs par défaut
                reset({
                    name: '',
                    email: '',
                    phone: '',
                    address: '',
                    tax_id: '',
                    notes: '',
                    is_anonymous: false,
                    is_member: false,
                    is_internal: false,
                    member_id: null
                });
            }
            setSubmitError('');
        }
    }, [open, editingDonor, reset]);

    // Gérer le changement de type de membre
    const handleMemberChange = (e) => {
        const checked = e.target.checked;
        setValue('is_member', checked);

        // Si activation du membre, récupérer les membres et désactiver interne
        if (checked) {
            fetchMembers();
            setValue('is_internal', false);
        } else {
            // Si désactivation du membre, effacer le member_id
            setValue('member_id', null);
        }
    };

    // Gérer le changement de type interne
    const handleInternalChange = (e) => {
        const checked = e.target.checked;
        setValue('is_internal', checked);

        // Si activation interne, désactiver membre
        if (checked) {
            setValue('is_member', false);
            setValue('member_id', null);
        }
    };

    // Gestionnaire de soumission du formulaire
    const onSubmit = async (data) => {
        setLoading(true);
        setSubmitError('');

        try {
            let response;

            if (editingDonor) {
                // Mettre à jour le donateur existant
                response = await AxiosInstance.put(`/finances/donors/${editingDonor.id}/`, data);
                console.log("Donateur mis à jour avec succès:", response.data);
            } else {
                // Créer un nouveau donateur
                response = await AxiosInstance.post('/finances/donors/', data);
                console.log("Donateur créé avec succès:", response.data);
            }

            // Appeler le callback de succès
            onSuccess();
        } catch (error) {
            console.error('Erreur lors de la soumission du donateur:', error);
            setSubmitError(
                error.response?.data?.detail ||
                'Une erreur s\'est produite lors de l\'enregistrement du donateur. Veuillez réessayer.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : onClose}
            maxWidth="md"
            fullWidth
        >
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogTitle>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6">
                            {editingDonor ? 'Modifier le Donateur' : 'Ajouter un Nouveau Donateur'}
                        </Typography>
                        <IconButton onClick={onClose} disabled={loading}>
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent dividers>
                    {submitError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {submitError}
                        </Alert>
                    )}

                    <Grid container spacing={2}>
                        {/* Sélection du Type de Donateur */}
                        <Grid item xs={12}>
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                p: 2,
                                bgcolor: 'background.paper',
                                borderRadius: 1,
                                mb: 2
                            }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={isMember}
                                            onChange={handleMemberChange}
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <People color="primary" sx={{ mr: 1 }} />
                                            <Typography>Donateur Membre</Typography>
                                        </Box>
                                    }
                                />

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={isInternal}
                                            onChange={handleInternalChange}
                                            disabled={isMember}
                                            color="secondary"
                                        />
                                    }
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Business color="secondary" sx={{ mr: 1 }} />
                                            <Typography>Donateur Interne</Typography>
                                        </Box>
                                    }
                                />

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={!isMember && !isInternal}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setValue('is_member', false);
                                                    setValue('is_internal', false);
                                                    setValue('member_id', null);
                                                }
                                            }}
                                            color="default"
                                        />
                                    }
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Person sx={{ mr: 1 }} />
                                            <Typography>Donateur Externe</Typography>
                                        </Box>
                                    }
                                />
                            </Box>
                        </Grid>

                        {/* Sélection de Membre (Conditionnelle) */}
                        {isMember && (
                            <Grid item xs={12}>
                                <Controller
                                    name="member_id"
                                    control={control}
                                    render={({ field: { onChange, value } }) => (
                                        <Autocomplete
                                            options={members}
                                            getOptionLabel={(option) => option.name || option.full_name || option.username || ''}
                                            value={members.find(member => member.id === value) || null}
                                            onChange={(_, newValue) => {
                                                onChange(newValue ? newValue.id : null);
                                            }}
                                            loading={loadingMembers}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Sélectionner un Membre"
                                                    error={!!errors.member_id}
                                                    helperText={errors.member_id?.message}
                                                    required
                                                    InputProps={{
                                                        ...params.InputProps,
                                                        startAdornment: (
                                                            <>
                                                                <InputAdornment position="start">
                                                                    <People />
                                                                </InputAdornment>
                                                                {params.InputProps.startAdornment}
                                                            </>
                                                        ),
                                                        endAdornment: (
                                                            <>
                                                                {loadingMembers ? <CircularProgress color="inherit" size={20} /> : null}
                                                                {params.InputProps.endAdornment}
                                                            </>
                                                        ),
                                                    }}
                                                />
                                            )}
                                        />
                                    )}
                                />
                            </Grid>
                        )}

                        <Grid item xs={12}>
                            <Divider textAlign="left">
                                <Typography variant="body2" color="text.secondary">
                                    Informations du Donateur
                                </Typography>
                            </Divider>
                        </Grid>

                        {/* Nom */}
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="Nom du Donateur"
                                        required
                                        error={!!errors.name}
                                        helperText={errors.name?.message}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Person />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Email */}
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="Adresse Email"
                                        type="email"
                                        error={!!errors.email}
                                        helperText={errors.email?.message}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Email />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Téléphone */}
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="phone"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="Numéro de Téléphone"
                                        error={!!errors.phone}
                                        helperText={errors.phone?.message}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Phone />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Numéro Fiscal */}
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="tax_id"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="Numéro Fiscal / Numéro d'Enregistrement"
                                        error={!!errors.tax_id}
                                        helperText={errors.tax_id?.message}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Article />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Adresse */}
                        <Grid item xs={12}>
                            <Controller
                                name="address"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="Adresse"
                                        multiline
                                        rows={2}
                                        error={!!errors.address}
                                        helperText={errors.address?.message}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LocationOn />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Notes */}
                        <Grid item xs={12}>
                            <Controller
                                name="notes"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="Notes"
                                        multiline
                                        rows={3}
                                        error={!!errors.notes}
                                        helperText={errors.notes?.message}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Description />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Donateur Anonyme */}
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Controller
                                        name="is_anonymous"
                                        control={control}
                                        render={({ field: { onChange, value } }) => (
                                            <Switch
                                                checked={value}
                                                onChange={onChange}
                                                color="primary"
                                            />
                                        )}
                                    />
                                }
                                label="Ce donateur souhaite rester anonyme dans les rapports publics"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions>
                    <Button onClick={onClose} disabled={loading}>
                        Annuler
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : (editingDonor ? 'Mettre à jour le Donateur' : 'Créer le Donateur')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default DonorForm;