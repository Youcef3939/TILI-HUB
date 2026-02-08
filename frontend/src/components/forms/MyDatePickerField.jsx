import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Controller } from 'react-hook-form';
import { styled } from '@mui/material/styles';

const StyledDatePicker = styled(DatePicker)(({ theme }) => ({
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
    },
}));

export default function MyDatePickerField(props) {
    const { label, control, name, error: errorProp, helperText: helperTextProp } = props;

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Controller
                name={name}
                control={control}
                render={({
                    field: { onChange, value },
                    fieldState: { error },
                }) => (
                    <StyledDatePicker
                        label={label}
                        onChange={onChange}
                        value={value}
                        slotProps={{
                            textField: {
                                fullWidth: true,
                                error: !!error || !!errorProp,
                                helperText: error?.message || helperTextProp,
                            },
                        }}
                    />
                )}
            />

        </LocalizationProvider>
    );
}