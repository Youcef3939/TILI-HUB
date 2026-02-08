/**
 * Accessible Theme Configuration - WCAG 2.1 AA Compliant
 * SIMPLIFIED BUTTONS - NO RIPPLE EFFECTS
 */
import { createTheme, alpha } from '@mui/material/styles';

// ============================================================================
// ACCESSIBLE COLOR PALETTES - Vibrant & Clear (WCAG AA compliant)
// ============================================================================

// Neutral/Standard Colors (default)
export const accessibleColors = {
    primary: {
        main: '#00897B',
        light: '#26A69A',
        dark: '#00695C',
        contrastText: '#FFFFFF'
    },
    secondary: {
        main: '#FF7043',
        light: '#FF8A65',
        dark: '#F4511E',
        contrastText: '#FFFFFF'
    },
    error: {
        main: '#E53935',
        light: '#EF5350',
        dark: '#C62828',
        contrastText: '#FFFFFF'
    },
    success: {
        main: '#43A047',
        light: '#66BB6A',
        dark: '#2E7D32',
        contrastText: '#FFFFFF'
    },
    warning: {
        main: '#FB8C00',
        light: '#FFB74D',
        dark: '#E65100',
        contrastText: '#000000'
    },
    info: {
        main: '#039BE5',
        light: '#29B6F6',
        dark: '#0277BD',
        contrastText: '#FFFFFF'
    },
    text: {
        primary: '#1A1A1A',
        secondary: '#424242',
        disabled: '#9E9E9E',
        hint: '#757575'
    },
    background: {
        default: '#F5F7FA',
        paper: '#FFFFFF',
        elevated: '#FAFBFC'
    },
    divider: '#E0E0E0',
    focus: {
        primary: '#00897B',
        outline: '3px solid #00897B',
        outlineOffset: '2px'
    }
};

// Warm Temperature Variant
export const warmAccessibleColors = {
    ...accessibleColors,
    primary: {
        main: '#D84315',
        light: '#FF6F42',
        dark: '#BF360C',
        contrastText: '#FFFFFF'
    },
    secondary: {
        main: '#FB8C00',
        light: '#FFB74D',
        dark: '#E65100',
        contrastText: '#000000'
    },
    background: {
        default: '#FFF8F5',
        paper: '#FFFFFF',
        elevated: '#FFF5F0'
    },
    focus: {
        primary: '#D84315',
        outline: '3px solid #D84315',
        outlineOffset: '2px'
    }
};

// Cool Temperature Variant
export const coolAccessibleColors = {
    ...accessibleColors,
    primary: {
        main: '#1976D2',
        light: '#42A5F5',
        dark: '#0D47A1',
        contrastText: '#FFFFFF'
    },
    secondary: {
        main: '#039BE5',
        light: '#29B6F6',
        dark: '#0277BD',
        contrastText: '#FFFFFF'
    },
    background: {
        default: '#F0F4F8',
        paper: '#FFFFFF',
        elevated: '#F5F8FC'
    },
    focus: {
        primary: '#1976D2',
        outline: '3px solid #1976D2',
        outlineOffset: '2px'
    }
};

// ============================================================================
// DARK MODE COLORS
// ============================================================================
export const accessibleDarkColors = {
    primary: {
        main: '#26A69A',
        light: '#4DB6AC',
        dark: '#00897B',
        contrastText: '#000000'
    },
    secondary: {
        main: '#FF8A65',
        light: '#FFAB91',
        dark: '#FF7043',
        contrastText: '#000000'
    },
    error: {
        main: '#EF5350',
        light: '#FF8A80',
        dark: '#E53935',
        contrastText: '#000000'
    },
    success: {
        main: '#66BB6A',
        light: '#81C784',
        dark: '#43A047',
        contrastText: '#000000'
    },
    warning: {
        main: '#FFB74D',
        light: '#FFD54F',
        dark: '#FB8C00',
        contrastText: '#000000'
    },
    info: {
        main: '#29B6F6',
        light: '#4FC3F7',
        dark: '#039BE5',
        contrastText: '#000000'
    },
    text: {
        primary: '#ECEFF1',
        secondary: '#CFD8DC',
        disabled: '#90A4AE',
        hint: '#B0BEC5'
    },
    background: {
        default: '#1A1A1A',
        paper: '#242424',
        elevated: '#2E2E2E'
    },
    divider: 'rgba(255, 255, 255, 0.12)',
    focus: {
        primary: '#26A69A',
        outline: '3px solid #26A69A',
        outlineOffset: '2px'
    }
};

