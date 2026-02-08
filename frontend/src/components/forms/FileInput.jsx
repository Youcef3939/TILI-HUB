import React from 'react';
import {
    Box,
    Typography,
    Chip,
    Alert
} from '@mui/material';
import {
    CheckCircle,
    CloudUpload,
    ErrorOutline
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Controller } from 'react-hook-form';
import { styled, alpha } from '@mui/material/styles';

const FileInputContainer = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(2.5),
}));

const FileDropZone = styled(Box)(({ theme, hasError, hasFile }) => ({
    border: '2px dashed',
    borderColor: hasError ? theme.palette.error.main : (hasFile ? theme.palette.success.main : theme.palette.primary.main),
    borderRadius: theme.shape.borderRadius * 2,
    padding: theme.spacing(3),
    textAlign: 'center',
    transition: 'all 0.3s ease',
    backgroundColor: hasFile ? alpha(theme.palette.success.main, 0.05) : (hasError ? alpha(theme.palette.error.main, 0.05) : 'transparent'),
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer',
    '&:hover': {
        borderColor: hasError ? theme.palette.error.main : theme.palette.primary.main,
        backgroundColor: hasError ? alpha(theme.palette.error.main, 0.08) : alpha(theme.palette.primary.main, 0.05),
    },
}));

const FileInput = ({
    name,
    label,
    description,
    control,
    errors,
    icon = <CloudUpload />,
    acceptedFormats = "application/pdf",
    maxSize = 5 * 1024 * 1024,
    important = false
}) => {
    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        else return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const getErrorMessage = (error) => {
        if (!error) return null;
        if (error.type === 'fileType') return 'Format de fichier non supporté. Utilisez un fichier PDF.';
        if (error.type === 'fileSize') return `Fichier trop volumineux. Taille maximum: ${formatFileSize(maxSize)}.`;
        return error.message;
    };

    return (
        <FileInputContainer>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                {label}
                {important && <span style={{ color: '#f44336', marginLeft: '4px' }}>*</span>}
            </Typography>

            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                {description}
            </Typography>

            {important && (
                <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                    Ce document est essentiel pour la vérification automatique de l'association.
                </Alert>
            )}

            <Controller
                name={name}
                control={control}
                defaultValue={null}
                render={({ field: { onChange, value } }) => (
                    <FileDropZone
                        hasError={!!errors[name]}
                        hasFile={!!value}
                        onClick={() => document.getElementById(`file-input-${name}`).click()}
                    >
                        {value ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <CheckCircle sx={{ fontSize: 48, color: '#4caf50', mb: 1 }} />
                                <Typography sx={{ fontWeight: 'medium', fontSize: '1rem' }}>
                                    {value.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
                                    {formatFileSize(value.size)} • {value.type.split('/')[1].toUpperCase()}
                                </Typography>
                                <Chip
                                    label="Changer le fichier"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        document.getElementById(`file-input-${name}`).click();
                                    }}
                                    icon={<CloudUpload />}
                                    color="primary"
                                    variant="outlined"
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.2 }}
                            >
                                {React.cloneElement(icon, {
                                    sx: { fontSize: 48, color: '#0d47a1', mb: 1 }
                                })}
                                <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
                                    Déposez votre fichier ici ou cliquez pour parcourir
                                </Typography>
                                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                                    Format accepté: PDF • Taille maximale: {formatFileSize(maxSize)}
                                </Typography>
                            </motion.div>
                        )}

                        <input
                            id={`file-input-${name}`}
                            type="file"
                            accept={acceptedFormats}
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    if (file.size > maxSize) {
                                        alert(`Le fichier est trop volumineux. Maximum: ${formatFileSize(maxSize)}`);
                                        e.target.value = null;
                                        return;
                                    }

                                    if (!file.type.match(acceptedFormats)) {
                                        alert("Format de fichier non supporté. Utilisez un fichier PDF.");
                                        e.target.value = null;
                                        return;
                                    }

                                    onChange(file);
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
                    </FileDropZone>
                )}
            />

            {errors[name] && (
                <Box
                    sx={{
                        mt: 1,
                        display: 'flex',
                        alignItems: 'flex-start',
                        color: '#f44336'
                    }}
                >
                    <ErrorOutline sx={{ fontSize: 18, mr: 0.5, mt: 0.3 }} />
                    <Typography color="error" variant="caption">
                        {getErrorMessage(errors[name])}
                    </Typography>
                </Box>
            )}
        </FileInputContainer>
    );
};

export default FileInput;