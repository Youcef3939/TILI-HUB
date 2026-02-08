import React from 'react';
import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledButton = styled(Button)(({ theme }) => ({
    textTransform: 'none',
    borderRadius: theme.shape.borderRadius,
    fontWeight: 600,
    fontSize: '0.95rem',
    padding: '10px 24px',
    minHeight: '44px',
    minWidth: '120px',
    transition: 'all 0.2s ease',
    '&:hover': {
        transform: 'translateY(-2px)',
    },
    '&.MuiButton-contained': {
        boxShadow: theme.shadows[4],
        '&:hover': {
            boxShadow: theme.shadows[6],
        },
    },
    '&.MuiButton-outlined': {
        borderWidth: '2px',
        '&:hover': {
            borderWidth: '2px',
        },
    },
    '&:disabled': {
        opacity: 0.6,
    },
}));

const MyButton = ({
    label,
    type = 'button',
    onClick,
    fullWidth = false,
    disabled = false,
    variant = 'contained',
    color = 'primary',
    className = '',
    size = 'medium',
    startIcon = null,
    endIcon = null,
    sx = {},
    ...rest
}) => {
    return (
        <StyledButton
            type={type}
            onClick={onClick}
            fullWidth={fullWidth}
            disabled={disabled}
            variant={variant}
            color={color}
            className={className}
            size={size}
            startIcon={startIcon}
            endIcon={endIcon}
            sx={sx}
            {...rest}
        >
            {label}
        </StyledButton>
    );
};

export default MyButton;