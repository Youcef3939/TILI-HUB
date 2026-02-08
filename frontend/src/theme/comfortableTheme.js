/**
 * Comfortable Theme Configuration
 * Soft, warm colors with excellent readability
 * SIMPLIFIED BUTTONS - NO RIPPLE EFFECTS
 */
import { createTheme, alpha } from '@mui/material/styles';

// ============================================================================
// COMFORTABLE COLOR PALETTES - Soft & Warm (WCAG AA compliant)
// ============================================================================

// Neutral/Standard Colors (default)
export const comfortableLightColors = {
    primary: {
        main: '#5D7B8F',
        light: '#8BA3B5',
        dark: '#3D5A6B',
        contrastText: '#FFFFFF'
    },
    secondary: {
        main: '#C17C6B',
        light: '#D19A8B',
        dark: '#A85E4D',
        contrastText: '#FFFFFF'
    },
    error: {
        main: '#D84848',
        light: '#E06E6E',
        dark: '#B83232',
        contrastText: '#FFFFFF'
    },
    success: {
        main: '#5B9B6E',
        light: '#7BB28C',
        dark: '#3F7D52',
        contrastText: '#FFFFFF'
    },
    warning: {
        main: '#E89541',
        light: '#EFAA68',
        dark: '#D07A29',
        contrastText: '#000000'
    },
    info: {
        main: '#5B8DB8',
        light: '#7BA5C8',
        dark: '#3F6F98',
        contrastText: '#FFFFFF'
    },
    text: {
        primary: '#2A2A2A',
        secondary: '#555555',
        disabled: '#9E9E9E',
        hint: '#757575'
    },
    background: {
        default: '#F7F9FC',
        paper: '#FFFFFF',
        elevated: '#FAFCFE'
    },
    divider: '#E5E9ED',
    focus: {
        primary: '#5D7B8F',
        outline: '3px solid #5D7B8F',
        outlineOffset: '2px'
    }
};

// Warm Temperature Variant
export const warmComfortableLightColors = {
    ...comfortableLightColors,
    primary: {
        main: '#B8704E',
        light: '#C98F6F',
        dark: '#9A5236',
        contrastText: '#FFFFFF'
    },
    secondary: {
        main: '#D89A6B',
        light: '#E5B38B',
        dark: '#C17C4D',
        contrastText: '#FFFFFF'
    },
    background: {
        default: '#FFF9F5',
        paper: '#FFFFFF',
        elevated: '#FFFBF8'
    },
    focus: {
        primary: '#B8704E',
        outline: '3px solid #B8704E',
        outlineOffset: '2px'
    }
};

// Cool Temperature Variant
export const coolComfortableLightColors = {
    ...comfortableLightColors,
    primary: {
        main: '#4A7BA7',
        light: '#6D97BD',
        dark: '#2F5C85',
        contrastText: '#FFFFFF'
    },
    secondary: {
        main: '#5B8DB8',
        light: '#7BA5C8',
        dark: '#3F6F98',
        contrastText: '#FFFFFF'
    },
    background: {
        default: '#F5F8FB',
        paper: '#FFFFFF',
        elevated: '#FAFCFD'
    },
    focus: {
        primary: '#4A7BA7',
        outline: '3px solid #4A7BA7',
        outlineOffset: '2px'
    }
};

// ============================================================================
// DARK MODE COLORS (Comfortable & Easy on Eyes)
// ============================================================================
export const comfortableDarkColors = {
    primary: {
        main: '#8BA3B5',
        light: '#A8BCC9',
        dark: '#6D8898',
        contrastText: '#000000'
    },
    secondary: {
        main: '#D19A8B',
        light: '#E0B5A8',
        dark: '#B87E6E',
        contrastText: '#000000'
    },
    error: {
        main: '#E06E6E',
        light: '#E88E8E',
        dark: '#D84848',
        contrastText: '#000000'
    },
    success: {
        main: '#7BB28C',
        light: '#96C4A4',
        dark: '#5B9B6E',
        contrastText: '#000000'
    },
    warning: {
        main: '#EFAA68',
        light: '#F4C090',
        dark: '#E89541',
        contrastText: '#000000'
    },
    info: {
        main: '#7BA5C8',
        light: '#9CBBD9',
        dark: '#5B8DB8',
        contrastText: '#000000'
    },
    text: {
        primary: '#E8E8E8',
        secondary: '#C0C0C0',
        disabled: '#888888',
        hint: '#A0A0A0'
    },
    background: {
        default: '#1C1C1E',
        paper: '#2C2C2E',
        elevated: '#3A3A3C'
    },
    divider: 'rgba(255, 255, 255, 0.12)',
    focus: {
        primary: '#8BA3B5',
        outline: '3px solid #8BA3B5',
        outlineOffset: '2px'
    }
};

