import { TextField } from '@mui/material';
import { Controller } from 'react-hook-form';
import { styled } from '@mui/material/styles';

const StyledMultilineField = styled(TextField)(({ theme }) => ({
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
        lineHeight: '1.5',
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

export default function MyMultilineField(props) {
    const { label, placeholder, name, control, rows = 4, error: errorProp, helperText: helperTextProp } = props;

    return (
        <Controller
            name={name}
            control={control}
            render={({
                field: { onChange, value },
                fieldState: { error },
            }) => (
                <StyledMultilineField
                    id={`multiline-${name}`}
                    label={label}
                    multiline
                    rows={rows}
                    onChange={onChange}
                    value={value || ''}
                    placeholder={placeholder}
                    variant="outlined"
                    fullWidth
                    error={!!error || !!errorProp}
                    helperText={error?.message || helperTextProp}
                />
            )}
        />
    );
}