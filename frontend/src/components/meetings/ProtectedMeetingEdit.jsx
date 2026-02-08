import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    CircularProgress,
    Box,
    Typography,
    Container,
    Alert
} from '@mui/material';
import { usePermissions } from '/src/contexts/PermissionsContext.jsx';
import MeetingCreateForm from './MeetingCreateForm'; // Réutiliser le formulaire existant pour la modification

const ProtectedMeetingEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { can, RESOURCES, ACTIONS } = usePermissions();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Vérifier si l'utilisateur a la permission de modifier les réunions
        const hasPermission = can(ACTIONS.EDIT, RESOURCES.MEETINGS);

        if (!hasPermission) {
            setError("Vous n'avez pas la permission de modifier les réunions");
            setLoading(false);
        } else {
            setLoading(false);
        }
    }, [can, ACTIONS, RESOURCES]);

    // Si toujours en chargement, afficher l'indicateur de chargement
    if (loading) {
        return (
            <Container maxWidth="md">
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '60vh'
                    }}
                >
                    <CircularProgress size={60} thickness={4} />
                    <Typography variant="h6" sx={{ mt: 2 }}>
                        Vérification des permissions...
                    </Typography>
                </Box>
            </Container>
        );
    }

    // Si l'utilisateur n'a pas la permission, afficher une erreur
    if (error) {
        return (
            <Container maxWidth="md">
                <Box sx={{ mt: 4 }}>
                    <Alert
                        severity="error"
                        sx={{
                            mb: 3,
                            fontSize: '1rem',
                            '& .MuiAlert-icon': {
                                fontSize: '2rem'
                            }
                        }}
                    >
                        {error}
                    </Alert>
                    <Typography variant="body1" paragraph>
                        Vous n'avez pas la permission de modifier cette réunion. Veuillez contacter un administrateur si vous pensez qu'il s'agit d'une erreur.
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Redirection vers la page des réunions dans 5 secondes...
                        </Typography>
                    </Box>
                </Box>
            </Container>
        );
    }

    // Journal de l'ID transmis à MeetingCreateForm (pour le débogage)
    console.log('ID de réunion transmis à MeetingCreateForm:', id);

    // Si l'utilisateur a la permission, afficher le formulaire
    return (
        <MeetingCreateForm
            isEditMode={true}
            meetingId={id}
        />
    );
};

export default ProtectedMeetingEdit;