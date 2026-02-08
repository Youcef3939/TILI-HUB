import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Switch,
    Slider,
    FormControlLabel,
    Divider,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    Grid,
    Card,
    CardContent,
    Chip,
    Alert,
    Stack,
} from '@mui/material';
import { useColorMode } from '../contexts/ThemeContext';
import SettingsIcon from '@mui/icons-material/Settings';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ContrastIcon from '@mui/icons-material/Contrast';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import PaletteIcon from '@mui/icons-material/Palette';
import SpeedIcon from '@mui/icons-material/Speed';
import SpaceBarIcon from '@mui/icons-material/SpaceBar';
import FontDownloadIcon from '@mui/icons-material/FontDownload';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ThermostatIcon from '@mui/icons-material/Thermostat';

export default function Settings() {
    const colorMode = useColorMode();
    const { settings, updateSettings, resetSettings } = colorMode;

    const handleFontSizeChange = (event, newValue) => {
        updateSettings({ fontSizeMultiplier: newValue });
    };

    const handleSpacingChange = (event, newValue) => {
        updateSettings({ spacingScale: newValue });
    };

    const handleReset = () => {
        if (window.confirm('Réinitialiser tous les paramètres aux valeurs par défaut ?')) {
            resetSettings();
        }
    };

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 3 } }}>
            <Paper elevation={2} sx={{ p: { xs: 3, md: 4 }, mb: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SettingsIcon sx={{ mr: 2, fontSize: 36, color: 'primary.main' }} />
                        <Box>
                            <Typography variant="h4" fontWeight="bold">
                                Paramètres d'Apparence et d'Accessibilité
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Personnalisez votre expérience selon vos préférences
                            </Typography>
                        </Box>
                    </Box>
                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<RestartAltIcon />}
                        onClick={handleReset}
                    >
                        Réinitialiser
                    </Button>
                </Box>

                <Divider sx={{ mb: 4 }} />

                <Grid container spacing={4}>
                    {/* Theme Settings */}
                    <Grid item xs={12} md={6}>
                        <Card variant="outlined" sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ContrastIcon /> Thème
                                </Typography>

                                <Stack spacing={2}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settings.mode === 'dark'}
                                                onChange={colorMode.toggleColorMode}
                                            />
                                        }
                                        label={settings.mode === 'dark' ? 'Mode Sombre' : 'Mode Clair'}
                                    />

                                    <FormControl fullWidth>
                                        <InputLabel>Type de Thème</InputLabel>
                                        <Select
                                            value={settings.themeType}
                                            onChange={(e) => colorMode.setThemeType(e.target.value)}
                                            label="Type de Thème"
                                        >
                                            <MenuItem value="comfortable">Thème Confortable</MenuItem>
                                            <MenuItem value="accessible">Thème Accessible</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <FormControl fullWidth>
                                        <InputLabel>Température de Couleur</InputLabel>
                                        <Select
                                            value={settings.colorTemperature}
                                            onChange={(e) => updateSettings({ colorTemperature: e.target.value })}
                                            label="Température de Couleur"
                                        >
                                            <MenuItem value="warm">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <ThermostatIcon color="error" /> Chaud
                                                </Box>
                                            </MenuItem>
                                            <MenuItem value="neutral">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <ThermostatIcon /> Neutre
                                                </Box>
                                            </MenuItem>
                                            <MenuItem value="cool">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <ThermostatIcon color="info" /> Froid
                                                </Box>
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Animation Settings */}
                    <Grid item xs={12} md={6}>
                        <Card variant="outlined" sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <SpeedIcon /> Animations
                                </Typography>

                                <FormControl fullWidth>
                                    <InputLabel>Vitesse des Animations</InputLabel>
                                    <Select
                                        value={settings.animationSpeed}
                                        onChange={(e) => updateSettings({ animationSpeed: e.target.value })}
                                        label="Vitesse des Animations"
                                    >
                                        <MenuItem value="normal">Normales</MenuItem>
                                        <MenuItem value="reduced">Réduites</MenuItem>
                                        <MenuItem value="none">Désactivées</MenuItem>
                                    </Select>
                                </FormControl>

                                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                                    {settings.animationSpeed === 'normal' && '✨ Animations complètes pour une expérience dynamique'}
                                    {settings.animationSpeed === 'reduced' && '⚡ Animations subtiles et rapides'}
                                    {settings.animationSpeed === 'none' && '🚫 Aucune animation - Idéal pour les sensibilités au mouvement'}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Font Size */}
                    <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <TextFieldsIcon /> Taille du Texte
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Actuel: {Math.round(settings.fontSizeMultiplier * 100)}%
                                </Typography>
                                <Slider
                                    value={settings.fontSizeMultiplier}
                                    onChange={handleFontSizeChange}
                                    min={0.8}
                                    max={1.5}
                                    step={0.1}
                                    marks={[
                                        { value: 0.8, label: '80%' },
                                        { value: 1, label: '100%' },
                                        { value: 1.2, label: '120%' },
                                        { value: 1.5, label: '150%' },
                                    ]}
                                    valueLabelDisplay="auto"
                                    valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                                />
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Spacing */}
                    <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <SpaceBarIcon /> Espacement
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Actuel: {Math.round(settings.spacingScale * 100)}%
                                </Typography>
                                <Slider
                                    value={settings.spacingScale}
                                    onChange={handleSpacingChange}
                                    min={0.75}
                                    max={1.5}
                                    step={0.25}
                                    marks={[
                                        { value: 0.75, label: 'Compact' },
                                        { value: 1, label: 'Normal' },
                                        { value: 1.25, label: 'Confortable' },
                                        { value: 1.5, label: 'Spacieux' },
                                    ]}
                                    valueLabelDisplay="auto"
                                    valueLabelFormat={(value) => {
                                        if (value === 0.75) return 'Compact';
                                        if (value === 1) return 'Normal';
                                        if (value === 1.25) return 'Confortable';
                                        return 'Spacieux';
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Font Family */}
                    <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FontDownloadIcon /> Police de Caractères
                                </Typography>

                                <FormControl fullWidth>
                                    <InputLabel>Style de Police</InputLabel>
                                    <Select
                                        value={settings.fontFamily}
                                        onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                                        label="Style de Police"
                                    >
                                        <MenuItem value="default">Système (Défaut)</MenuItem>
                                        <MenuItem value="dyslexic" sx={{ fontFamily: 'Comic Sans MS, Arial' }}>
                                            Dyslexie-Friendly
                                        </MenuItem>
                                        <MenuItem value="monospace" sx={{ fontFamily: 'monospace' }}>
                                            Monospace
                                        </MenuItem>
                                    </Select>
                                </FormControl>

                                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                                    La police "Dyslexie-Friendly" facilite la lecture pour les personnes dyslexiques
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Contrast Level */}
                    <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AccessibilityNewIcon /> Niveau de Contraste
                                </Typography>

                                <FormControl fullWidth>
                                    <InputLabel>Contraste</InputLabel>
                                    <Select
                                        value={settings.contrastLevel}
                                        onChange={(e) => updateSettings({ contrastLevel: e.target.value })}
                                        label="Contraste"
                                    >
                                        <MenuItem value="standard">Standard (WCAG AA)</MenuItem>
                                        <MenuItem value="high">Élevé</MenuItem>
                                        <MenuItem value="maximum">Maximum (AAA)</MenuItem>
                                    </Select>
                                </FormControl>

                                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                                    Le contraste élevé améliore la lisibilité pour les personnes malvoyantes
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Preview Section */}
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PaletteIcon /> Aperçu
                    </Typography>
                    <Card variant="outlined" sx={{ p: 3, bgcolor: 'background.default' }}>
                        <Typography variant="h5" gutterBottom color="primary">
                            Titre d'Exemple
                        </Typography>
                        <Typography variant="body1" paragraph>
                            Ceci est un exemple de texte pour visualiser vos paramètres.
                            Les changements sont appliqués immédiatement à toute l'application.
                        </Typography>
                        <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ gap: 1 }}>
                            <Button variant="contained" color="primary">
                                Bouton Principal
                            </Button>
                            <Button variant="outlined" color="secondary">
                                Bouton Secondaire
                            </Button>
                            <Chip label="Étiquette" color="success" />
                            <Chip label="Info" color="info" variant="outlined" />
                        </Stack>
                    </Card>
                </Box>

                {/* Info Alert */}
                <Alert severity="info" sx={{ mt: 3 }}>
                    <Typography variant="body2">
                        💡 <strong>Conseil:</strong> Tous les paramètres sont sauvegardés automatiquement
                        et seront restaurés lors de votre prochaine visite.
                    </Typography>
                </Alert>
            </Paper>
        </Box>
    );
}