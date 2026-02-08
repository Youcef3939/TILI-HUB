import React, { forwardRef } from 'react';
import { TextField } from '@mui/material';
import { Controller } from 'react-hook-form';
import { styled } from '@mui/material/styles';

const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: theme.shape.borderRadius,
        fontSize: '0.95rem',
        transition: 'all 0.2s ease',
        '&:hover': {
            borderColor: theme.palette.primary.main,
        },
        '&.Mui-focused': {
            boxShadow: `0 0 0 3px ${theme.palette.primary.light}`,
        },
    },
    '& .MuiOutlinedInput-input': {
        padding: '14px 12px',
        fontSize: '0.95rem',
    },
    '& .MuiInputLabel-root': {
        fontSize: '0.95rem',
        transform: 'translate(14px, 16px) scale(1)',
        '&.Mui-focused, &.MuiInputLabel-shrink': {
            transform: 'translate(14px, -9px) scale(0.75)',
        },
    },
    '& .MuiFormHelperText-root': {
        fontSize: '0.8rem',
        marginTop: '6px',
    },
}));

const FormField = forwardRef(({
    name,
    label,
    control,
    type = 'text',
    placeholder,
    fullWidth = true,
    required = false,
    error = false,
    helperText = '',
    InputProps = {},
    disabled = false,
    select = false,
    children,
    ...rest
}, ref) => {
    if (!control) {
        return (
            <StyledTextField
                name={name}
                label={label}
                type={type}
                placeholder={placeholder}
                variant="outlined"
                fullWidth={fullWidth}
                required={required}
                error={error}
                helperText={helperText}
                disabled={disabled}
                InputLabelProps={{ shrink: true }}
                InputProps={InputProps}
                select={select}
                ref={ref}
                {...rest}
            >
                {children}
            </StyledTextField>
        );
    }

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <StyledTextField
                    {...field}
                    {...rest}
                    label={label}
                    type={type}
                    placeholder={placeholder}
                    variant="outlined"
                    fullWidth={fullWidth}
                    required={required}
                    error={error}
                    helperText={helperText}
                    disabled={disabled}
                    InputLabelProps={{ shrink: true }}
                    InputProps={InputProps}
                    select={select}
                    ref={ref}
                >
                    {children}
                </StyledTextField>
            )}
        />
    );
});

FormField.displayName = 'FormField';

export default FormField;