// Warm Dark Mode
export const warmAccessibleDarkColors = {
    ...accessibleDarkColors,
    primary: {
        main: '#FF8A65',
        light: '#FFAB91',
        dark: '#FF7043',
        contrastText: '#000000'
    },
    secondary: {
        main: '#FFB74D',
        light: '#FFD54F',
        dark: '#FB8C00',
        contrastText: '#000000'
    },
    background: {
        default: '#1C1510',
        paper: '#2A1F1A',
        elevated: '#3A2F2A'
    },
    focus: {
        primary: '#FF8A65',
        outline: '3px solid #FF8A65',
        outlineOffset: '2px'
    }
};

// Cool Dark Mode
export const coolAccessibleDarkColors = {
    ...accessibleDarkColors,
    primary: {
        main: '#42A5F5',
        light: '#64B5F6',
        dark: '#1976D2',
        contrastText: '#000000'
    },
    secondary: {
        main: '#29B6F6',
        light: '#4FC3F7',
        dark: '#039BE5',
        contrastText: '#000000'
    },
    background: {
        default: '#0A1929',
        paper: '#132F4C',
        elevated: '#1E3A5F'
    },
    focus: {
        primary: '#42A5F5',
        outline: '3px solid #42A5F5',
        outlineOffset: '2px'
    }
};

// ============================================================================
// FONT FAMILIES
// ============================================================================
const fontFamilies = {
    default: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
    ].join(','),
    dyslexic: [
        'OpenDyslexic',
        'Comic Sans MS',
        'Arial',
        'sans-serif',
    ].join(','),
    monospace: [
        '"Courier New"',
        'Courier',
        'monospace',
    ].join(','),
};

