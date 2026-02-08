import React, { createContext, useState, useMemo, useContext, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createComfortableTheme } from '../theme/comfortableTheme';
import { createAccessibleTheme } from '../theme/accessibleTheme';

// Default theme settings
const defaultSettings = {
    mode: 'light',
    themeType: 'comfortable',
    fontSizeMultiplier: 1,
    spacingScale: 1,
    contrastLevel: 'standard',
    fontFamily: 'default',
    animationSpeed: 'normal', // 'normal', 'reduced', 'none'
    colorTemperature: 'neutral', // 'warm', 'neutral', 'cool'
};

// Load settings from localStorage
const loadSettings = () => {
    try {
        const stored = localStorage.getItem('themeSettings');
        if (stored) {
            return { ...defaultSettings, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.error('Failed to load theme settings:', e);
    }
    return defaultSettings;
};

// Create context
export const ColorModeContext = createContext({
    toggleColorMode: () => {},
    mode: 'light',
    themeType: 'comfortable',
    setThemeType: () => {},
    settings: defaultSettings,
    updateSettings: () => {},
    resetSettings: () => {},
});

// Hook to use the color mode context
export const useColorMode = () => useContext(ColorModeContext);

// Theme Provider Component
function ThemeContextProvider({ children }) {
    const [settings, setSettings] = useState(loadSettings);

    // Save settings to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('themeSettings', JSON.stringify(settings));

        // Apply animation speed to document
        const root = document.documentElement;
        if (settings.animationSpeed === 'none') {
            root.style.setProperty('--animation-duration', '0.01ms');
            root.style.setProperty('--transition-duration', '0.01ms');
        } else if (settings.animationSpeed === 'reduced') {
            root.style.setProperty('--animation-duration', '150ms');
            root.style.setProperty('--transition-duration', '100ms');
        } else {
            root.style.setProperty('--animation-duration', '300ms');
            root.style.setProperty('--transition-duration', '200ms');
        }

        // Apply font size multiplier
        root.style.fontSize = `${16 * settings.fontSizeMultiplier}px`;

    }, [settings]);

    // Theme toggling and update functions
    const colorMode = useMemo(
        () => ({
            toggleColorMode: () => {
                setSettings((prev) => ({
                    ...prev,
                    mode: prev.mode === 'light' ? 'dark' : 'light',
                }));
            },
            setThemeType: (newType) => {
                setSettings((prev) => ({
                    ...prev,
                    themeType: newType,
                }));
            },
            updateSettings: (newSettings) => {
                setSettings((prev) => ({
                    ...prev,
                    ...newSettings,
                }));
            },
            resetSettings: () => {
                setSettings(defaultSettings);
            },
            mode: settings.mode,
            themeType: settings.themeType,
            settings,
        }),
        [settings]
    );

    // Generate the theme based on settings
    const theme = useMemo(
        () => {
            const themeConfig = {
                fontSizeMultiplier: settings.fontSizeMultiplier,
                spacingScale: settings.spacingScale,
                contrastLevel: settings.contrastLevel,
                fontFamily: settings.fontFamily,
                colorTemperature: settings.colorTemperature,
            };

            if (settings.themeType === 'accessible') {
                return createAccessibleTheme(settings.mode, themeConfig);
            }
            return createComfortableTheme(settings.mode, themeConfig);
        },
        [settings]
    );

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
}

// Default export for the component
export default ThemeContextProvider;

// Named export for backward compatibility
export { ThemeContextProvider };