// Warm Dark Mode
export const warmComfortableDarkColors = {
    ...comfortableDarkColors,
    primary: {
        main: '#C98F6F',
        light: '#D9A98C',
        dark: '#B8704E',
        contrastText: '#000000'
    },
    secondary: {
        main: '#E0B5A8',
        light: '#EDC9BE',
        dark: '#D19A8B',
        contrastText: '#000000'
    },
    background: {
        default: '#1F1812',
        paper: '#2D2218',
        elevated: '#3D3228'
    },
    focus: {
        primary: '#C98F6F',
        outline: '3px solid #C98F6F',
        outlineOffset: '2px'
    }
};

// Cool Dark Mode
export const coolComfortableDarkColors = {
    ...comfortableDarkColors,
    primary: {
        main: '#6D97BD',
        light: '#8BAED0',
        dark: '#4A7BA7',
        contrastText: '#000000'
    },
    secondary: {
        main: '#7BA5C8',
        light: '#9CBBD9',
        dark: '#5B8DB8',
        contrastText: '#000000'
    },
    background: {
        default: '#111821',
        paper: '#1A2332',
        elevated: '#253346'
    },
    focus: {
        primary: '#6D97BD',
        outline: '3px solid #6D97BD',
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
// COMFORTABLE THEME CONFIGURATION
// ============================================================================
export const createComfortableTheme = (mode = 'light', config = {}) => {
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
        if (colorTemperature === 'warm') colors = warmComfortableDarkColors;
        else if (colorTemperature === 'cool') colors = coolComfortableDarkColors;
        else colors = comfortableDarkColors;
    } else {
        if (colorTemperature === 'warm') colors = warmComfortableLightColors;
        else if (colorTemperature === 'cool') colors = coolComfortableLightColors;
        else colors = comfortableLightColors;
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
                lineHeight: 1.3,
                letterSpacing: '-0.01562em',
                marginBottom: `${1 * spacingScale}rem`,
                '@media (max-width:600px)': {
                    fontSize: `${2 * fontSizeMultiplier}rem`,
                }
            },
            h2: {
                fontSize: `${2 * fontSizeMultiplier}rem`,
                fontWeight: 600,
                lineHeight: 1.35,
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
                fontWeight: 600,
                lineHeight: 1.5,
                letterSpacing: '0em',
                marginBottom: `${0.5 * spacingScale}rem`,
                '@media (max-width:600px)': {
                    fontSize: `${1.15 * fontSizeMultiplier}rem`,
                }
            },
            h6: {
                fontSize: `${1.125 * fontSizeMultiplier}rem`,
                fontWeight: 600,
                lineHeight: 1.5,
                letterSpacing: '0.0075em',
                marginBottom: `${0.5 * spacingScale}rem`,
                '@media (max-width:600px)': {
                    fontSize: `${1 * fontSizeMultiplier}rem`,
                }
            },
            body1: {
                fontSize: `${1 * fontSizeMultiplier}rem`,
                fontWeight: 400,
                lineHeight: 1.6,
                letterSpacing: '0.00938em',
                '@media (max-width:600px)': {
                    fontSize: `${1.05 * fontSizeMultiplier}rem`,
                }
            },
            body2: {
                fontSize: `${0.875 * fontSizeMultiplier}rem`,
                fontWeight: 400,
                lineHeight: 1.6,
                letterSpacing: '0.01071em',
                '@media (max-width:600px)': {
                    fontSize: `${0.95 * fontSizeMultiplier}rem`,
                }
            },
            button: {
                fontSize: `${1 * fontSizeMultiplier}rem`,
                fontWeight: 600,
                lineHeight: 1.75,
                letterSpacing: '0.02857em',
                textTransform: 'none',
                '@media (max-width:600px)': {
                    fontSize: `${1.05 * fontSizeMultiplier}rem`,
                }
            },
            caption: {
                fontSize: `${0.875 * fontSizeMultiplier}rem`,
                fontWeight: 400,
                lineHeight: 1.66,
                letterSpacing: '0.03333em',
                '@media (max-width:600px)': {
                    fontSize: `${0.95 * fontSizeMultiplier}rem`,
                }
            },
        },

        spacing: baseSpacing,
        shape: { borderRadius: 12 * spacingScale },

        breakpoints: {
            values: {
                xs: 0,
                sm: 600,
                md: 960,
                lg: 1280,
                xl: 1920
            }
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
                        fontSize: `${1 * fontSizeMultiplier}rem`,
                        fontWeight: 600,
                        padding: `${12 * spacingScale}px ${24 * spacingScale}px`,
                        textTransform: 'none',
                        transition: `all var(--transition-duration, 200ms) ease-in-out`,
                        borderRadius: `${12 * spacingScale}px`,
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
                            borderRadius: `${12 * spacingScale}px`,
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
                        borderRadius: `${12 * spacingScale}px`,

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
                        borderRadius: `${16 * spacingScale}px`,
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
                        borderRadius: `${12 * spacingScale}px`,
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
                        borderRadius: `${6 * spacingScale}px`,
                    }
                }
            }
        }
    });
};

export default createComfortableTheme;