// ============================================================================
// ACCESSIBLE THEME CONFIGURATION
// ============================================================================
export const createAccessibleTheme = (mode = 'light', config = {}) => {
    const {
        fontSizeMultiplier = 1,
        spacingScale = 1,
        contrastLevel = 'standard',
        fontFamily = 'default',
        colorTemperature = 'neutral',
    } = config;

    const isDark = mode === 'dark';

    // Select color palette based on temperature and mode
    let colors;
    if (isDark) {
        if (colorTemperature === 'warm') colors = warmAccessibleDarkColors;
        else if (colorTemperature === 'cool') colors = coolAccessibleDarkColors;
        else colors = accessibleDarkColors;
    } else {
        if (colorTemperature === 'warm') colors = warmAccessibleColors;
        else if (colorTemperature === 'cool') colors = coolAccessibleColors;
        else colors = accessibleColors;
    }

    // High contrast adjustments
    if (contrastLevel === 'high') {
        colors = {
            ...colors,
            text: {
                ...colors.text,
                primary: isDark ? '#FFFFFF' : '#000000',
                secondary: isDark ? '#E0E0E0' : '#1A1A1A',
            },
            background: {
                ...colors.background,
                default: isDark ? '#000000' : '#FFFFFF',
                paper: isDark ? '#0A0A0A' : '#FAFAFA',
            }
        };
    } else if (contrastLevel === 'maximum') {
        colors = {
            ...colors,
            text: {
                ...colors.text,
                primary: isDark ? '#FFFFFF' : '#000000',
                secondary: isDark ? '#F5F5F5' : '#000000',
            },
            background: {
                ...colors.background,
                default: isDark ? '#000000' : '#FFFFFF',
                paper: isDark ? '#000000' : '#FFFFFF',
            },
            divider: isDark ? '#FFFFFF' : '#000000',
        };
    }

    const baseFontSize = 16 * fontSizeMultiplier;
    const baseSpacing = 8 * spacingScale;

    return createTheme({
        palette: {
            mode,
            ...colors,
        },

        typography: {
            fontFamily: fontFamilies[fontFamily] || fontFamilies.default,
            fontSize: baseFontSize,
            htmlFontSize: baseFontSize,
            h1: {
                fontSize: `${2.5 * fontSizeMultiplier}rem`,
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: '-0.01562em',
                marginBottom: `${spacingScale}rem`,
                '@media (max-width:600px)': {
                    fontSize: `${2 * fontSizeMultiplier}rem`,
                }
            },
            h2: {
                fontSize: `${2 * fontSizeMultiplier}rem`,
                fontWeight: 600,
                lineHeight: 1.3,
                letterSpacing: '-0.00833em',
                marginBottom: `${0.875 * spacingScale}rem`,
                '@media (max-width:600px)': {
                    fontSize: `${1.75 * fontSizeMultiplier}rem`,
                }
            },
            h3: {
                fontSize: `${1.75 * fontSizeMultiplier}rem`,
                fontWeight: 600,
                lineHeight: 1.4,
                letterSpacing: '0em',
                marginBottom: `${0.75 * spacingScale}rem`,
                '@media (max-width:600px)': {
                    fontSize: `${1.5 * fontSizeMultiplier}rem`,
                }
            },
            h4: {
                fontSize: `${1.5 * fontSizeMultiplier}rem`,
                fontWeight: 600,
                lineHeight: 1.4,
                letterSpacing: '0.00735em',
                marginBottom: `${0.625 * spacingScale}rem`,
                '@media (max-width:600px)': {
                    fontSize: `${1.25 * fontSizeMultiplier}rem`,
                }
            },
            h5: {
                fontSize: `${1.25 * fontSizeMultiplier}rem`,
                fontWeight: 500,
                lineHeight: 1.5,
                letterSpacing: '0em',
                marginBottom: `${0.5 * spacingScale}rem`
            },
            h6: {
                fontSize: `${1.125 * fontSizeMultiplier}rem`,
                fontWeight: 500,
                lineHeight: 1.5,
                letterSpacing: '0.0075em',
                marginBottom: `${0.5 * spacingScale}rem`
            },
            body1: {
                fontSize: `${fontSizeMultiplier}rem`,
                fontWeight: 400,
                lineHeight: 1.6,
                letterSpacing: '0.00938em'
            },
            body2: {
                fontSize: `${0.875 * fontSizeMultiplier}rem`,
                fontWeight: 400,
                lineHeight: 1.6,
                letterSpacing: '0.01071em'
            },
            button: {
                fontSize: `${fontSizeMultiplier}rem`,
                fontWeight: 600,
                lineHeight: 1.75,
                letterSpacing: '0.02857em',
                textTransform: 'none'
            },
            caption: {
                fontSize: `${0.875 * fontSizeMultiplier}rem`,
                fontWeight: 400,
                lineHeight: 1.66,
                letterSpacing: '0.03333em'
            },
        },

        spacing: baseSpacing,
        shape: { borderRadius: 8 * spacingScale },

        breakpoints: {
            values: {
                xs: 0,
                sm: 600,
                md: 960,
                lg: 1280,
                xl: 1920
            }
        },

        transitions: {
            easing: {
                easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
                easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
                easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
                sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
            },
            duration: {
                shortest: 150,
                shorter: 200,
                short: 250,
                standard: 300,
                complex: 375,
                enteringScreen: 225,
                leavingScreen: 195,
            },
        },

        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    '*:focus-visible': {
                        outline: colors.focus.outline,
                        outlineOffset: colors.focus.outlineOffset,
                        borderRadius: '4px'
                    },
                    '*:focus:not(:focus-visible)': {
                        outline: 'none'
                    },
                    '@media (prefers-reduced-motion: reduce)': {
                        '*,*::before,*::after': {
                            animationDuration: '0.01ms !important',
                            animationIterationCount: '1 !important',
                            transitionDuration: '0.01ms !important',
                            scrollBehavior: 'auto !important'
                        }
                    },
                    body: {
                        margin: 0,
                        textRendering: 'optimizeLegibility',
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale',
                        fontSize: `${baseFontSize}px`,
                        lineHeight: 1.6,
                        msTextSizeAdjust: '100%',
                        WebkitTextSizeAdjust: '100%',
                    },
                    code: {
                        fontFamily: fontFamilies.monospace,
                        fontSize: '0.9em',
                        backgroundColor: isDark ? colors.background.elevated : '#f5f5f5',
                        padding: '2px 6px',
                        borderRadius: '3px',
                    }
                }
            },

            // Global disableRipple for ALL components
            MuiButtonBase: {
                defaultProps: {
                    disableRipple: true,
                    disableTouchRipple: true,
                }
            },

            MuiButton: {
                defaultProps: {
                    disableRipple: true,
                    disableTouchRipple: true,
                    disableElevation: true,
                },
                styleOverrides: {
                    root: {
                        minHeight: `${48 * spacingScale}px`,
                        minWidth: `${48 * spacingScale}px`,
                        fontSize: `${fontSizeMultiplier}rem`,
                        fontWeight: 600,
                        padding: `${12 * spacingScale}px ${24 * spacingScale}px`,
                        textTransform: 'none',
                        transition: `all var(--transition-duration, 200ms) ease-in-out`,
                        borderRadius: `${8 * spacingScale}px`,
                        boxShadow: 'none !important',

                        '&:hover': {
                            transform: spacingScale >= 1 ? 'translateY(-2px)' : 'none',
                            boxShadow: 'none !important',
                        },

                        '@media (max-width:600px)': {
                            minHeight: `${52 * spacingScale}px`,
                            fontSize: `${1.05 * fontSizeMultiplier}rem`,
                            padding: `${14 * spacingScale}px ${28 * spacingScale}px`,
                        }
                    },
                    sizeLarge: {
                        minHeight: `${56 * spacingScale}px`,
                        fontSize: `${1.125 * fontSizeMultiplier}rem`,
                        padding: `${16 * spacingScale}px ${32 * spacingScale}px`,
                    },
                    sizeSmall: {
                        minHeight: `${40 * spacingScale}px`,
                        fontSize: `${0.875 * fontSizeMultiplier}rem`,
                        padding: `${8 * spacingScale}px ${16 * spacingScale}px`,
                    }
                }
            },

            MuiTextField: {
                defaultProps: {
                    variant: 'outlined'
                },
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            minHeight: `${48 * spacingScale}px`,
                            borderRadius: `${8 * spacingScale}px`,
                            transition: 'all 200ms ease',

                            '&:hover': {
                                backgroundColor: alpha(colors.primary.main, 0.02),
                            },

                            '&.Mui-focused': {
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderWidth: '2px',
                                    borderColor: colors.primary.main,
                                }
                            },

                            '@media (max-width:600px)': {
                                minHeight: `${52 * spacingScale}px`,
                            }
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                            color: colors.primary.main,
                        }
                    }
                }
            },

            MuiIconButton: {
                defaultProps: {
                    disableRipple: true,
                    disableTouchRipple: true,
                },
                styleOverrides: {
                    root: {
                        minWidth: `${48 * spacingScale}px`,
                        minHeight: `${48 * spacingScale}px`,
                        padding: `${12 * spacingScale}px`,
                        borderRadius: `${8 * spacingScale}px`,

                        '&:focus-visible': {
                            outline: colors.focus.outline,
                            outlineOffset: colors.focus.outlineOffset,
                        },

                        '@media (max-width:600px)': {
                            minWidth: `${52 * spacingScale}px`,
                            minHeight: `${52 * spacingScale}px`,
                            padding: `${14 * spacingScale}px`,
                        }
                    }
                }
            },

            MuiListItemButton: {
                defaultProps: {
                    disableRipple: true,
                    disableTouchRipple: true,
                },
                styleOverrides: {
                    root: {
                        minHeight: `${48 * spacingScale}px`,

                        '@media (max-width:600px)': {
                            minHeight: `${56 * spacingScale}px`,
                        }
                    }
                }
            },

            MuiMenuItem: {
                defaultProps: {
                    disableRipple: true,
                    disableTouchRipple: true,
                },
                styleOverrides: {
                    root: {
                        minHeight: `${48 * spacingScale}px`,

                        '@media (max-width:600px)': {
                            minHeight: `${56 * spacingScale}px`,
                            fontSize: `${1.05 * fontSizeMultiplier}rem`,
                        }
                    }
                }
            },

            MuiMenu: {
                styleOverrides: {
                    paper: {
                        '@media (max-width:600px)': {
                            maxWidth: 'calc(100vw - 32px) !important',
                            minWidth: 'calc(100vw - 32px) !important',
                            left: '16px !important',
                            right: '16px !important',
                        }
                    }
                }
            },

            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: `${12 * spacingScale}px`,
                        boxShadow: `0 ${2 * spacingScale}px ${8 * spacingScale}px rgba(0,0,0,0.08)`,
                        transition: `all var(--transition-duration, 200ms) ease`,

                        '&:hover': {
                            boxShadow: `0 ${4 * spacingScale}px ${16 * spacingScale}px rgba(0,0,0,0.12)`,
                            transform: spacingScale >= 1 ? 'translateY(-2px)' : 'none',
                        }
                    }
                }
            },

            MuiPaper: {
                styleOverrides: {
                    root: {
                        borderRadius: `${8 * spacingScale}px`,
                    },
                    elevation1: {
                        boxShadow: `0 ${2 * spacingScale}px ${4 * spacingScale}px rgba(0,0,0,0.08)`,
                    },
                    elevation2: {
                        boxShadow: `0 ${4 * spacingScale}px ${8 * spacingScale}px rgba(0,0,0,0.10)`,
                    },
                    elevation3: {
                        boxShadow: `0 ${6 * spacingScale}px ${12 * spacingScale}px rgba(0,0,0,0.12)`,
                    }
                }
            },

            MuiLink: {
                defaultProps: {
                    underline: 'hover'
                },
                styleOverrides: {
                    root: {
                        color: colors.primary.main,
                        textDecorationThickness: '2px',
                        textUnderlineOffset: '2px',
                        transition: 'all 150ms ease',

                        '&:hover': {
                            color: colors.primary.dark,
                            textDecorationThickness: '2px'
                        },

                        '&:focus-visible': {
                            outline: colors.focus.outline,
                            outlineOffset: colors.focus.outlineOffset,
                            borderRadius: '2px',
                        }
                    }
                }
            },

            MuiChip: {
                styleOverrides: {
                    root: {
                        borderRadius: `${16 * spacingScale}px`,
                        fontSize: `${0.875 * fontSizeMultiplier}rem`,
                        height: `${32 * spacingScale}px`,
                    }
                }
            },

            MuiTooltip: {
                styleOverrides: {
                    tooltip: {
                        fontSize: `${0.875 * fontSizeMultiplier}rem`,
                        padding: `${8 * spacingScale}px ${12 * spacingScale}px`,
                        borderRadius: `${4 * spacingScale}px`,
                    }
                }
            }
        }
    });
};

export default createAccessibleTheme;