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

export default function MyTextField(props) {
    const { label, name, control, placeholder, error: errorProp, helperText: helperTextProp } = props;

    return (
        <Controller
            name={name}
            control={control}
            render={({
                field: { onChange, value },
                fieldState: { error },
            }) => (
                <StyledTextField
                    id={`textfield-${name}`}
                    onChange={onChange}
                    value={value || ''}
                    label={label}
                    placeholder={placeholder}
                    variant="outlined"
                    fullWidth
                    error={!!error || !!errorProp}
                    helperText={error?.message || helperTextProp}
                    size="medium"
                />
            )}
        />

    );
}