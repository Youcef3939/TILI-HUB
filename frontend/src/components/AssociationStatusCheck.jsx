import { useState } from 'react';
import {
  Box, Typography, InputAdornment, CircularProgress, Alert,
  Paper, Card, TextField, Button, Divider
} from '@mui/material';
import {
  Search, CheckCircle, Error, PendingActions, Business
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import AxiosInstance from './Axios';

const AssociationStatusCheck = () => {
  const [matricule, setMatricule] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [associationData, setAssociationData] = useState(null);

  const handleSearch = async () => {
    if (!matricule) {
      setError('Veuillez entrer un matricule fiscal');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First try to find the association
      const response = await AxiosInstance.get(`/users/associations/`, {
        params: { matricule_fiscal: matricule }
      });

      if (response.data && response.data.length > 0) {
        const associationId = response.data[0].id;

        // Then get verification status
        const verificationResponse = await AxiosInstance.get(`/verification/association-verification/${associationId}/`);

        setAssociationData({
          ...response.data[0],
          verification: verificationResponse.data
        });
      } else {
        setError('Aucune association trouvée avec ce matricule fiscal');
      }
    } catch (error) {
      console.error('Error checking status:', error);
      setError("Erreur lors de la vérification. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get status icon
  const getStatusIcon = (status) => {
    switch(status) {
      case 'verified': return <CheckCircle sx={{ color: 'success.main', fontSize: 40 }} />;
      case 'failed': return <Error sx={{ color: 'error.main', fontSize: 40 }} />;
      case 'pending': default: return <PendingActions sx={{ color: 'warning.main', fontSize: 40 }} />;
    }
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'verified': return 'success.main';
      case 'failed': return 'error.main';
      case 'pending': default: return 'warning.main';
    }
  };

  // Helper function to get status text
  const getStatusText = (status) => {
    switch(status) {
      case 'verified': return 'Vérifié';
      case 'failed': return 'Échec de vérification';
      case 'pending': default: return 'En attente de vérification';
    }
  };

  return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, p: 2 }}>
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
          <Typography variant="h4" gutterBottom>
            Vérifier le statut d'une association
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Entrez le matricule fiscal d'une association pour vérifier son statut
          </Typography>
        </motion.div>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 2 }}>
              <TextField
                  fullWidth
                  label="Matricule Fiscal"
                  variant="outlined"
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value.toUpperCase())}
                  placeholder="ex: ABC123E"
                  InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                    ),
                  }}
                  disabled={loading}
              />
              <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSearch}
                  disabled={loading}
                  sx={{ ml: 2, height: 56 }}
              >
                {loading ? <CircularProgress size={24} /> : "Vérifier"}
              </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
            )}
          </Card>
        </motion.div>

        {associationData && (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
              <Paper elevation={3} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Business sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                  <Typography variant="h5">{associationData.name}</Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 3 }}>
                  {getStatusIcon(associationData.verification.verification_status)}
                  <Typography
                      variant="h5"
                      sx={{
                        ml: 2,
                        color: getStatusColor(associationData.verification.verification_status),
                        fontWeight: 'bold'
                      }}
                  >
                    {getStatusText(associationData.verification.verification_status)}
                  </Typography>
                </Box>

                <Box sx={{ my: 2 }}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Matricule Fiscal:</strong> {associationData.matricule_fiscal}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Email:</strong> {associationData.email}
                  </Typography>

                  {associationData.verification.verification_notes && (
                      <Alert
                          severity={associationData.verification.verification_status === 'verified' ? 'success' : 'info'}
                          sx={{ mt: 2 }}
                      >
                        {associationData.verification.verification_notes}
                      </Alert>
                  )}

                  {associationData.verification.verification_date && (
                      <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', textAlign: 'center' }}>
                        Date de vérification: {new Date(associationData.verification.verification_date).toLocaleString()}
                      </Typography>
                  )}
                </Box>
              </Paper>
            </motion.div>
        )}
      </Box>
  );
};

export default AssociationStatusCheck;